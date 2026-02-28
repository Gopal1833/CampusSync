// ========================================
// Homework Routes
// ========================================
const express = require('express');
const router = express.Router();
const Homework = require('../models/Homework');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// @route   GET /api/homework
// @desc    Get homework (filtered by role)
router.get('/', auth, async (req, res) => {
    try {
        let query = { isActive: true, schoolId: req.schoolId };
        const { class: cls, section } = req.query;

        if (req.user.role === 'student') {
            // Students see homework for their class
            const student = await Student.findOne({ userId: req.user.id, schoolId: req.schoolId });
            if (student) {
                query.class = student.class;
                query.section = student.section;
            }
        } else if (req.user.role === 'teacher') {
            // Teachers see only their homework
            const teacher = await Teacher.findOne({ userId: req.user.id, schoolId: req.schoolId });
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
        if (req.user.role === 'student') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { class: cls, section, subject, title, description, dueDate } = req.body;

        // Validation
        if (!cls || !subject || !title || !description || !dueDate) {
            return res.status(400).json({ msg: 'Please fill all required fields' });
        }

        let teacherId, teacherName;
        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ userId: req.user.id, schoolId: req.schoolId });
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
                const anyTeacher = await Teacher.findOne({ isActive: true, schoolId: req.schoolId });
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
            schoolId: req.schoolId
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
        if (req.user.role === 'student') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const homework = await Homework.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
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
        if (req.user.role === 'student') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const homework = await Homework.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            { isActive: false }
        );
        if (!homework) return res.status(404).json({ msg: 'Homework not found or unauthorized' });
        res.json({ msg: 'Homework deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/homework/:id/submit
// @desc    Student submits homework
router.post('/:id/submit', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Only students can submit homework' });
        }

        const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId });
        if (!homework) return res.status(404).json({ msg: 'Homework not found' });

        const student = await Student.findOne({ userId: req.user.id, schoolId: req.schoolId });
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        // Check if already submitted
        const existingSubmission = homework.submissions.find(
            s => s.student.toString() === student._id.toString()
        );
        if (existingSubmission) {
            return res.status(400).json({ msg: 'Already submitted' });
        }

        const isLate = new Date() > new Date(homework.dueDate);

        homework.submissions.push({
            student: student._id,
            studentName: student.name,
            answer: req.body.answer || '',
            status: isLate ? 'Late' : 'Submitted'
        });

        await homework.save();
        res.json({ msg: 'Homework submitted successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
