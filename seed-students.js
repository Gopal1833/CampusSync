// ============================================================
// TEST SEED SCRIPT — Adds 10 sample students + 2 teachers
// Run: node seed-students.js
// ============================================================
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Student = require('./models/Student');
const User = require('./models/User');
const School = require('./models/School');
const Teacher = require('./models/Teacher');

// ---- Sample Data ----
const STUDENTS = [
    { name: 'Riya Sharma', admissionNumber: 'DAV001', rollNumber: '01', class: '9', section: 'A', gender: 'Female', dateOfBirth: '2009-03-14', fatherName: 'Ramesh Sharma', motherName: 'Sunita Sharma', phone: '9801234561', email: 'riya@student.com', address: 'House No 12, Anytown', bloodGroup: 'B+' },
    { name: 'Arjun Kumar', admissionNumber: 'DAV002', rollNumber: '02', class: '9', section: 'A', gender: 'Male', dateOfBirth: '2009-07-22', fatherName: 'Suresh Kumar', motherName: 'Kavita Kumar', phone: '9801234562', email: 'arjun@student.com', address: 'Ward 5, Anytown', bloodGroup: 'A+' },
    { name: 'Pooja Singh', admissionNumber: 'DAV003', rollNumber: '03', class: '9', section: 'B', gender: 'Female', dateOfBirth: '2009-11-05', fatherName: 'Ajay Singh', motherName: 'Meena Singh', phone: '9801234563', email: 'pooja@student.com', address: 'Colony Road, Anytown', bloodGroup: 'O+' },
    { name: 'Rahul Verma', admissionNumber: 'DAV004', rollNumber: '04', class: '10', section: 'A', gender: 'Male', dateOfBirth: '2008-05-18', fatherName: 'Vijay Verma', motherName: 'Rekha Verma', phone: '9801234564', email: 'rahul@student.com', address: 'Main Market, Anytown', bloodGroup: 'AB+' },
    { name: 'Sneha Gupta', admissionNumber: 'DAV005', rollNumber: '05', class: '10', section: 'A', gender: 'Female', dateOfBirth: '2008-09-30', fatherName: 'Mukesh Gupta', motherName: 'Asha Gupta', phone: '9801234565', email: 'sneha@student.com', address: 'Patna Road, Anytown', bloodGroup: 'B-' },
    { name: 'Amit Yadav', admissionNumber: 'DAV006', rollNumber: '06', class: '10', section: 'B', gender: 'Male', dateOfBirth: '2008-01-12', fatherName: 'Rakesh Yadav', motherName: 'Geeta Yadav', phone: '9801234566', email: 'amit@student.com', address: 'Station Area, Anytown', bloodGroup: 'O-' },
    { name: 'Priya Kumari', admissionNumber: 'DAV007', rollNumber: '07', class: '8', section: 'A', gender: 'Female', dateOfBirth: '2010-06-25', fatherName: 'Sanjay Pandey', motherName: 'Lata Pandey', phone: '9801234567', email: 'priya@student.com', address: 'Civil Lines, Anytown', bloodGroup: 'A-' },
    { name: 'Rohit Pandey', admissionNumber: 'DAV008', rollNumber: '08', class: '8', section: 'B', gender: 'Male', dateOfBirth: '2010-02-08', fatherName: 'Deepak Pandey', motherName: 'Anita Pandey', phone: '9801234568', email: 'rohit@student.com', address: 'Near Temple, Anytown', bloodGroup: 'B+' },
    { name: 'Anjali Mishra', admissionNumber: 'DAV009', rollNumber: '09', class: '7', section: 'A', gender: 'Female', dateOfBirth: '2011-04-17', fatherName: 'Pramod Mishra', motherName: 'Usha Mishra', phone: '9801234569', email: 'anjali@student.com', address: 'New Colony, Anytown', bloodGroup: 'AB-' },
    { name: 'Vikram Tiwari', admissionNumber: 'DAV010', rollNumber: '10', class: '7', section: 'B', gender: 'Male', dateOfBirth: '2011-08-03', fatherName: 'Ganesh Tiwari', motherName: 'Savita Tiwari', phone: '9801234570', email: 'vikram@student.com', address: 'Bypass Road, Anytown', bloodGroup: 'O+' },
];

