// ========================================
// School Management System - Server Entry
// ========================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// API Routes
// ========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/school', require('./routes/school'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/results', require('./routes/results'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/homework', require('./routes/homework'));

// ========================================
// PDF Receipt Generation Endpoint
// ========================================
const PDFDocument = require('pdfkit');
const Fee = require('./models/Fee');
const Student = require('./models/Student');
const auth = require('./middleware/auth');

app.get('/api/fees/receipt/:feeId', auth, async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.feeId).populate('student');
        if (!fee) return res.status(404).json({ msg: 'Fee record not found' });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${fee._id}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text('School Management System', { align: 'center' });
        doc.fontSize(11).font('Helvetica').text('City, State', { align: 'center' });
        doc.fontSize(10).text('Phone: +91-XXXXXXXXXX | Email: info@school.com', { align: 'center' });
        doc.moveDown(0.5);
        doc.strokeColor('#2563eb').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // Title
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#2563eb').text('FEE RECEIPT', { align: 'center' });
        doc.moveDown(1);

        // Receipt Info
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        doc.text(`Receipt No: ${fee._id.toString().slice(-8).toUpperCase()}`, 50);
        doc.text(`Date: ${new Date(fee.paidDate || fee.createdAt).toLocaleDateString('en-IN')}`, 350, doc.y - 12);
        doc.moveDown(1);

        // Student Details Box
        const boxTop = doc.y;
        doc.rect(50, boxTop, 495, 80).fillAndStroke('#f0f4ff', '#2563eb');
        doc.fillColor('#333').fontSize(10);
        doc.text(`Student Name: ${fee.student ? fee.student.name : 'N/A'}`, 65, boxTop + 12);
        doc.text(`Class: ${fee.student ? fee.student.class : 'N/A'} | Section: ${fee.student ? fee.student.section : 'N/A'}`, 65, boxTop + 30);
        doc.text(`Roll No: ${fee.student ? fee.student.rollNumber : 'N/A'}`, 65, boxTop + 48);
        doc.text(`Admission No: ${fee.student ? fee.student.admissionNumber : 'N/A'}`, 300, boxTop + 48);
        doc.moveDown(4);

        // Fee Table
        const tableTop = doc.y + 10;
        doc.rect(50, tableTop, 495, 25).fillAndStroke('#2563eb', '#2563eb');
        doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 65, tableTop + 7);
        doc.text('Month', 250, tableTop + 7);
        doc.text('Amount', 400, tableTop + 7);

        const row1 = tableTop + 30;
        doc.rect(50, row1, 495, 25).stroke('#ddd');
        doc.fillColor('#333').font('Helvetica');
        doc.text(fee.feeType || 'Tuition Fee', 65, row1 + 7);
        doc.text(fee.month || 'N/A', 250, row1 + 7);
        doc.text(`Rs. ${fee.amount}`, 400, row1 + 7);

        const totalRow = row1 + 30;
        doc.rect(50, totalRow, 495, 30).fillAndStroke('#f0f4ff', '#2563eb');
        doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(12);
        doc.text('Total Amount:', 250, totalRow + 8);
        doc.text(`Rs. ${fee.amount}`, 400, totalRow + 8);

        doc.moveDown(6);
        doc.fillColor('#333').fontSize(10).font('Helvetica');
        doc.text(`Payment Status: ${fee.status.toUpperCase()}`, 50);
        doc.text(`Payment Method: ${fee.paymentMethod || 'Cash'}`, 300, doc.y - 12);
        doc.moveDown(3);

        // Footer
        doc.fontSize(9).fillColor('#888').text('This is a computer-generated receipt.', 50, 720, { align: 'center' });
        doc.text('School Management System, City, State', { align: 'center' });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error generating receipt' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🏫 Server running on port ${PORT}`);
    console.log(`📍 Open http://localhost:${PORT} in your browser`);
});
