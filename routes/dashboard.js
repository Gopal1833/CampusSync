// ========================================
// Dashboard Analytics Routes
// ========================================
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
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
        const schoolId = req.schoolId;
        const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
        const totalStudents = await Student.countDocuments({ isActive: true, schoolId });
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
        const classWiseData = await Student.aggregate([
            { $match: { isActive: true, schoolId: schoolObjectId } },
            { $group: { _id: '$class', count: { $sum: 1 } } }
        ]);

        const classWise = classWiseData.sort((a, b) => {
            const numA = parseInt(a._id);
            const numB = parseInt(b._id);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            if (!isNaN(numA)) return -1;
            if (!isNaN(numB)) return 1;
            return String(a._id).localeCompare(String(b._id));
        });

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

// @route   GET /api/dashboard/student-stats
// @desc    Get student-specific dashboard stats
router.get('/student-stats', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user.id, schoolId: req.schoolId });
        if (!student) return res.status(404).json({ msg: 'Student profile not found' });

        // Attendance summary
        const attendanceRecords = await Attendance.find({ student: student._id, schoolId: req.schoolId });
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(a => a.status === 'Present').length;

        // Fee summary
        const fees = await Fee.find({ student: student._id, schoolId: req.schoolId });
        const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
        const paidFees = fees.reduce((sum, f) => sum + f.paidAmount, 0);
        const pendingFees = fees.filter(f => f.status === 'Pending' || f.status === 'Overdue');

        // Recent results
        const results = await Result.find({ student: student._id, schoolId: req.schoolId }).sort({ createdAt: -1 }).limit(5);

        res.json({
            student,
            attendance: {
                totalDays,
                presentDays,
                absentDays: totalDays - presentDays,
                percentage: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0
            },
            fees: {
                totalAmount: totalFees,
                paidAmount: paidFees,
                pendingAmount: totalFees - paidFees,
                pendingCount: pendingFees.length
            },
            recentResults: results
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
