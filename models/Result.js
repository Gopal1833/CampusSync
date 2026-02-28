// ========================================
// Result Schema
// ========================================
const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
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
    examType: {
        type: String,
        enum: ['Unit Test', 'Half Yearly', 'Annual', 'Pre-Board', 'Board'],
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    subjects: [{
        subjectName: {
            type: String,
            required: true
        },
        maxMarks: {
            type: Number,
            required: true,
            default: 100
        },
        obtainedMarks: {
            type: Number,
            required: true
        },
        grade: {
            type: String
        }
    }],
    totalMarks: {
        type: Number
    },
    totalObtained: {
        type: Number
    },
    percentage: {
        type: Number
    },
    rank: {
        type: Number
    },
    result: {
        type: String,
        enum: ['Pass', 'Fail', 'Distinction', 'Compartment'],
        default: 'Pass'
    },
    remarks: {
        type: String
    },
    uploadedBy: {
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

// Auto-calculate totals and percentage before save
ResultSchema.pre('save', function (next) {
    if (this.subjects && this.subjects.length > 0) {
        this.totalMarks = this.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
        this.totalObtained = this.subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
        this.percentage = ((this.totalObtained / this.totalMarks) * 100).toFixed(2);

        // Auto-assign grades
        this.subjects.forEach(s => {
            const pct = (s.obtainedMarks / s.maxMarks) * 100;
            if (pct >= 90) s.grade = 'A+';
            else if (pct >= 80) s.grade = 'A';
            else if (pct >= 70) s.grade = 'B+';
            else if (pct >= 60) s.grade = 'B';
            else if (pct >= 50) s.grade = 'C';
            else if (pct >= 33) s.grade = 'D';
            else s.grade = 'F';
        });

        // Auto-determine result
        const failCount = this.subjects.filter(s => s.grade === 'F').length;
        if (failCount === 0 && this.percentage >= 75) this.result = 'Distinction';
        else if (failCount === 0) this.result = 'Pass';
        else if (failCount <= 2) this.result = 'Compartment';
        else this.result = 'Fail';
    }
    next();
});

module.exports = mongoose.model('Result', ResultSchema);
