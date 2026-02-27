// ========================================
// Fee Schema
// ========================================
const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    feeType: {
        type: String,
        enum: ['Tuition Fee', 'Exam Fee', 'Library Fee', 'Transport Fee', 'Lab Fee', 'Admission Fee', 'Other'],
        required: true,
        default: 'Tuition Fee'
    },
    amount: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Partial', 'Overdue'],
        default: 'Pending'
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paidDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Online', 'Cheque', 'UPI', 'Bank Transfer'],
        default: 'Cash'
    },
    transactionId: {
        type: String
    },
    remarks: {
        type: String
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Fee', FeeSchema);
