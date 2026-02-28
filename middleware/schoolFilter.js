module.exports = (req, res, next) => {
    if (!req.user || !req.user.schoolId) {
        return res.status(403).json({
            msg: 'School access denied'
        });
    }
    req.schoolId = req.user.schoolId;
    next();
};