const TEACHERS = [
    { name: 'Rajesh Kumar Singh', employeeId: 'TCH001', subject: 'Mathematics', qualification: 'M.Sc Mathematics', phone: '9811234501', email: 'rajesh@teacher.com', dateOfBirth: '1985-04-10', address: 'Teacher Colony, Anytown', assignedClasses: ['9', '10'] },
    { name: 'Sunita Devi', employeeId: 'TCH002', subject: 'Science', qualification: 'M.Sc Physics', phone: '9811234502', email: 'sunita@teacher.com', dateOfBirth: '1988-07-22', address: 'Main Road, Anytown', assignedClasses: ['7', '8'] },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the school
        const school = await School.findOne({});
        if (!school) {
            console.error('❌ No school found. Please register a school first and restart server.');
            process.exit(1);
        }
        console.log(`🏫 School: ${school.schoolName} (${school.schoolCode})\n`);

        let addedStudents = 0, skippedStudents = 0;
        let addedTeachers = 0, skippedTeachers = 0;

        // ---- Seed Students ----
        console.log('📚 Adding Students...');
        for (const s of STUDENTS) {
            const exists = await Student.findOne({ admissionNumber: s.admissionNumber, schoolId: school._id });
            if (exists) {
                console.log(`  ⏭  Skipped (already exists): ${s.name} [${s.admissionNumber}]`);
                skippedStudents++;
                continue;
            }

            const student = new Student({ ...s, schoolId: school._id });
            await student.save();

            // Create login user
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(s.admissionNumber, salt);
            const user = new User({
                username: s.admissionNumber,
                email: s.email || `${s.admissionNumber}@student.com`,
                password: hash,
                role: 'student',
                name: s.name,
                phone: s.phone,
                profileId: student._id,
                schoolId: school._id
            });
            await user.save();
            student.userId = user._id;
            await student.save();

            console.log(`  ✅ Added: ${s.name.padEnd(20)} | Class ${s.class}-${s.section} | ID: ${s.admissionNumber} | Password: ${s.admissionNumber}`);
            addedStudents++;
        }

        // ---- Seed Teachers ----
        console.log('\n👨‍🏫 Adding Teachers...');
        for (const t of TEACHERS) {
            const exists = await Teacher.findOne({ employeeId: t.employeeId, schoolId: school._id });
            if (exists) {
                console.log(`  ⏭  Skipped (already exists): ${t.name} [${t.employeeId}]`);
                skippedTeachers++;
                continue;
            }

            const teacher = new Teacher({ ...t, schoolId: school._id, isActive: true });
            await teacher.save();

            // Create login user
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(t.employeeId, salt);
            const userExists = await User.findOne({ username: t.employeeId, schoolId: school._id });
            if (!userExists) {
                const user = new User({
                    username: t.employeeId,
                    email: t.email || `${t.employeeId}@teacher.com`,
                    password: hash,
                    role: 'teacher',
                    name: t.name,
                    phone: t.phone,
                    profileId: teacher._id,
                    schoolId: school._id
                });
                await user.save();
                teacher.userId = user._id;
                await teacher.save();
            }

            console.log(`  ✅ Added: ${t.name.padEnd(25)} | Subject: ${t.subject.padEnd(12)} | ID: ${t.employeeId} | Password: ${t.employeeId}`);
            addedTeachers++;
        }

        // ---- Summary ----
        console.log('\n' + '='.repeat(60));
        console.log('📊 SEED SUMMARY');
        console.log('='.repeat(60));
        console.log(`  Students  → Added: ${addedStudents} | Skipped: ${skippedStudents}`);
        console.log(`  Teachers  → Added: ${addedTeachers} | Skipped: ${skippedTeachers}`);
        console.log('='.repeat(60));
        console.log('\n🔑 LOGIN CREDENTIALS:');
        console.log('\n  ADMIN:');
        console.log(`    School Name : ${school.schoolName}`);
        console.log(`    Email       : ${school.schoolEmail}`);
        console.log(`    Password    : Admin@1234`);
        console.log('\n  STAFF LOGIN (use Employee ID as both ID & Password):');
        TEACHERS.forEach(t => console.log(`    ${t.name.padEnd(25)} → ID & Password: ${t.employeeId}`));
        console.log('\n  All students login with Admission No as both ID & Password:');
        STUDENTS.forEach(s => console.log(`    ${s.name.padEnd(20)} Class ${s.class}-${s.section}  → ${s.admissionNumber}`));
        console.log('\n✅ Done!\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seed();
