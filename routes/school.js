const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const School = require('../models/School');
const User = require('../models/User');

// @route   POST /api/school/register-school
// @desc    Register a new school and its first admin
// @access  Public
router.post('/register-school', [
    body('schoolName', 'School name is required').not().isEmpty(),
    body('schoolEmail', 'Valid email is required').isEmail(),
    body('schoolPhone', 'Phone number is required').not().isEmpty(),
    body('schoolAddress', 'Address is required').not().isEmpty(),
    body('adminName', 'Admin name is required').not().isEmpty(),
    body('adminPassword', 'Password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { schoolName, schoolEmail, schoolPhone, schoolAddress, schoolLogo, adminName, adminPassword } = req.body;

    try {
        // Check if school with same email already exists
        let existingSchool = await School.findOne({ schoolEmail });
        if (existingSchool) {
            return res.status(400).json({ msg: 'School with this email already exists' });
        }

        // Generate school code
        const initials = schoolName.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 3);
        const randomNum = Math.floor(100 + Math.random() * 900);
        let schoolCode = `${initials}${randomNum}`;

        // Ensure uniqueness (simple loop)
        while (await School.findOne({ schoolCode })) {
            const tempNum = Math.floor(100 + Math.random() * 900);
            schoolCode = `${initials}${tempNum}`;
        }

        // Create new School
        const school = new School({
            schoolName,
            schoolEmail,
            schoolPhone,
            schoolAddress,
            schoolLogo,
            schoolCode
        });

        await school.save();

        // Hash admin password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create initial admin user
        const adminUser = new User({
            name: adminName,
            username: `${schoolCode}_admin`, // fallback username
            email: schoolEmail,
            password: hashedPassword,
            role: 'admin',
            schoolId: school._id
        });

        await adminUser.save();

        res.status(201).json({
            msg: 'School registered successfully',
            schoolCode,
            school: {
                id: school._id,
                name: school.schoolName
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
