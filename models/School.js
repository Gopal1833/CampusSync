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
        unique: true,
        trim: true,
        lowercase: true
    },
    schoolPhone: {
        type: String,
        required: true
    },
    schoolAddress: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    schoolLogo: {
        type: String
    },
    schoolCode: {
        type: String,
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

SchoolSchema.pre('save', function (next) {
    if (!this.schoolCode) {
        const year = new Date().getFullYear();
        const rand = Math.floor(Math.random() * 9000) + 1000;
        this.schoolCode = `VH-${year}-${rand}`;
    }
    next();
});

module.exports = mongoose.model('School', SchoolSchema);
