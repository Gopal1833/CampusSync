# 🏫 School Management System

A full-stack, responsive School Management System for schools.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7+-brightgreen)

---

## ✨ Features

### 🔐 Authentication System
- JWT-based secure login/logout
- Role-based access: **Admin**, **Teacher**, **Student**
- Password hashing with bcrypt
- Auto-generated credentials for new students/teachers

### 👨‍💼 Admin Panel
- **Dashboard** — Stats overview, class-wise students, fee collection charts
- **Student Management** — Add, edit, search, filter, delete students
- **Teacher Management** — Add, edit, delete teaching staff
- **Fee Management** — Create fee records, mark as paid, filter by status/month
- **Attendance** — Mark bulk attendance by class/section/date
- **Results** — Upload exam results with auto-grading
- **New Admission** — Full admission form with auto user creation
- **PDF Receipt** — Download fee receipts as PDF

### 👩‍🏫 Teacher Panel
- **Dashboard** — View assigned classes, subject, student count
- **Mark Attendance** — Mark daily attendance for assigned classes
- **Upload Marks** — Enter exam marks for individual students
- **My Students** — View all students in assigned classes

### 🎓 Student Panel
- **Dashboard** — View class, attendance %, pending fees, recent results
- **My Attendance** — View full attendance history with summary
- **My Fees** — View fee records with PDF receipt download
- **My Results** — View detailed exam results with grades
- **Homework** — View homework assignments

---

## 🛠 Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS       |
| Backend    | Node.js, Express.js           |
| Database   | MongoDB + Mongoose            |
| Auth       | JWT + bcrypt                  |
| PDF        | PDFKit                        |
| Icons      | Font Awesome 6                |
| Fonts      | Google Fonts (Inter, Outfit)  |

---

## 📦 Project Structure

```
school-management-system/
├── config/
│   └── db.js               # MongoDB connection
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User/login schema
│   ├── Student.js           # Student profile schema
│   ├── Teacher.js           # Teacher profile schema
│   ├── Attendance.js        # Attendance records
│   ├── Fee.js               # Fee records
│   └── Result.js            # Exam result records
├── routes/
│   ├── auth.js              # Login, register, password change
│   ├── students.js          # Student CRUD
│   ├── teachers.js          # Teacher CRUD
│   ├── attendance.js        # Attendance marking & viewing
│   ├── fees.js              # Fee management
│   ├── results.js           # Result upload & viewing
│   └── dashboard.js         # Analytics & stats
├── public/
│   ├── index.html           # Single-page frontend
│   ├── css/style.css        # Complete CSS design system
│   └── js/app.js            # Frontend JavaScript
├── .env                     # Environment variables
├── seed.js                  # Demo data seeder
├── server.js                # Express server entry point
├── package.json             # Dependencies
└── README.md                # This file
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** v18+ → [Download](https://nodejs.org/)
- **MongoDB** v6+ → [Download](https://www.mongodb.com/try/download/community)
  - OR use **MongoDB Atlas** (free cloud): [atlas.mongodb.com](https://www.mongodb.com/cloud/atlas)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure MongoDB

**Option A — Local MongoDB:**
1. Install and start MongoDB locally
2. The default `.env` file is already configured for `mongodb://127.0.0.1:27017/sai_central_school`

**Option B — MongoDB Atlas (Free Cloud):**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster → Get connection string
3. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/sai_central_school
   ```

### Step 3: Seed Demo Data

```bash
npm run seed
```

This creates:
- 1 Admin user
- 5 Teachers
- 10 Students
- Fee records, attendance records, and exam results

### Step 4: Start the Server

```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### Step 5: Open in Browser

```
http://localhost:5000
```

---

## 🔑 Demo Login Credentials

| Role     | Username     | Password     |
|----------|-------------|-------------|
| Admin    | `admin`     | `admin123`  |
| Teacher  | `TCH001`    | `TCH001`    |
| Student  | `SCP2024001`| `SCP2024001`|

---

## 📸 Screenshots

### Login Page
- Glassmorphism design with animated gradient background
- Role selection (Admin/Teacher/Student)

### Admin Dashboard
- Real-time stats cards with animated counters
- Class-wise student bar chart
- Fee collection donut chart
- Recent fee payments table
- Quick action buttons

### Student Dashboard
- Personal attendance summary
- Pending fees overview
- Recent exam results
- Homework assignments

---

## 📋 API Endpoints

| Method | Endpoint                       | Description                |
|--------|-------------------------------|----------------------------|
| POST   | `/api/auth/login`             | Login & get JWT token      |
| POST   | `/api/auth/register`          | Admin registers users      |
| GET    | `/api/auth/me`                | Get current user profile   |
| PUT    | `/api/auth/change-password`   | Change password            |
| GET    | `/api/students`               | Get all students           |
| POST   | `/api/students`               | Add new student            |
| PUT    | `/api/students/:id`           | Update student             |
| DELETE | `/api/students/:id`           | Soft-delete student        |
| GET    | `/api/teachers`               | Get all teachers           |
| POST   | `/api/teachers`               | Add new teacher            |
| PUT    | `/api/teachers/:id`           | Update teacher             |
| DELETE | `/api/teachers/:id`           | Soft-delete teacher        |
| GET    | `/api/attendance`             | Get attendance records     |
| POST   | `/api/attendance/bulk`        | Mark bulk attendance       |
| GET    | `/api/attendance/summary/:id` | Student attendance summary |
| GET    | `/api/fees`                   | Get fee records            |
| POST   | `/api/fees`                   | Create fee record          |
| PUT    | `/api/fees/:id`               | Update fee                 |
| DELETE | `/api/fees/:id`               | Delete fee record          |
| GET    | `/api/fees/receipt/:id`       | Download PDF receipt       |
| GET    | `/api/results`                | Get results                |
| POST   | `/api/results`                | Upload result              |
| PUT    | `/api/results/:id`            | Update result              |
| DELETE | `/api/results/:id`            | Delete result              |
| GET    | `/api/dashboard/stats`        | Admin dashboard stats      |
| GET    | `/api/dashboard/student-stats`| Student dashboard stats    |

---

## 🎨 Design Highlights

- **Premium Glassmorphism** login page with animated backgrounds
- **Dark sidebar** with gradient navigation and glow effects
- **Responsive design** — Works on mobile, tablet, and desktop
- **Custom scrollbar** styling
- **Smooth micro-animations** and hover effects
- **Modern typography** using Inter and Outfit fonts
- **Color-coded stat cards** with accent gradients
- **SVG donut charts** and CSS bar charts (no external chart library)
- **Toast notifications** for user feedback
- **Modal dialogs** for forms

---

## 📄 License

ISC — Made for **School Management System**
