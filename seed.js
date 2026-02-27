// ========================================
// Seed Script - Demo Data for School Management System
// Run: node seed.js
// ========================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Fee = require('./models/Fee');
const Attendance = require('./models/Attendance');
const Result = require('./models/Result');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Student.deleteMany({});
        await Teacher.deleteMany({});
        await Fee.deleteMany({});
        await Attendance.deleteMany({});
        await Result.deleteMany({});
        console.log('Cleared existing data');

        const salt = await bcrypt.genSalt(10);

        // ========== Create Admin ==========
        const adminUser = new User({
            username: 'admin',
            password: await bcrypt.hash('admin123', salt),
            role: 'admin',
            name: 'Principal Admin',
            email: 'admin@saicentralschool.edu.in',
            phone: '9876543210'
        });
        await adminUser.save();
        console.log('✅ Admin created: admin / admin123');

        // ========== Create Teachers ==========
        const teachersData = [
            { name: 'Rajesh Kumar', employeeId: 'TCH001', subject: 'Mathematics', assignedClasses: ['10', '9', '8'], phone: '9876543211', email: 'rajesh@school.com', gender: 'Male', qualification: 'M.Sc Mathematics', salary: 35000 },
            { name: 'Priya Sharma', employeeId: 'TCH002', subject: 'Science', assignedClasses: ['10', '9'], phone: '9876543212', email: 'priya@school.com', gender: 'Female', qualification: 'M.Sc Physics', salary: 32000 },
            { name: 'Amit Singh', employeeId: 'TCH003', subject: 'English', assignedClasses: ['8', '7', '6'], phone: '9876543213', email: 'amit@school.com', gender: 'Male', qualification: 'M.A English', salary: 30000 },
            { name: 'Sunita Devi', employeeId: 'TCH004', subject: 'Hindi', assignedClasses: ['10', '9', '8', '7'], phone: '9876543214', email: 'sunita@school.com', gender: 'Female', qualification: 'M.A Hindi', salary: 28000 },
            { name: 'Vikash Prasad', employeeId: 'TCH005', subject: 'Social Science', assignedClasses: ['10', '9'], phone: '9876543215', email: 'vikash@school.com', gender: 'Male', qualification: 'M.A History', salary: 30000 }
        ];

        for (const td of teachersData) {
            const teacher = new Teacher(td);
            await teacher.save();

            const teacherUser = new User({
                username: td.employeeId,
                password: await bcrypt.hash(td.employeeId, salt),
                role: 'teacher',
                name: td.name,
                email: td.email,
                phone: td.phone,
                profileId: teacher._id
            });
            await teacherUser.save();
            teacher.userId = teacherUser._id;
            await teacher.save();
        }
        console.log('✅ 5 Teachers created');

        // ========== Create Students ==========
        const studentsData = [
            { name: 'Aarav Gupta', admissionNumber: 'ADM2024001', rollNumber: '1', class: '10', section: 'A', fatherName: 'Ramesh Gupta', motherName: 'Sita Gupta', gender: 'Male', phone: '9800000001', email: 'aarav@student.com', address: 'Ward 5, Anytown', dateOfBirth: new Date('2009-03-15'), bloodGroup: 'B+' },
            { name: 'Sneha Kumari', admissionNumber: 'ADM2024002', rollNumber: '2', class: '10', section: 'A', fatherName: 'Suresh Kumar', motherName: 'Meena Devi', gender: 'Female', phone: '9800000002', email: 'sneha@student.com', address: 'Kako, Anytown', dateOfBirth: new Date('2009-07-22'), bloodGroup: 'A+' },
            { name: 'Rohan Singh', admissionNumber: 'ADM2024003', rollNumber: '3', class: '10', section: 'A', fatherName: 'Mahesh Singh', motherName: 'Anita Singh', gender: 'Male', phone: '9800000003', email: 'rohan@student.com', address: 'Makhdumpur, Anytown', dateOfBirth: new Date('2009-01-10'), bloodGroup: 'O+' },
            { name: 'Priyanka Rani', admissionNumber: 'ADM2024004', rollNumber: '4', class: '10', section: 'B', fatherName: 'Rajesh Sharma', motherName: 'Sunita Sharma', gender: 'Female', phone: '9800000004', email: 'priyanka@student.com', address: 'Anytown Town', dateOfBirth: new Date('2009-11-05'), bloodGroup: 'AB+' },
            { name: 'Vikram Kumar', admissionNumber: 'ADM2024005', rollNumber: '5', class: '9', section: 'A', fatherName: 'Anil Kumar', motherName: 'Poonam Devi', gender: 'Male', phone: '9800000005', email: 'vikram@student.com', address: 'Ratanpur, Anytown', dateOfBirth: new Date('2010-05-18'), bloodGroup: 'B-' },
            { name: 'Ananya Mishra', admissionNumber: 'ADM2024006', rollNumber: '6', class: '9', section: 'A', fatherName: 'Dinesh Mishra', motherName: 'Kavita Mishra', gender: 'Female', phone: '9800000006', email: 'ananya@student.com', address: 'Arwal Road, Anytown', dateOfBirth: new Date('2010-09-25'), bloodGroup: 'A-' },
            { name: 'Rahul Yadav', admissionNumber: 'ADM2024007', rollNumber: '7', class: '8', section: 'A', fatherName: 'Shyam Yadav', motherName: 'Geeta Devi', gender: 'Male', phone: '9800000007', email: 'rahul@student.com', address: 'Modanganj, Anytown', dateOfBirth: new Date('2011-02-14'), bloodGroup: 'O-' },
            { name: 'Pooja Kumari', admissionNumber: 'ADM2024008', rollNumber: '8', class: '8', section: 'A', fatherName: 'Mohan Prasad', motherName: 'Rani Devi', gender: 'Female', phone: '9800000008', email: 'pooja@student.com', address: 'Hulashganj, Anytown', dateOfBirth: new Date('2011-06-30'), bloodGroup: 'B+' },
            { name: 'Aditya Raj', admissionNumber: 'ADM2024009', rollNumber: '9', class: '7', section: 'A', fatherName: 'Krishna Raj', motherName: 'Suman Devi', gender: 'Male', phone: '9800000009', email: 'aditya@student.com', address: 'Ghoshi, Anytown', dateOfBirth: new Date('2012-04-20'), bloodGroup: 'A+' },
            { name: 'Khushi Singh', admissionNumber: 'ADM2024010', rollNumber: '10', class: '7', section: 'A', fatherName: 'Vijay Singh', motherName: 'Rekha Singh', gender: 'Female', phone: '9800000010', email: 'khushi@student.com', address: 'Paharpur, Anytown', dateOfBirth: new Date('2012-08-12'), bloodGroup: 'O+' }
        ];

        const savedStudents = [];
        for (const sd of studentsData) {
            const student = new Student(sd);
            await student.save();

            const studentUser = new User({
                username: sd.admissionNumber,
                password: await bcrypt.hash(sd.admissionNumber, salt),
                role: 'student',
                name: sd.name,
                email: sd.email,
                phone: sd.phone,
                profileId: student._id
            });
            await studentUser.save();
            student.userId = studentUser._id;
            await student.save();
            savedStudents.push(student);
        }
        console.log('✅ 10 Students created');

        // ========== Create Fees ==========
        const months = ['January', 'February', 'March', 'April', 'May', 'June'];
        for (const student of savedStudents) {
            for (const month of months) {
                const isPaid = Math.random() > 0.3;
                const fee = new Fee({
                    student: student._id,
                    feeType: 'Tuition Fee',
                    amount: 2500,
                    month,
                    year: 2025,
                    status: isPaid ? 'Paid' : 'Pending',
                    paidAmount: isPaid ? 2500 : 0,
                    paidDate: isPaid ? new Date() : null,
                    paymentMethod: isPaid ? 'Cash' : undefined,
                    dueDate: new Date(2025, months.indexOf(month), 15)
                });
                await fee.save();
            }
        }
        console.log('✅ Fee records created');

        // ========== Create Attendance ==========
        const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late'];
        for (const student of savedStudents) {
            for (let day = 1; day <= 20; day++) {
                const attendance = new Attendance({
                    student: student._id,
                    class: student.class,
                    section: student.section,
                    date: new Date(2025, 1, day),
                    status: statuses[Math.floor(Math.random() * statuses.length)]
                });
                await attendance.save();
            }
        }
        console.log('✅ Attendance records created');

        // ========== Create Results ==========
        const subjects = [
            { subjectName: 'Mathematics', maxMarks: 100 },
            { subjectName: 'Science', maxMarks: 100 },
            { subjectName: 'English', maxMarks: 100 },
            { subjectName: 'Hindi', maxMarks: 100 },
            { subjectName: 'Social Science', maxMarks: 100 }
        ];

        for (const student of savedStudents) {
            const result = new Result({
                student: student._id,
                class: student.class,
                section: student.section,
                examType: 'Half Yearly',
                academicYear: '2024-2025',
                subjects: subjects.map(s => ({
                    ...s,
                    obtainedMarks: Math.floor(Math.random() * 60) + 40
                }))
            });
            await result.save();
        }
        console.log('✅ Result records created');

        console.log('\n========================================');
        console.log('🎉 Database seeded successfully!');
        console.log('========================================');
        console.log('\n📋 Login Credentials:');
        console.log('─────────────────────');
        console.log('Admin:    username: admin       | password: admin123');
        console.log('Teacher:  username: TCH001      | password: TCH001');
        console.log('Student:  username: ADM2024001  | password: ADM2024001');
        console.log('========================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seed Error:', err);
        process.exit(1);
    }
};

seedDB();
