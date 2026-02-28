// ========================================
// Teacher Routes
// ========================================
const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// @route   GET /api/teachers
// @desc    Get all teachers
router.get('/', auth, async (req, res) => {
    try {
        const teachers = await Teacher.find({ isActive: true, schoolId: req.schoolId }).sort({ name: 1 });
        res.json(teachers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });
        res.json(teacher);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/teachers
// @desc    Add new teacher (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Use admin-provided employee ID, or auto-generate if not given
        let employeeId = req.body.employeeId ? req.body.employeeId.trim() : null;

        if (!employeeId) {
            // Fallback: auto-generate unique EMPxxxxx
            let isUnique = false;
            while (!isUnique) {
                employeeId = 'EMP' + Math.floor(10000 + Math.random() * 90000);
                const existing = await Teacher.findOne({ employeeId, schoolId: req.schoolId });
                if (!existing) isUnique = true;
            }
        } else {
            // Check if admin-provided ID is already taken
            const existing = await Teacher.findOne({ employeeId, schoolId: req.schoolId });
            if (existing) {
                return res.status(400).json({ msg: `Employee ID "${employeeId}" already exists` });
            }
        }

        const teacherData = { ...req.body, employeeId, schoolId: req.schoolId };

        const teacher = new Teacher(teacherData);
        await teacher.save();

        // Auto-create login credentials:
        // Username = employeeId, Password = employeeId (hashed)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(employeeId, salt);

        const emailToUse = teacherData.email || `${employeeId}@teacher.com`;

        const user = new User({
            username: employeeId,
            email: emailToUse,
            password: hashedPassword,
            role: 'teacher',
            name: teacherData.name,
            phone: teacherData.phone,
            profileId: teacher._id,
            schoolId: req.schoolId
        });
        await user.save();

        teacher.userId = user._id;
        await teacher.save();

        console.log(`✅ Teacher created: ${teacherData.name} | Login ID & Password: ${employeeId}`);
        res.json({ msg: 'Teacher added successfully', teacher });
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Employee ID already exists. Use a different one.' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher (admin only) with User sync
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        let teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

        teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        // Sync updated fields to linked User account
        if (teacher.userId) {
            const userUpdate = {};
            if (req.body.name) userUpdate.name = req.body.name;
            if (req.body.email) userUpdate.email = req.body.email;
            if (req.body.phone) userUpdate.phone = req.body.phone;
            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(teacher.userId, userUpdate);
            }
        }

        res.json({ msg: 'Teacher updated successfully', teacher });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/teachers/:id
// @desc    Soft delete teacher
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        let teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

        teacher = await Teacher.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

        if (teacher.userId) {
            await User.findByIdAndUpdate(teacher.userId, { isActive: false });
        }

        res.json({ msg: 'Teacher removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
