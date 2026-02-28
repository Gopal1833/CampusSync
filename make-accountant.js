const fs = require('fs');

// 1. Create Accountant model
const accModel = `// ========================================
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
`;
fs.writeFileSync('models/Accountant.js', accModel);

// 2. Create Accountant Route
const accRoute = `// ========================================
// Accountant Routes
// ========================================
const express = require('express');
const router = express.Router();
const Accountant = require('../models/Accountant');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// @route   GET /api/accountants
// @desc    Get all accountants
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
        const accountants = await Accountant.find({ isActive: true, schoolId: req.schoolId }).sort({ name: 1 });
        res.json(accountants);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/accountants
// @desc    Add new accountant (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
        let employeeId = req.body.employeeId ? req.body.employeeId.trim() : 'ACC' + Math.floor(10000 + Math.random() * 90000);
        
        const existing = await Accountant.findOne({ employeeId, schoolId: req.schoolId });
        if (existing) return res.status(400).json({ msg: 'Employee ID already exists' });

        const accountant = new Accountant({
            ...req.body,
            employeeId,
            schoolId: req.schoolId
        });
        await accountant.save();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(employeeId, salt);
        
        const user = new User({
            username: employeeId,
            password: hashedPassword,
            role: 'accountant',
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            profileId: accountant._id,
            schoolId: req.schoolId
        });
        await user.save();
        accountant.userId = user._id;
        await accountant.save();

        res.json({ msg: 'Accountant added', accountant });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
`;
fs.writeFileSync('routes/accountants.js', accRoute);

// 3. Mount in server.js
let svr = fs.readFileSync('server.js', 'utf8');
if (!svr.includes('/api/accountants')) {
    svr = svr.replace("app.use('/api/teachers', require('./routes/teachers'));",
        "app.use('/api/teachers', require('./routes/teachers'));\napp.use('/api/accountants', require('./routes/accountants'));");
    fs.writeFileSync('server.js', svr);
}

