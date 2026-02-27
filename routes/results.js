// ========================================
// Results Routes
// ========================================
const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// @route   GET /api/results
// @desc    Get results (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { studentId, class: cls, examType, academicYear } = req.query;
        let query = { schoolId: req.user.schoolId };

        if (studentId) query.student = studentId;
        if (cls) query.class = cls;
        if (examType) query.examType = examType;
        if (academicYear) query.academicYear = academicYear;

        // Students can only view their own results
        if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user.id });
            if (student) query.student = student._id;
        }

        const results = await Result.find(query)
            .populate('student', 'name rollNumber class section admissionNumber')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/results
// @desc    Upload result (teacher/admin)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const resultData = req.body;
        resultData.uploadedBy = req.user.id;
        resultData.schoolId = req.user.schoolId;

        const result = new Result(resultData);
        await result.save();

        res.json({ msg: 'Result uploaded successfully', result });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/results/:id
// @desc    Update result
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const result = await Result.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
        if (!result) return res.status(404).json({ msg: 'Result not found' });

        Object.assign(result, req.body);
        await result.save(); // This triggers pre-save hook

        res.json({ msg: 'Result updated successfully', result });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/results/:id
// @desc    Delete result
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const result = await Result.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
        if (!result) return res.status(404).json({ msg: 'Result not found or unauthorized' });

        res.json({ msg: 'Result deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
