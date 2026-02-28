// ========================================
// Accountant Routes
// ========================================
const express = require('express');
const router = express.Router();
const Accountant = require('../models/Accountant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// @route   GET /api/accountants
// @desc    Get all accountants
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
        const accountants = await Accountant.find({ isActive: true, schoolId: req.schoolId }).sort({ name: 1 });
        res.json(accountants);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/accountants
// @desc    Add new accountant (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
        let employeeId = req.body.employeeId ? req.body.employeeId.trim() : 'ACC' + Math.floor(10000 + Math.random() * 90000);
        
        const existing = await Accountant.findOne({ employeeId, schoolId: req.schoolId });
        if (existing) return res.status(400).json({ msg: 'Employee ID already exists' });

        const accountant = new Accountant({
            ...req.body,
            employeeId,
            schoolId: req.schoolId
        });
        await accountant.save();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(employeeId, salt);
        
        const user = new User({
            username: employeeId,
            password: hashedPassword,
            role: 'accountant',
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            profileId: accountant._id,
            schoolId: req.schoolId
        });
        await user.save();
        accountant.userId = user._id;
        await accountant.save();

        res.json({ msg: 'Accountant added', accountant });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
