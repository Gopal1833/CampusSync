// ========================================
// User/Login Schema - Authentication
// ========================================
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String
    },
    // Reference to student or teacher profile
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'role'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

UserSchema.index({ username: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
