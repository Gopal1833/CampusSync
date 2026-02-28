// ========================================
// Student Schema
// ========================================
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    admissionNumber: {
        type: String,
        required: true
    },
    rollNumber: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true,
        default: 'A'
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    fatherName: {
        type: String,
        required: true
    },
    motherName: {
        type: String
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    bloodGroup: {
        type: String
    },
    profilePhoto: {
        type: String
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

StudentSchema.index({ admissionNumber: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
