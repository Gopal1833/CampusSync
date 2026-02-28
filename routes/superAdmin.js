const express = require('express');
const router = express.Router();
const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const superAdminAuth = (req, res, next) => {
    const email = req.headers.email;
    const password = req.headers.password;

    if (
        email === process.env.SUPER_ADMIN_EMAIL &&
        password === process.env.SUPER_ADMIN_PASSWORD
    ) {
        return next();
    }

    return res.status(403).json({ msg: 'Super admin access denied' });
};

router.get('/schools', superAdminAuth, async (req, res) => {
    try {
        const schools = await School.find({}).lean();

        const schoolsWithStats = await Promise.all(
            schools.map(async (school) => {
                const studentCount = await Student.countDocuments({
                    schoolId: school._id,
                    isActive: true
                });
                const teacherCount = await Teacher.countDocuments({
                    schoolId: school._id,
                    isActive: true
                });
                return { ...school, studentCount, teacherCount };
            })
        );

        res.json(schoolsWithStats);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/schools/:id', superAdminAuth, async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ msg: 'School not found' });
        }

        const students = await Student.countDocuments({ schoolId: req.params.id });
        const teachers = await Teacher.countDocuments({ schoolId: req.params.id });

        res.json({ school, students, teachers });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/schools/:id/toggle', superAdminAuth, async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ msg: 'School not found' });
        }

        school.isActive = !school.isActive;
        await school.save();

        res.json({
            msg: `School ${school.isActive ? 'activated' : 'deactivated'}`,
            isActive: school.isActive
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.delete('/schools/:id', superAdminAuth, async (req, res) => {
    try {
        const schoolId = req.params.id;

        await Student.deleteMany({ schoolId });
        await Teacher.deleteMany({ schoolId });
        await User.deleteMany({ schoolId });
        await School.findByIdAndDelete(schoolId);

        res.json({ msg: 'School and all data deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
