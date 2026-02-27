// ========================================
// Dashboard Analytics Routes
// ========================================
const express = require('express');
const router = express.Router();

const Teacher = require('../models/Teacher');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   GET /api/dashboard/stats
// @desc    Get overall dashboard statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
        const totalStudents = 0;
        const totalTeachers = await Teacher.countDocuments({ isActive: true, schoolId });

        // Notice and Homework Counts
        const noticeCount = await require('../models/Notice').countDocuments({ isActive: true, schoolId });
        const homeworkCount = await require('../models/Homework').countDocuments({ isActive: true, schoolId });

        // Fee stats
        const feeStats = await Fee.aggregate([
            { $match: { schoolId: schoolObjectId } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    collectedAmount: { $sum: '$paidAmount' }
                }
            }
        ]);

        const pendingFees = await Fee.countDocuments({ status: { $in: ['Pending', 'Overdue'] }, schoolId });
        const paidFees = await Fee.countDocuments({ status: 'Paid', schoolId });

        // Today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const todayAttendance = await Attendance.countDocuments({
            date: { $gte: today, $lte: todayEnd },
            schoolId
        });
        const todayPresent = await Attendance.countDocuments({
            date: { $gte: today, $lte: todayEnd },
            status: 'Present',
            schoolId
        });

        // Class-wise student count
        const classWise = [];

        // Monthly fee collection
        const monthlyFees = await Fee.aggregate([
            { $match: { status: 'Paid', schoolId: schoolObjectId } },
            {
                $group: {
                    _id: { month: '$month', year: '$year' },
                    total: { $sum: '$paidAmount' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': 1 } },
            { $limit: 12 }
        ]);

        res.json({
            totalStudents,
            totalTeachers,
            totalFeeAmount: feeStats[0]?.totalAmount || 0,
            collectedFeeAmount: feeStats[0]?.collectedAmount || 0,
            pendingFeeAmount: (feeStats[0]?.totalAmount || 0) - (feeStats[0]?.collectedAmount || 0),
            pendingFees,
            paidFees,
            noticeCount,
            homeworkCount,
            todayAttendance,
            todayPresent,
            attendancePercentage: todayAttendance > 0 ? ((todayPresent / todayAttendance) * 100).toFixed(1) : 0,
            classWise,
            monthlyFees
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});



module.exports = router;