// 4. Update fees.js for permission logic
let feesjs = fs.readFileSync('routes/fees.js', 'utf8');
// Block Teacher from any GET
if (!feesjs.includes("req.user.role === 'teacher'")) {
    feesjs = feesjs.replace(/router\.get\('\/', auth, async \(req, res\) => {\n    try {/,
        "router.get('/', auth, async (req, res) => {\n    try {\n        if (req.user.role === 'teacher') return res.status(403).json({ msg: 'Not authorized' });");
    feesjs = feesjs.replace(/router\.get\('\/summary\/overview', auth, async \(req, res\) => {\n    try {/,
        "router.get('/summary/overview', auth, async (req, res) => {\n    try {\n        if (req.user.role === 'teacher') return res.status(403).json({ msg: 'Not authorized' });");

    // Replace POST and PUT constraints
    feesjs = feesjs.replace(/if \(req.user.role === 'student'\) {\n            return res.status\(403\).json\({ msg: 'Not authorized' }\);\n        }/g,
        "if (req.user.role !== 'admin' && req.user.role !== 'accountant') {\n            return res.status(403).json({ msg: 'Not authorized' });\n        }");

    fs.writeFileSync('routes/fees.js', feesjs);
}

// 5. Update index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// A. Insert Accountant Card
const accountantCard = `
                    <div class="role-card" id="cardAccountant" onclick="switchLoginPortal('accountant')">
                        <div class="role-icon"><i class="fas fa-calculator"></i></div>
                        <div class="role-title">Accountant</div>
                        <div class="role-desc">Manage fees & reports</div>
                    </div>`;

if (!html.includes('id="cardAccountant"')) {
    html = html.replace(/<div class="role-card" id="cardTeacher" onclick="switchLoginPortal\('teacher'\)">[\s\S]*?<\/div>\s+<\/div>/,
        `<div class="role-card" id="cardTeacher" onclick="switchLoginPortal('teacher')">
                        <div class="role-icon"><i class="fas fa-chalkboard-teacher"></i></div>
                        <div class="role-title">Teacher</div>
                        <div class="role-desc">Manage classes & attendance</div>
                    </div>${accountantCard}\n                </div>`);
}

// B. Insert Accountant Dashboard HTML right before "Scripts" or at end
const accountantDashboard = `
    <!-- ========== ACCOUNTANT DASHBOARD ========== -->
    <div class="app-layout" id="accountantDashboard" style="display:none;">
        <div class="sidebar-overlay" onclick="toggleAccountantSidebar()"></div>
        <aside class="sidebar" id="accountantSidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo"><i class="fas fa-school" style="font-size: 2rem; color: white;"></i></div>
                <div class="sidebar-title">
                    <h2 id="accountantSidebarSchoolName">Vidya HMS</h2>
                    <p>Finance Panel</p>
                </div>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-section-title">Finance</div>
                    <div class="nav-item active" onclick="showAccountantSection('accHome', this)">
                        <span class="nav-icon"><i class="fas fa-th-large"></i></span> Dashboard
                    </div>
                    <div class="nav-item" onclick="showAccountantSection('accFees', this)">
                        <span class="nav-icon"><i class="fas fa-rupee-sign"></i></span> Manage Fees
                    </div>
                </div>
            </nav>
            <div class="sidebar-footer">
                <div class="user-info" onclick="logout()">
                    <div class="user-avatar" id="accountantAvatar">A</div>
                    <div class="user-details">
                        <h4 id="accountantName">Accountant</h4>
                        <p>Accountant</p>
                    </div>
                </div>
            </div>
        </aside>

        <main class="main-content">
            <header class="header">
                <div class="header-left">
                    <button class="menu-toggle" onclick="toggleAccountantSidebar()"><i class="fas fa-bars"></i></button>
                    <div>
                        <h1 id="accPageTitle">Financial Dashboard</h1>
                    </div>
                </div>
                <div class="header-right">
                    <button class="btn-logout" onclick="logout()"><i class="fas fa-power-off"></i> <span>Logout</span></button>
                </div>
            </header>

            <div class="content-area">
                <!-- ACC HOME -->
                <div class="section-page active" id="accHome">
                    <div class="welcome-banner">
                        <h2>Welcome, <span id="accWelcomeName">Accountant</span>! 👋</h2>
                        <p>Here is the current financial overview.</p>
                    </div>
                    
                    <div class="stats-grid" id="accStats"></div>

                    <div class="card mt-3">
                        <div class="card-header">
                            <h2><i class="fas fa-clock" style="color:var(--accent-amber)"></i> Recent Fee Collections</h2>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Class</th>
                                            <th>Amount</th>
                                            <th>Month</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="accRecentFeesTable"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ACC FEES -->
                <div class="section-page" id="accFees">
                    <div class="card">
                        <div class="card-header">
                            <h2><i class="fas fa-rupee-sign" style="color:var(--accent-emerald)"></i> Fee Management</h2>
                            <button class="btn btn-primary" onclick="openModal('addFeeModal')"><i class="fas fa-plus"></i> Create Fee</button>
                        </div>
                        <div class="card-body">
                            <div class="filter-bar">
                                <select class="form-control" id="accFilterFeeStatus" onchange="loadAccFees()">
                                    <option value="">All Status</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                                <select class="form-control" id="accFilterFeeMonth" onchange="loadAccFees()">
                                    <option value="">All Months</option>
                                    <option>January</option><option>February</option><option>March</option>
                                    <option>April</option><option>May</option><option>June</option>
                                    <option>July</option><option>August</option><option>September</option>
                                    <option>October</option><option>November</option><option>December</option>
                                </select>
                            </div>
                            <div class="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Class</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Month</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="accFeesTable"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
`;
if (!html.includes('id="accountantDashboard"')) {
    html = html.replace('<!-- Toast Container -->', accountantDashboard + '\n    <!-- Toast Container -->');
    fs.writeFileSync('public/index.html', html);
}

// 6. Update app.js
let js = fs.readFileSync('public/js/app.js', 'utf8');

// switchLoginPortal
js = js.replace(/function switchLoginPortal\(role\) {[\s\S]*?document\.getElementById\('cardAdmin'\)\.classList\.remove\('active'\);[\s\S]*?}/,
    `function switchLoginPortal(role) {
    document.getElementById('hiddenLoginRole').value = role;
    
    document.getElementById('cardAdmin')?.classList.remove('active');
    document.getElementById('cardTeacher')?.classList.remove('active');
    document.getElementById('cardAccountant')?.classList.remove('active');
    
    if (role === 'admin') document.getElementById('cardAdmin')?.classList.add('active');
    if (role === 'teacher') document.getElementById('cardTeacher')?.classList.add('active');
    if (role === 'accountant') document.getElementById('cardAccountant')?.classList.add('active');

    const emailWrapper = document.getElementById('loginEmailWrapper');
    const idWrapper = document.getElementById('loginIdWrapper');

    if (role === 'admin') {
        emailWrapper.style.display = 'block';
        idWrapper.style.display = 'none';
    } else {
        emailWrapper.style.display = 'none';
        idWrapper.style.display = 'block';
    }
}`);

// toggleAccountantSidebar
if (!js.includes('toggleAccountantSidebar')) {
    js = js.replace('// ========== AUTHENTICATION ==========',
        `function toggleAccountantSidebar() {
    const sidebar = document.getElementById('accountantSidebar');
    sidebar.classList.toggle('open');
}

function showAccountantSection(sectionId, element) {
    document.querySelectorAll('#accountantDashboard .section-page').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('#accountantSidebar .nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    
    if (sectionId === 'accHome') loadAccountantDashboard();
    if (sectionId === 'accFees') loadAccFees();
    
    toggleAccountantSidebar(); // Mobile close
}

// ========== AUTHENTICATION ==========`);
}

// Routing in checkAuth
js = js.replace(/if \(currentUser\.role === 'admin'\) {[\s\S]*?loadDashboard\(\);[\s\S]*?} else if \(currentUser\.role === 'teacher'\) {[\s\S]*?}/,
    `if (currentUser.role === 'admin') {
            document.getElementById('adminDashboard').style.display = 'flex';
            document.getElementById('adminName').textContent = currentUser.name;
            document.getElementById('sidebarSchoolName').textContent = schoolNameStr;
            document.getElementById('welcomeSchoolName').textContent = schoolNameStr;
            document.getElementById('adminWelcomeName').textContent = currentUser.name;
            loadDashboard();
        } else if (currentUser.role === 'teacher') {
            document.getElementById('teacherDashboard').style.display = 'flex';
            document.getElementById('teacherName').textContent = currentUser.name;
            document.getElementById('teacherSidebarSchoolName').textContent = schoolNameStr;
            document.getElementById('teacherWelcomeName').textContent = currentUser.name;
            loadTeacherDashboard();
        } else if (currentUser.role === 'accountant') {
            document.getElementById('accountantDashboard').style.display = 'flex';
            document.getElementById('accountantName').textContent = currentUser.name;
            document.getElementById('accountantSidebarSchoolName').textContent = schoolNameStr;
            document.getElementById('accWelcomeName').textContent = currentUser.name;
            loadAccountantDashboard();
        }`);

// Accountant Dashboard Loaders
if (!js.includes('loadAccountantDashboard')) {
    js += `
async function loadAccountantDashboard() {
    try {
        const stats = await api('/api/fees/summary/overview');
        if (stats) {
            document.getElementById('accStats').innerHTML = \`
                <div class="stat-card blue">
                    <div class="stat-header"><div class="stat-icon"><i class="fas fa-rupee-sign"></i></div></div>
                    <div class="stat-value">₹\${formatNum(stats.totalAmount)}</div>
                    <div class="stat-label">Total Expected</div>
                </div>
                <div class="stat-card emerald">
                    <div class="stat-header"><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
                    <div class="stat-value">₹\${formatNum(stats.collectedAmount)}</div>
                    <div class="stat-label">Collected</div>
                </div>
                <div class="stat-card amber">
                    <div class="stat-header"><div class="stat-icon"><i class="fas fa-clock"></i></div></div>
                    <div class="stat-value">₹\${formatNum(stats.pendingAmount)}</div>
                    <div class="stat-label">Pending Amount</div>
                </div>
            \`;
        }
        
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        const fees = await api(\`/api/fees?month=\${currentMonthName}\`);
        if (fees && fees.length > 0) {
            document.getElementById('accRecentFeesTable').innerHTML = fees.slice(0, 8).map(f => \`
                <tr>
                    <td>\${f.student?.name || 'N/A'}</td>
                    <td>\${f.student?.class || '-'}</td>
                    <td>₹\${f.amount}</td>
                    <td>\${f.month}</td>
                    <td><span class="badge \${f.status.toLowerCase()}">\${f.status}</span></td>
                </tr>
            \`).join('');
        }
    } catch(err) {}
}

async function loadAccFees() {
    const status = document.getElementById('accFilterFeeStatus').value;
    const month = document.getElementById('accFilterFeeMonth').value;
    
    let url = '/api/fees?sort=desc';
    if(status) url += \`&status=\${status}\`;
    if(month) url += \`&month=\${month}\`;
    
    const fees = await api(url);
    if(fees) {
        document.getElementById('accFeesTable').innerHTML = fees.map(f => {
            let actions = '';
            if (f.status !== 'Paid') {
                actions += \`<button class="btn-icon bg-emerald" onclick="markAccFeePaid('\${f._id}')" title="Mark Paid"><i class="fas fa-check"></i></button>\`;
            }
            if (f.status === 'Paid') {
                actions += \`<button class="btn-icon bg-blue" onclick="downloadReceipt('\${f._id}')" title="Receipt"><i class="fas fa-download"></i></button>\`;
            }
            return \`
            <tr>
                <td>\${f.student?.name} (\${f.student?.admissionNumber})</td>
                <td>\${f.student?.class}</td>
                <td>\${f.feeType}</td>
                <td>₹\${f.amount}</td>
                <td>\${f.month}</td>
                <td><span class="badge \${f.status.toLowerCase()}">\${f.status}</span></td>
                <td>\${actions}</td>
            </tr>\`;
        }).join('');
    }
}

async function markAccFeePaid(id) {
    if (!confirm('Mark fee as Paid?')) return;
    const res = await api('/api/fees/' + id, 'PUT', { status: 'Paid' });
    if (res && res.msg) {
        showToast(res.msg);
        loadAccFees();
        loadAccountantDashboard();
    }
}
`;
}

// Remove teacher access to loadFees, etc in UI ?
// They don't have fee tabs anymore in index.html (I checked earlier, they just have Home, Attendance, Marks, Students).
// In admin section, check how it behaves. The modal logic applies globally. 
// "addFeeModal" is callable by Admin & Accountant.

fs.writeFileSync('public/js/app.js', js, 'utf8');

console.log("Accountant role and dashboard setup complete.");
