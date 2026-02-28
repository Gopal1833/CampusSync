// ========================================
// Accountant Schema
// ========================================
const mongoose = require('mongoose');

const AccountantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
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
    address: {
        type: String,
        required: true
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

AccountantSchema.index({ employeeId: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Accountant', AccountantSchema);
