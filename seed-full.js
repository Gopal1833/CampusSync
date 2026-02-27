// ============================================================
// FULL SEED SCRIPT — 100 Students + Attendance + Fees
// Run: node seed-full.js
// ============================================================
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Student = require('./models/Student');
const User = require('./models/User');
const School = require('./models/School');
const Fee = require('./models/Fee');
const Attendance = require('./models/Attendance');

// ─── Helpers ───────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randN = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const FIRST_NAMES_M = ['Arjun', 'Rahul', 'Amit', 'Rohit', 'Vikram', 'Sanjay', 'Deepak', 'Nikhil', 'Ravi', 'Aditya', 'Kartik', 'Manish', 'Suresh', 'Ajay', 'Vivek', 'Ankur', 'Pradeep', 'Akash', 'Harish', 'Gopal', 'Tarun', 'Varun', 'Karan', 'Mohit', 'Pankaj'];
const FIRST_NAMES_F = ['Riya', 'Pooja', 'Sneha', 'Anjali', 'Priya', 'Kavita', 'Sunita', 'Meena', 'Rekha', 'Asha', 'Lata', 'Usha', 'Geeta', 'Sita', 'Anita', 'Neha', 'Divya', 'Sonia', 'Puja', 'Ritika', 'Sweta', 'Kajal', 'Pallavi', 'Nisha', 'Komal'];
const LAST_NAMES = ['Sharma', 'Kumar', 'Singh', 'Verma', 'Gupta', 'Yadav', 'Pandey', 'Mishra', 'Tiwari', 'Jha', 'Sinha', 'Prasad', 'Roy', 'Das', 'Chatterjee', 'Rajput', 'Chauhan', 'Patel', 'Shah', 'Mehta'];
const FATHER_PREFIX = ['Ramesh', 'Suresh', 'Mahesh', 'Rajesh', 'Naresh', 'Dinesh', 'Umesh', 'Lokesh', 'Ganesh', 'Kamlesh', 'Shyam', 'Ram', 'Hari', 'Dev', 'Bal'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FEE_TYPES = ['Tuition Fee', 'Exam Fee', 'Library Fee', 'Transport Fee', 'Lab Fee'];
const PAY_METHODS = ['Cash', 'UPI', 'Online', 'Cheque'];
const ATT_STATUSES = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Absent', 'Late', 'Half-Day']; // weighted present

function makeName(gender) {
    const first = gender === 'Male' ? rand(FIRST_NAMES_M) : rand(FIRST_NAMES_F);
    return first + ' ' + rand(LAST_NAMES);
}

function makeDob(classNum) {
    const baseYear = 2025 - (classNum + 5);
    return `${baseYear}-${String(randN(1, 12)).padStart(2, '0')}-${String(randN(1, 28)).padStart(2, '0')}`;
}

function makePhone() {
    return '9' + String(randN(700000000, 999999999));
}

// Working days in last 30 days (skip Sundays)
function getWorkingDays(count = 26) {
    const days = [];
    const today = new Date();
    let d = new Date(today);
    d.setDate(d.getDate() - 1);
    while (days.length < count) {
        if (d.getDay() !== 0) days.push(new Date(d));
        d.setDate(d.getDate() - 1);
    }
    return days;
}

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const school = await School.findOne({});
    if (!school) { console.error('❌ No school found!'); process.exit(1); }
    console.log(`🏫 ${school.schoolName}\n`);

    // Get admin user for collectedBy reference
    const adminUser = await User.findOne({ role: 'admin', schoolId: school._id });

    const workingDays = getWorkingDays(26);
    const currentYear = 2025;
    const seedMonths = ['September', 'October', 'November', 'December', 'January', 'February'];
    const feeAmounts = { 'Tuition Fee': 1500, 'Exam Fee': 500, 'Library Fee': 200, 'Transport Fee': 800, 'Lab Fee': 300 };

    // ── Build 100 student records ──────────────────────────
    const STUDENTS = [];
    let serial = 11; // DAV011 onward (DAV001-010 already seeded)

    const classSections = [
        { cls: '1', sec: 'A', count: 8 }, { cls: '1', sec: 'B', count: 8 },
        { cls: '2', sec: 'A', count: 8 }, { cls: '2', sec: 'B', count: 8 },
        { cls: '3', sec: 'A', count: 8 },
        { cls: '4', sec: 'A', count: 8 },
        { cls: '5', sec: 'A', count: 8 },
        { cls: '6', sec: 'A', count: 8 }, { cls: '6', sec: 'B', count: 8 },
        { cls: '11', sec: 'A', count: 8 }, { cls: '11', sec: 'B', count: 8 },
        { cls: '12', sec: 'A', count: 8 },
    ];

    for (const { cls, sec, count } of classSections) {
        for (let i = 0; i < count; i++) {
            const gender = i % 2 === 0 ? 'Male' : 'Female';
            const name = makeName(gender);
            const admNo = `DAV${String(serial).padStart(3, '0')}`;
            const father = rand(FATHER_PREFIX) + ' ' + rand(LAST_NAMES);
            const mother = rand(FIRST_NAMES_F) + ' ' + rand(LAST_NAMES);
            STUDENTS.push({
                name, admissionNumber: admNo,
                rollNumber: String(i + 1).padStart(2, '0'),
                class: cls, section: sec, gender,
                dateOfBirth: makeDob(parseInt(cls)),
                fatherName: father, motherName: mother,
                phone: makePhone(),
                email: `${admNo.toLowerCase()}@student.com`,
                address: `House ${randN(1, 200)}, Ward ${randN(1, 20)}, Anytown, Bihar`,
                bloodGroup: rand(BLOOD_GROUPS)
            });
            serial++;
        }
    }

    console.log(`📚 Seeding ${STUDENTS.length} new students...`);
    let addedS = 0, skippedS = 0;
    const studentDocs = [];

    for (const s of STUDENTS) {
        const exists = await Student.findOne({ admissionNumber: s.admissionNumber, schoolId: school._id });
        if (exists) { skippedS++; studentDocs.push(exists); continue; }

        const student = new Student({ ...s, schoolId: school._id });
        await student.save();

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(s.admissionNumber, salt);
        const userExists = await User.findOne({ username: s.admissionNumber, schoolId: school._id });
        if (!userExists) {
            const user = new User({
                username: s.admissionNumber, email: s.email,
                password: hash, role: 'student',
                name: s.name, phone: s.phone,
                profileId: student._id, schoolId: school._id
            });
            await user.save();
            student.userId = user._id;
            await student.save();
        }
        studentDocs.push(student);
        addedS++;
        process.stdout.write(`\r  Added ${addedS} students...`);
    }
    console.log(`\n  ✅ Students: Added ${addedS}, Skipped ${skippedS}`);

    // Also grab previously seeded students
    const allStudents = await Student.find({ isActive: true, schoolId: school._id });
    console.log(`  📊 Total students in DB: ${allStudents.length}`);

    // ── Attendance for last 26 working days ───────────────
    console.log('\n📋 Seeding attendance records (last 26 working days)...');
    let attAdded = 0, attSkipped = 0;

    for (const student of allStudents) {
        for (const day of workingDays) {
            // Students absent on weekends already excluded; random attendance pattern
            const status = rand(ATT_STATUSES);
            try {
                const att = new Attendance({
                    student: student._id,
                    class: student.class,
                    section: student.section,
                    date: day,
                    status,
                    markedBy: adminUser?._id,
                    schoolId: school._id
                });
                await att.save();
                attAdded++;
            } catch (e) {
                if (e.code === 11000) attSkipped++; // duplicate
                else throw e;
            }
        }
        process.stdout.write(`\r  Attendance for ${allStudents.indexOf(student) + 1}/${allStudents.length} students...`);
    }
    console.log(`\n  ✅ Attendance: Added ${attAdded}, Skipped ${attSkipped}`);

    // ── Fee records for last 6 months ─────────────────────
    console.log('\n💰 Seeding fee records (6 months × each student)...');
    let feeAdded = 0, feeSkipped = 0;

    const feeStatuses = ['Paid', 'Paid', 'Paid', 'Paid', 'Pending', 'Pending', 'Overdue'];

    for (const student of allStudents) {
        for (const month of seedMonths) {
            const feeType = 'Tuition Fee';
            const amount = feeAmounts[feeType];
            const status = rand(feeStatuses);
            const year = (month === 'January' || month === 'February') ? 2026 : currentYear;
            const isPaid = status === 'Paid';

            const feeExists = await Fee.findOne({ student: student._id, month, year, feeType, schoolId: school._id });
            if (feeExists) { feeSkipped++; continue; }

            const fee = new Fee({
                student: student._id,
                feeType,
                amount,
                month,
                year,
                status,
                paidAmount: isPaid ? amount : (status === 'Overdue' ? 0 : randN(0, amount - 100)),
                paidDate: isPaid ? new Date(year, MONTHS.indexOf(month), randN(1, 28)) : undefined,
                dueDate: new Date(year, MONTHS.indexOf(month), 10),
                paymentMethod: isPaid ? rand(PAY_METHODS) : undefined,
                collectedBy: isPaid ? adminUser?._id : undefined,
                schoolId: school._id
            });
            await fee.save();
            feeAdded++;
        }

        // Also add an Exam Fee record (random status)
        const examStatus = rand(['Paid', 'Paid', 'Pending', 'Overdue']);
        const examExists = await Fee.findOne({ student: student._id, feeType: 'Exam Fee', month: 'February', year: 2026, schoolId: school._id });
        if (!examExists) {
            await new Fee({
                student: student._id, feeType: 'Exam Fee',
                amount: 500, month: 'February', year: 2026,
                status: examStatus,
                paidAmount: examStatus === 'Paid' ? 500 : 0,
                dueDate: new Date(2026, 1, 15),
                paidDate: examStatus === 'Paid' ? new Date(2026, 1, randN(1, 14)) : undefined,
                paymentMethod: examStatus === 'Paid' ? rand(PAY_METHODS) : undefined,
                collectedBy: examStatus === 'Paid' ? adminUser?._id : undefined,
                schoolId: school._id
            }).save();
            feeAdded++;
        }
        process.stdout.write(`\r  Fees for ${allStudents.indexOf(student) + 1}/${allStudents.length} students...`);
    }
    console.log(`\n  ✅ Fees: Added ${feeAdded}, Skipped ${feeSkipped}`);

    // ── Final Summary ──────────────────────────────────────
    const totalStudents = await Student.countDocuments({ isActive: true, schoolId: school._id });
    const totalAttendance = await Attendance.countDocuments({ schoolId: school._id });
    const totalFees = await Fee.countDocuments({ schoolId: school._id });
    const paidFees = await Fee.countDocuments({ schoolId: school._id, status: 'Paid' });
    const pendingFees = await Fee.countDocuments({ schoolId: school._id, status: 'Pending' });
    const overdueFees = await Fee.countDocuments({ schoolId: school._id, status: 'Overdue' });

    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Total Students    : ${totalStudents}`);
    console.log(`  Attendance Records: ${totalAttendance}`);
    console.log(`  Total Fee Records : ${totalFees}`);
    console.log(`    ├─ Paid         : ${paidFees}`);
    console.log(`    ├─ Pending      : ${pendingFees}`);
    console.log(`    └─ Overdue      : ${overdueFees}`);
    console.log('='.repeat(60));
    console.log('\n✅ All done!\n');

    process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
