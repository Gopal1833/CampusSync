// ========================================
// Authentication Routes
// ========================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const School = require('../models/School');
const auth = require('../middleware/auth');

// ========================================
// Email Transporter Configuration
// ========================================
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// @route   POST /api/auth/login
// @desc    Login user & get token
router.post('/login', async (req, res) => {
    try {
        const { schoolName, email, password, loginId, role } = req.body;

        let user, school;

        if (role === 'admin') {
            school = await School.findOne({ schoolName: new RegExp(`^${schoolName.trim()}$`, 'i') });
            if (!school) {
                return res.status(400).json({ msg: 'School not found. Please check the spelling.' });
            }
            user = await User.findOne({ email, schoolId: school._id });
        } else {
            user = await User.findOne({ username: loginId });
            if (user) {
                school = await School.findById(user.schoolId);
            }
        }

        if (!user || !school) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ msg: 'Account is deactivated. Contact admin.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create JWT payload
        const payload = {
            user: {
                id: user._id,
                role: user.role,
                name: user.name,
                email: user.email,
                profileId: user.profileId,
                schoolId: school._id
            }
        };

        // Sign token
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    role: user.role,
                    email: user.email,
                    profileId: user.profileId,
                    schoolName: school.schoolName
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/auth/register
// @desc    Register new user (admin only)
router.post('/register', auth, async (req, res) => {
    try {
        // Only admin can register users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { email, password, role, name, phone, profileId } = req.body;

        // Check if user exists in the same school
        let user = await User.findOne({ email, schoolId: req.user.schoolId });
        if (user) {
            return res.status(400).json({ msg: 'User already exists in this school' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username: email, // Fallback if still using username somewhere
            email,
            password: hashedPassword,
            role,
            name,
            phone,
            profileId,
            schoolId: req.user.schoolId
        });

        await user.save();
        res.json({ msg: 'User registered successfully', user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ========================================
// FORGOT PASSWORD
// ========================================
// @route   POST /api/auth/forgot-password
// @desc    Send password reset email with JWT token
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, schoolName } = req.body;

        if (!email || !schoolName) {
            return res.status(400).json({ msg: 'Please provide both school name and registered email address' });
        }

        // Find school first
        const school = await School.findOne({ schoolName: new RegExp(`^${schoolName.trim()}$`, 'i') });
        if (!school) {
            return res.json({ msg: 'If this email and school name match our records, a password reset link has been sent.' });
        }

        // Find user by email and schoolId
        const user = await User.findOne({ email: email.toLowerCase().trim(), schoolId: school._id });
        if (!user) {
            // Don't reveal whether email exists — always show success
            return res.json({ msg: 'If this email and school code match our records, a password reset link has been sent.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ msg: 'This account is deactivated. Contact admin.' });
        }

        // Generate reset token (JWT with 15min expiry)
        const resetPayload = {
            user: {
                id: user._id,
                email: user.email,
                type: 'password-reset'
            }
        };

        const resetToken = jwt.sign(resetPayload, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Build reset URL
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        const resetUrl = `${baseUrl}/?resetToken=${resetToken}#reset-password`;

        // Send email
        try {
            const transporter = createTransporter();
            const mailOptions = {
                from: `"${school.schoolName}" <${process.env.EMAIL_USER || 'noreply@campussync.com'}>`,
                to: user.email,
                subject: `Password Reset — ${school.schoolName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
                        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 22px;">🏫 ${school.schoolName}</h1>
                            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">${school.schoolAddress || 'Powered by CampusSync'}</p>
                        </div>
                        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <h2 style="color: #1e293b; font-size: 18px;">Password Reset Request</h2>
                            <p style="color: #475569; line-height: 1.7;">Hello <strong>${user.name}</strong>,</p>
                            <p style="color: #475569; line-height: 1.7;">We received a request to reset your password. Click the button below to set a new password:</p>
                            <div style="text-align: center; margin: 28px 0;">
                                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                    Reset My Password
                                </a>
                            </div>
                            <p style="color: #94a3b8; font-size: 13px; line-height: 1.7;">This link will expire in <strong>15 minutes</strong>. If you did not request this, please ignore this email.</p>
                            <hr style="border: 1px solid #e2e8f0; margin: 24px 0;">
                            <p style="color: #94a3b8; font-size: 11px; text-align: center;">${school.schoolName}</p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✉️ Password reset email sent to ${user.email}`);
        } catch (emailErr) {
            console.error('Email sending failed:', emailErr.message);
            // Still return success with token info for development
            console.log(`🔑 Reset token for ${user.username}: ${resetToken}`);
        }

        res.json({
            msg: 'If this email is registered, a password reset link has been sent.',
            // Include token in development mode for testing
            ...(process.env.NODE_ENV !== 'production' && { resetToken })
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ========================================
// RESET PASSWORD
// ========================================
// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using JWT token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (tokenErr) {
            if (tokenErr.name === 'TokenExpiredError') {
                return res.status(400).json({ msg: 'Reset link has expired. Please request a new one.' });
            }
            return res.status(400).json({ msg: 'Invalid reset link. Please request a new one.' });
        }

        // Validate token type
        if (!decoded.user || decoded.user.type !== 'password-reset') {
            return res.status(400).json({ msg: 'Invalid reset token' });
        }

        // Find user
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        console.log(`🔐 Password reset successful for user: ${user.username}`);
        res.json({ msg: 'Password has been reset successfully! You can now login with your new password.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/auth/reset-dob
// @desc    Reset password using Date of Birth
router.post('/reset-dob', async (req, res) => {
    try {
        const { loginId, dob, newPassword } = req.body;

        if (!loginId || !dob || !newPassword) {
            return res.status(400).json({ msg: 'Please provide User ID, Date of Birth, and New Password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
        }

        const user = await User.findOne({ username: loginId });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        let profileMatch = false;
        if (user.role === 'student') {
            const Student = require('../models/Student');
            const student = await Student.findOne({ _id: user.profileId });
            if (student && student.dateOfBirth) {
                const storedDob = new Date(student.dateOfBirth).toISOString().split('T')[0];
                const inputDob = new Date(dob).toISOString().split('T')[0];
                if (storedDob === inputDob) profileMatch = true;
            }
        } else if (user.role === 'teacher') {
            const Teacher = require('../models/Teacher');
            const teacher = await Teacher.findOne({ _id: user.profileId });
            if (teacher && teacher.dateOfBirth) {
                const storedDob = new Date(teacher.dateOfBirth).toISOString().split('T')[0];
                const inputDob = new Date(dob).toISOString().split('T')[0];
                if (storedDob === inputDob) profileMatch = true;
            }
        }

        if (!profileMatch) {
            return res.status(400).json({ msg: 'Date of Birth does not match our records' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password has been reset successfully! You can now login with your new password.' });
    } catch (err) {
        console.error('Reset via DOB error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
