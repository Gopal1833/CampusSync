// ========================================
// Teacher Schema
// ========================================
const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    qualification: {
        type: String
    },
    assignedClasses: [{
        type: String
    }],
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    dateOfBirth: {
        type: Date
    },
    salary: {
        type: Number
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    }
}, { timestamps: true });

TeacherSchema.index({ employeeId: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', TeacherSchema);
