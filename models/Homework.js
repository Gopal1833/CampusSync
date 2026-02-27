// ========================================
// Homework Schema
// ========================================
const mongoose = require('mongoose');

const HomeworkSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: 'A'
    },
    subject: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    assignedDate: {
        type: Date,
        default: Date.now
    },
    submissions: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        studentName: String,
        submittedDate: {
            type: Date,
            default: Date.now
        },
        answer: String,
        status: {
            type: String,
            enum: ['Submitted', 'Late', 'Graded'],
            default: 'Submitted'
        },
        grade: String,
        remarks: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Homework', HomeworkSchema);
