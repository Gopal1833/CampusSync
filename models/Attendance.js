// ========================================
// Attendance Schema
// ========================================
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    class: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Half-Day'],
        required: true,
        default: 'Present'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    remarks: {
        type: String
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    }
}, { timestamps: true });

// Compound index to prevent duplicate attendance per student per date per school
AttendanceSchema.index({ student: 1, date: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
