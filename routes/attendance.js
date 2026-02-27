// ========================================
// Attendance Routes
// ========================================
const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

const auth = require('../middleware/auth');

// @route   GET /api/attendance
// @desc    Get attendance records (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { class: cls, section, date, studentId } = req.query;
        let query = { schoolId: req.user.schoolId };

        if (cls) query.class = cls;
        if (section) query.section = section;
        if (date) {
            const d = new Date(date);
            query.date = {
                $gte: new Date(d.setHours(0, 0, 0, 0)),
                $lte: new Date(d.setHours(23, 59, 59, 999))
            };
        }
        if (studentId) query.student = studentId;



        const attendance = await Attendance.find(query)
            .populate('student', 'name rollNumber admissionNumber')
            .populate('markedBy', 'name')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/attendance/bulk
// @desc    Mark attendance for multiple students (teacher/admin)
router.post('/bulk', auth, async (req, res) => {
    try {


        const { date, class: cls, section, records } = req.body;
        // records: [{ studentId, status, remarks }]

        const results = [];
        for (const record of records) {
            try {
                const attendance = await Attendance.findOneAndUpdate(
                    {
                        student: record.studentId,
                        date: new Date(date),
                        schoolId: req.user.schoolId
                    },
                    {
                        student: record.studentId,
                        class: cls,
                        section: section,
                        date: new Date(date),
                        status: record.status,
                        markedBy: req.user.id,
                        remarks: record.remarks || '',
                        schoolId: req.user.schoolId
                    },
                    { upsert: true, new: true }
                );
                results.push(attendance);
            } catch (e) {
                console.error(`Error for student ${record.studentId}:`, e.message);
            }
        }

        res.json({ msg: `Attendance marked for ${results.length} students`, data: results });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/attendance/summary/:studentId
// @desc    Get attendance summary for a student
router.get('/summary/:studentId', auth, async (req, res) => {
    try {
        const records = await Attendance.find({ student: req.params.studentId, schoolId: req.user.schoolId });
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
        const absent = records.filter(r => r.status === 'Absent').length;
        const halfDay = records.filter(r => r.status === 'Half-Day').length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

        res.json({ total, present, absent, halfDay, percentage });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
