// ========================================
// Homework Routes
// ========================================
const express = require('express');
const router = express.Router();
const Homework = require('../models/Homework');
const Teacher = require('../models/Teacher');

const auth = require('../middleware/auth');

// @route   GET /api/homework
// @desc    Get homework (filtered by role)
router.get('/', auth, async (req, res) => {
    try {
        let query = { isActive: true, schoolId: req.user.schoolId };
        const { class: cls, section } = req.query;

        if (req.user.role === 'teacher') {
            // Teachers see only their homework
            const teacher = await Teacher.findOne({ userId: req.user.id });
            if (teacher) {
                query.teacher = teacher._id;
            }
        } else {
            // Admin can filter
            if (cls) query.class = cls;
            if (section) query.section = section;
        }

        const homework = await Homework.find(query)
            .sort({ createdAt: -1 })
            .populate('teacher', 'name subject')
            .populate('submissions.student', 'name admissionNumber');

        res.json(homework);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/homework
// @desc    Create homework (teacher/admin)
router.post('/', auth, async (req, res) => {
    try {

        const { class: cls, section, subject, title, description, dueDate } = req.body;

        // Validation
        if (!cls || !subject || !title || !description || !dueDate) {
            return res.status(400).json({ msg: 'Please fill all required fields' });
        }

        let teacherId, teacherName;
        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ userId: req.user.id });
            if (!teacher) return res.status(404).json({ msg: 'Teacher profile not found' });
            teacherId = teacher._id;
            teacherName = teacher.name;
        } else {
            // Admin — use provided teacherId or use admin name
            teacherId = req.body.teacherId;
            teacherName = req.body.teacherName || req.user.name;
            if (!teacherId) {
                // Create a placeholder
                teacherName = req.user.name;
                // Try to find any teacher
                const anyTeacher = await Teacher.findOne({ isActive: true });
                teacherId = anyTeacher ? anyTeacher._id : null;
                if (!teacherId) return res.status(400).json({ msg: 'No teacher available' });
            }
        }

        const homework = new Homework({
            teacher: teacherId,
            teacherName,
            class: cls,
            section: section || 'A',
            subject,
            title,
            description,
            dueDate: new Date(dueDate),
            schoolId: req.user.schoolId
        });

        await homework.save();
        res.json({ msg: 'Homework created successfully', homework });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/homework/:id
// @desc    Update homework
router.put('/:id', auth, async (req, res) => {
    try {

        const homework = await Homework.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            req.body,
            { new: true }
        );
        if (!homework) return res.status(404).json({ msg: 'Homework not found or unauthorized' });

        res.json({ msg: 'Homework updated', homework });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/homework/:id
// @desc    Delete homework (soft)
router.delete('/:id', auth, async (req, res) => {
    try {

        const homework = await Homework.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            { isActive: false }
        );
        if (!homework) return res.status(404).json({ msg: 'Homework not found or unauthorized' });
        res.json({ msg: 'Homework deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


module.exports = router;
