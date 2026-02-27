// ========================================
// Fees Routes
// ========================================
const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// @route   GET /api/fees
// @desc    Get fee records (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { studentId, status, month, year, class: cls } = req.query;
        let query = { schoolId: req.user.schoolId };

        if (studentId) query.student = studentId;
        if (status) query.status = status;
        if (month) query.month = month;
        if (year) query.year = parseInt(year);



        // Filter by class if provided
        if (cls) {
            const studentIds = await Student.find({ class: cls, schoolId: req.user.schoolId }).distinct('_id');
            query.student = { $in: studentIds };
        }

        const fees = await Fee.find(query)
            .populate('student', 'name rollNumber class section admissionNumber')
            .populate('collectedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(fees);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/fees
// @desc    Create fee record (admin only)
router.post('/', auth, async (req, res) => {
    try {


        const feeData = req.body;
        feeData.collectedBy = req.user.id;
        feeData.schoolId = req.user.schoolId;

        if (feeData.status === 'Paid') {
            feeData.paidAmount = feeData.amount;
            feeData.paidDate = new Date();
        }

        const fee = new Fee(feeData);
        await fee.save();

        res.json({ msg: 'Fee record created successfully', fee });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/fees/:id
// @desc    Update fee (mark as paid, etc.)
router.put('/:id', auth, async (req, res) => {
    try {


        const updateData = req.body;
        if (updateData.status === 'Paid') {
            updateData.paidAmount = updateData.amount || (await Fee.findById(req.params.id)).amount;
            updateData.paidDate = new Date();
        }

        const fee = await Fee.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            updateData,
            { new: true }
        ).populate('student', 'name rollNumber class section admissionNumber');

        if (!fee) return res.status(404).json({ msg: 'Fee record not found or unauthorized' });

        res.json({ msg: 'Fee updated successfully', fee });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/fees/:id
// @desc    Delete fee record
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const fee = await Fee.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
        if (!fee) return res.status(404).json({ msg: 'Fee record not found or unauthorized' });

        res.json({ msg: 'Fee record deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/fees/summary/overview
// @desc    Get fee collection summary
router.get('/summary/overview', auth, async (req, res) => {
    try {
        const totalFees = await Fee.aggregate([
            { $match: { schoolId: req.user.schoolId } },
            { $group: { _id: null, total: { $sum: '$amount' }, collected: { $sum: '$paidAmount' } } }
        ]);

        const pendingCount = await Fee.countDocuments({ status: 'Pending', schoolId: req.user.schoolId });
        const paidCount = await Fee.countDocuments({ status: 'Paid', schoolId: req.user.schoolId });

        res.json({
            totalAmount: totalFees[0]?.total || 0,
            collectedAmount: totalFees[0]?.collected || 0,
            pendingAmount: (totalFees[0]?.total || 0) - (totalFees[0]?.collected || 0),
            pendingCount,
            paidCount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
