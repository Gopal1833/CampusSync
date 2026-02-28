// ========================================
// Student Routes
// ========================================
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// @route   GET /api/students
// @desc    Get all students (with optional filters)
router.get('/', auth, async (req, res) => {
    try {
        const { class: cls, section, search } = req.query;
        let query = { isActive: true, schoolId: req.schoolId };

        if (cls) query.class = cls;
        if (section) query.section = section;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { admissionNumber: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // If student role, only show their own data
        if (req.user.role === 'student') {
            query.userId = req.user.id;
        }

        const students = await Student.find(query).sort({ class: 1, rollNumber: 1 });
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!student) return res.status(404).json({ msg: 'Student not found' });
        res.json(student);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/students
// @desc    Add new student (admin only) with auto user creation
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Use admin-provided admission number, or auto-generate if not given
        let admissionNumber = req.body.admissionNumber ? req.body.admissionNumber.trim() : null;

        if (!admissionNumber) {
            // Fallback: auto-generate unique STUxxxxx
            let isUnique = false;
            while (!isUnique) {
                admissionNumber = 'STU' + Math.floor(10000 + Math.random() * 90000);
                const existing = await Student.findOne({ admissionNumber, schoolId: req.schoolId });
                if (!existing) isUnique = true;
            }
        } else {
            // Check if admin-provided ID is already taken
            const existing = await Student.findOne({ admissionNumber, schoolId: req.schoolId });
            if (existing) {
                return res.status(400).json({ msg: `Admission number "${admissionNumber}" already exists` });
            }
        }

        const studentData = { ...req.body, admissionNumber, schoolId: req.schoolId };

        const student = new Student(studentData);
        await student.save();

        // Auto-create login credentials:
        // Username = admissionNumber, Password = admissionNumber (hashed)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(admissionNumber, salt);

        const emailToUse = studentData.email || `${admissionNumber}@student.com`;

        const user = new User({
            username: admissionNumber,
            email: emailToUse,
            password: hashedPassword,
            role: 'student',
            name: studentData.name,
            phone: studentData.phone,
            profileId: student._id,
            schoolId: req.schoolId
        });
        await user.save();

        // Link user to student
        student.userId = user._id;
        await student.save();

        console.log(`✅ Student created: ${studentData.name} | Login ID & Password: ${admissionNumber}`);
        res.json({ msg: 'Student added successfully', student });
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Admission number already exists. Use a different one.' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/students/:id
// @desc    Update student (admin only) with User sync
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        let student = await Student.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        // Sync updated fields to linked User account
        if (student.userId) {
            const userUpdate = {};
            if (req.body.name) userUpdate.name = req.body.name;
            if (req.body.email) userUpdate.email = req.body.email;
            if (req.body.phone) userUpdate.phone = req.body.phone;
            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(student.userId, userUpdate);
            }
        }

        res.json({ msg: 'Student updated successfully', student });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/students/:id
// @desc    Soft delete student
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        let student = await Student.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        student = await Student.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

        // Also deactivate user account
        if (student.userId) {
            await User.findByIdAndUpdate(student.userId, { isActive: false });
        }

        res.json({ msg: 'Student removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
