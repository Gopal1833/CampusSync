const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    schoolName: {
        type: String,
        required: true,
        trim: true
    },
    schoolEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    schoolPhone: {
        type: String,
        required: true
    },
    schoolAddress: {
        type: String,
        required: true
    },
    schoolLogo: {
        type: String
    },
    schoolCode: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('School', SchoolSchema);
