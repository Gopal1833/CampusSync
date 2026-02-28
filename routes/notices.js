const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   POST /api/notices
// @desc    Create a new notice
// @access  Private (Admin only)
router.post('/', [auth, [
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('audience', 'Audience is required').isIn(['All', 'Students', 'Teachers'])
]], async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to create notices' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, audience } = req.body;

    try {
        const newNotice = new Notice({
            title,
            description,
            audience,
            schoolId: req.schoolId,
            createdBy: req.user.id
        });

        const notice = await newNotice.save();
        res.json(notice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/notices
// @desc    Get all notices for the school (filtered by role/audience)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Build query based on user role
        let query = { schoolId: req.schoolId, isActive: true };

        if (req.user.role === 'student') {
            query.audience = { $in: ['All', 'Students'] };
        } else if (req.user.role === 'teacher') {
            query.audience = { $in: ['All', 'Teachers'] };
        }

        const notices = await Notice.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(notices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/notices/:id
// @desc    Update a notice
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to update notices' });
    }

    try {
        let notice = await Notice.findOne({ _id: req.params.id, schoolId: req.schoolId });

        if (!notice) return res.status(404).json({ msg: 'Notice not found' });

        notice = await Notice.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.schoolId },
            { $set: req.body },
            { new: true }
        );

        res.json(notice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/notices/:id
// @desc    Delete a notice
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to delete notices' });
    }

    try {
        let notice = await Notice.findOne({ _id: req.params.id, schoolId: req.schoolId });

        if (!notice) return res.status(404).json({ msg: 'Notice not found' });

        await Notice.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });

        res.json({ msg: 'Notice removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
