// ========================================
// School Management System - Frontend App
// ========================================

const API = '';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// ========== API HELPER ==========
async function api(endpoint, method = 'GET', body = null) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API}${endpoint}`, options);
        if (res.status === 401) { logout(); return null; }
        // Check if response is PDF
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
            return res.blob();
        }
        const data = await res.json();
        if (!res.ok) {
            console.warn('API Error:', endpoint, data.msg || res.status);
            return data; // Return error data so caller can handle msg
        }
        return data;
    } catch (err) {
        console.error('API fetch error:', endpoint, err.message);
        return null;
    }
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== MODAL ==========
function openModal(id) {
    document.getElementById(id).classList.add('active');
    // Populate student dropdowns
    if (id === 'addFeeModal' || id === 'addResultModal') {
        loadStudentsDropdown(id === 'addFeeModal' ? 'fStudent' : 'rStudent');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ========== SIDEBAR ==========
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('#adminDashboard .sidebar-overlay');
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function toggleTeacherSidebar() {
    const sidebar = document.getElementById('teacherSidebar');
    sidebar.classList.toggle('open');
}

function toggleStudentSidebar() {
    const sidebar = document.getElementById('studentSidebar');
    sidebar.classList.toggle('open');
}

// ========== AUTHENTICATION ==========
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    // Determine active role from tabs
    const role = document.getElementById('hiddenLoginRole').value;

    if (!role) {
        showLoginError('Please select a role');
        resetLoginBtn();
        return;
    }

    const data = {
        role,
        password: document.getElementById('loginPassword').value
    };

    if (role === 'admin') {
        data.schoolName = document.getElementById('loginSchoolName').value.trim();
        data.email = document.getElementById('loginEmail').value.trim();
    } else {
        data.loginId = document.getElementById('loginId').value.trim();
    }

    try {
        const response = await api('/api/auth/login', 'POST', data);
        if (!response || response.msg) {
            showLoginError(response?.msg || 'Login failed');
            resetLoginBtn();
            return;
        }

        // Check role match
        if (response.user.role !== role) {
            showLoginError(`This account is not registered as ${role}`);
            resetLoginBtn();
            return;
        }

        token = response.token;
        currentUser = response.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));

        showDashboard(currentUser.role);
    } catch (err) {
        showLoginError('Connection error. Make sure the server is running.');
        resetLoginBtn();
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.style.display = 'block';
}

function resetLoginBtn() {
    const btn = document.getElementById('loginBtn');
    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.getElementById('loginPage').style.display = '';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('teacherDashboard').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();

    // Hide register and forgot password forms
    document.getElementById('registerSchoolForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';

    resetLoginBtn();
    // Reset all sections back to home
    resetAllSections();
}

function resetAllSections() {
    // Reset admin sections
    document.querySelectorAll('#adminDashboard .section-page').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .nav-item').forEach(n => n.classList.remove('active'));
    const adminHome = document.getElementById('adminHome');
    if (adminHome) adminHome.classList.add('active');
    const adminNavFirst = document.querySelector('#adminDashboard .nav-item');
    if (adminNavFirst) adminNavFirst.classList.add('active');

    // Reset teacher sections
    document.querySelectorAll('#teacherDashboard .section-page').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#teacherDashboard .nav-item').forEach(n => n.classList.remove('active'));
    const teacherHome = document.getElementById('teacherHome');
    if (teacherHome) teacherHome.classList.add('active');
    const teacherNavFirst = document.querySelector('#teacherDashboard .nav-item');
    if (teacherNavFirst) teacherNavFirst.classList.add('active');


    // Reset page titles
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = 'Dashboard';
    const pageSubtitle = document.getElementById('pageSubtitle');
    if (pageSubtitle) pageSubtitle.textContent = "Welcome back! Here's your overview.";
    const teacherPageTitle = document.getElementById('teacherPageTitle');
    if (teacherPageTitle) teacherPageTitle.textContent = 'Dashboard';
    if (teacherPageTitle) teacherPageTitle.textContent = 'Dashboard';
}
function showDashboard(role) {
    document.getElementById('loginPage').style.display = 'none';
    resetAllSections();

    // Set school name in UI if available
    const schoolNameStr = currentUser?.schoolName || 'CampusSync';
    if (document.getElementById('sidebarSchoolName')) document.getElementById('sidebarSchoolName').textContent = schoolNameStr;
    if (document.getElementById('teacherSidebarSchoolName')) document.getElementById('teacherSidebarSchoolName').textContent = schoolNameStr;
    if (document.getElementById('welcomeSchoolName')) document.getElementById('welcomeSchoolName').textContent = schoolNameStr;

    if (role === 'admin') {
        document.getElementById('adminDashboard').style.display = 'flex';
        document.getElementById('adminName').textContent = currentUser.name;
        document.getElementById('adminAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        loadAdminDashboard();
    } else if (role === 'teacher') {
        document.getElementById('teacherDashboard').style.display = 'flex';
        document.getElementById('teacherName').textContent = currentUser.name;
        document.getElementById('teacherAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        // Set welcome name in Staff panel
        const welcomeEl = document.getElementById('teacherWelcomeName');
        if (welcomeEl) welcomeEl.textContent = currentUser.name;
        if (typeof loadTeacherDashboard === "function") loadTeacherDashboard();
    }
}

// ========== REGISTER SCHOOL & FORGOT PASSWORD TOGGLES ==========
function switchLoginPortal(portalType) {
    const cardAdmin = document.getElementById('cardAdmin');
    const cardTeacher = document.getElementById('cardTeacher');
    const hiddenRole = document.getElementById('hiddenLoginRole');

    // Login Form Fields
    const loginSchoolWrapper = document.getElementById('loginSchoolWrapper');
    const loginEmailWrapper = document.getElementById('loginEmailWrapper');
    const loginIdWrapper = document.getElementById('loginIdWrapper');

    // Forgot Password Form Fields
    const forgotSchoolWrapper = document.getElementById('forgotSchoolWrapper');
    const forgotEmailWrapper = document.getElementById('forgotEmailWrapper');
    const forgotIdWrapper = document.getElementById('forgotIdWrapper');
    const forgotDobWrapper = document.getElementById('forgotDobWrapper');
    const forgotNewPassWrapper = document.getElementById('forgotNewPassWrapper');

    // Reset active class
    if (cardAdmin) cardAdmin.classList.remove('active');
    if (cardTeacher) cardTeacher.classList.remove('active');

    hiddenRole.value = portalType;

    if (portalType === 'admin') {
        if (cardAdmin) cardAdmin.classList.add('active');

        // Show Admin Login Fields
        loginSchoolWrapper.style.display = 'block';
        loginEmailWrapper.style.display = 'block';
        loginIdWrapper.style.display = 'none';
        document.getElementById('loginSchoolName').setAttribute('required', 'true');
        document.getElementById('loginEmail').setAttribute('required', 'true');
        document.getElementById('loginId').removeAttribute('required');

        // Show Admin Forgot Fields
        forgotSchoolWrapper.style.display = 'block';
        forgotEmailWrapper.style.display = 'block';
        forgotIdWrapper.style.display = 'none';
        forgotDobWrapper.style.display = 'none';
        forgotNewPassWrapper.style.display = 'none';
        document.getElementById('forgotSchoolName').setAttribute('required', 'true');
        document.getElementById('forgotEmail').setAttribute('required', 'true');
        document.getElementById('forgotId').removeAttribute('required');
        document.getElementById('forgotDob').removeAttribute('required');
        document.getElementById('forgotNewPass').removeAttribute('required');

        document.getElementById('forgotBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
    } else {
        if (portalType === 'teacher' && cardTeacher) cardTeacher.classList.add('active');

        // Show Staff Login Fields
        loginSchoolWrapper.style.display = 'none';
        loginEmailWrapper.style.display = 'none';
        loginIdWrapper.style.display = 'block';
        document.getElementById('loginSchoolName').removeAttribute('required');
        document.getElementById('loginEmail').removeAttribute('required');
        document.getElementById('loginId').setAttribute('required', 'true');
        document.getElementById('loginId').placeholder = 'Employee Number';

        // Show Staff/Student Forgot Fields
        forgotSchoolWrapper.style.display = 'none';
        forgotEmailWrapper.style.display = 'none';
        forgotIdWrapper.style.display = 'block';
        forgotDobWrapper.style.display = 'block';
        forgotNewPassWrapper.style.display = 'block';
        document.getElementById('forgotSchoolName').removeAttribute('required');
        document.getElementById('forgotEmail').removeAttribute('required');
        document.getElementById('forgotId').setAttribute('required', 'true');
        document.getElementById('forgotId').placeholder = 'Employee Number';
        document.getElementById('forgotDob').setAttribute('required', 'true');
        document.getElementById('forgotNewPass').setAttribute('required', 'true');

        document.getElementById('forgotBtn').innerHTML = '<i class="fas fa-key"></i> Reset Password Now';
    }
}

function showRegisterSchool(e) {
    if (e) e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('registerSchoolForm').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
}

function showLoginForm(e) {
    if (e) e.preventDefault();
    document.getElementById('registerSchoolForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
}

function showForgotPassword(e) {
    if (e) e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerSchoolForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
}

async function handleRegisterSchool(e) {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

    const data = {
        schoolName: document.getElementById('regSchoolName').value.trim(),
        schoolEmail: document.getElementById('regSchoolEmail').value.trim(),
        schoolPhone: document.getElementById('regSchoolPhone').value.trim(),
        schoolAddress: document.getElementById('regSchoolAddress').value.trim(),
        adminName: document.getElementById('regAdminName').value.trim(),
        adminPassword: document.getElementById('regAdminPassword').value
    };

    try {
        const response = await api('/api/school/register-school', 'POST', data);
        if (response && response.schoolCode) {
            document.getElementById('registerSchoolForm').reset();
            alert('School registered! You can now log in.');
            showLoginForm();
        } else {
            const errorMsg = response?.errors ? response.errors[0].msg : (response?.msg || 'Registration failed');
            showLoginError(errorMsg);
        }
    } catch (err) {
        showLoginError('Connection error. Try again.');
    }

    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-plus-circle"></i> Register School';
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const btn = document.getElementById('forgotBtn');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    const hiddenRole = document.getElementById('hiddenLoginRole').value;

    let endpoint, payload;
    if (hiddenRole === 'admin') {
        const schoolName = document.getElementById('forgotSchoolName').value.trim();
        const email = document.getElementById('forgotEmail').value.trim();
        endpoint = '/api/auth/forgot-password';
        payload = { schoolName, email };
    } else {
        const loginId = document.getElementById('forgotId').value.trim();
        const dob = document.getElementById('forgotDob').value;
        const newPassword = document.getElementById('forgotNewPass').value;
        const role = document.getElementById('forgotRole') ? document.getElementById('forgotRole').value : null;

        endpoint = '/api/auth/reset-dob';
        payload = { loginId, dob, newPassword };
    }

    const data = await api(endpoint, 'POST', payload);
    if (data && data.msg) {
        alert(data.msg);
        if (hiddenRole !== 'admin') {
            document.getElementById('forgotPasswordForm').reset();
        }
        showLoginForm();
    } else {
        showLoginError('Request failed. Check your details.');
    }

    btn.classList.remove('loading');
    if (hiddenRole === 'admin') {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
    } else {
        btn.innerHTML = '<i class="fas fa-key"></i> Reset Password Now';
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const btn = document.getElementById('resetBtn');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        showLoginError('Passwords do not match');
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');

    const data = await api(`/api/auth/reset-password/${resetToken}`, 'POST', { newPassword });
    if (data && data.msg === 'Password has been reset successfully! You can now login with your new password.') {
        alert(data.msg);
        window.history.replaceState({}, document.title, window.location.pathname);
        showLoginForm();
    } else {
        showLoginError('Failed to reset password');
    }

    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
}

// Check for reset password token in URL on load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');
    if (resetToken) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerSchoolForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('resetPasswordForm').style.display = 'block';
    }
});

// ========== SECTION NAVIGATION ==========
function showSection(sectionId, navItem) {
    // Hide all admin sections
    document.querySelectorAll('#adminDashboard .section-page').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    if (navItem) navItem.classList.add('active');

    // Update header title
    const titles = {
        adminHome: ['Dashboard', 'Welcome back! Here\'s your overview.'],
        adminStudents: ['Students', 'Manage all students'],
        adminTeachers: ['Teachers', 'Manage teaching staff'],
        adminFees: ['Fee Management', 'Track and manage fees'],
        adminAttendance: ['Attendance Records', 'View student attendance logs'],
        adminResults: ['Results', 'View and manage results'],
        adminAdmission: ['New Admission', 'Register a new student']
    };

    if (titles[sectionId]) {
        document.getElementById('pageTitle').textContent = titles[sectionId][0];
        document.getElementById('pageSubtitle').textContent = titles[sectionId][1];
    }

    // Load section data
    if (sectionId === 'adminStudents') loadStudents();
    if (sectionId === 'adminTeachers') loadTeachers();
    if (sectionId === 'adminFees') loadFees();
    if (sectionId === 'adminAttendance') loadAttendanceRecords();
    if (sectionId === 'adminResults') loadResults();

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    const overlay = document.querySelector('#adminDashboard .sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
}
function showTeacherSection(sectionId, navItem) {
    document.querySelectorAll('#teacherDashboard .section-page').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#teacherDashboard .nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    if (navItem) navItem.classList.add('active');

    const titles = { teacherHome: 'Dashboard', teacherAttendance: 'Mark Attendance', teacherMarks: 'Upload Marks', teacherStudentList: 'My Students' };
    document.getElementById('teacherPageTitle').textContent = titles[sectionId] || 'Dashboard';

    if (sectionId === 'teacherStudentList') loadTeacherStudents();

    document.getElementById('teacherSidebar').classList.remove('open');
}// ========== ADMIN DASHBOARD ==========
async function loadAdminDashboard() {
    try {
        // Update welcome banner
        document.getElementById('adminWelcomeName').textContent = currentUser?.name || 'Admin';
        const now = new Date();
        const dayEl = document.getElementById('adminDateDay');
        const monthEl = document.getElementById('adminDateMonth');
        if (dayEl) dayEl.textContent = now.getDate();
        if (monthEl) monthEl.textContent = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        const stats = await api('/api/dashboard/stats');
        if (!stats) return;

        // Stats cards
        document.getElementById('dashStats').innerHTML = `
            <div class="stat-card blue">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
                </div>
                <div class="stat-value">${stats.totalStudents}</div>
                <div class="stat-label">Total Students</div>
            </div>
            <div class="stat-card violet">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-chalkboard-teacher"></i></div>
                </div>
                <div class="stat-value">${stats.totalTeachers}</div>
                <div class="stat-label">Total Teachers</div>
            </div>
            <div class="stat-card green">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-rupee-sign"></i></div>
                </div>
                <div class="stat-value">₹${formatNum(stats.collectedFeeAmount)}</div>
                <div class="stat-label">Fees Collected</div>
            </div>
            <div class="stat-card amber">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                </div>
                <div class="stat-value">₹${formatNum(stats.pendingFeeAmount)}</div>
                <div class="stat-label">Fees Pending</div>
            </div>
            <div class="stat-card cyan">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-clipboard-check"></i></div>
                </div>
                <div class="stat-value">${stats.attendancePercentage}%</div>
                <div class="stat-label">Today's Attendance</div>
            </div>
            <div class="stat-card rose">
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-file-invoice"></i></div>
                </div>
                <div class="stat-value">${stats.pendingFees}</div>
                <div class="stat-label">Pending Invoices</div>
            </div>
        `;

        // Class-wise bar chart
        if (stats.classWise && stats.classWise.length > 0) {
            const maxCount = Math.max(...stats.classWise.map(c => c.count));
            document.getElementById('classChart').innerHTML = stats.classWise.map(c => `
                <div class="bar-item">
                    <div class="bar-value">${c.count}</div>
                    <div class="bar" style="height: ${(c.count / maxCount) * 100}%"></div>
                    <div class="bar-label">Class ${c._id}</div>
                </div>
            `).join('');
        }

        // Fee donut chart
        const totalFee = stats.totalFeeAmount || 1;
        const collectedPct = Math.round((stats.collectedFeeAmount / totalFee) * 100);
        const pendingPct = 100 - collectedPct;
        const circumference = 2 * Math.PI * 54;
        const collectedDash = (collectedPct / 100) * circumference;

        document.getElementById('feeDonut').innerHTML = `
            <div class="donut-ring">
                <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="54" fill="none" stroke="#e2e8f0" stroke-width="14"/>
                    <circle cx="70" cy="70" r="54" fill="none" stroke="#10b981" stroke-width="14"
                        stroke-dasharray="${collectedDash} ${circumference}" stroke-linecap="round"/>
                </svg>
                <div class="donut-value">
                    <span>${collectedPct}%</span>
                    <small>Collected</small>
                </div>
            </div>
            <div class="donut-legend">
                <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> Collected: ₹${formatNum(stats.collectedFeeAmount)}</div>
                <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Pending: ₹${formatNum(stats.pendingFeeAmount)}</div>
                <div class="legend-item"><div class="legend-dot" style="background:#e2e8f0"></div> Total: ₹${formatNum(stats.totalFeeAmount)}</div>
            </div>
        `;

        // Recent fees
        const fees = await api('/api/fees?limit=10');
        if (fees && fees.length > 0) {
            document.getElementById('recentFeesTable').innerHTML = fees.slice(0, 8).map(f => `
                <tr>
                    <td><strong>${f.student?.name || 'N/A'}</strong></td>
                    <td>${f.student?.class || '-'}</td>
                    <td>₹${f.amount}</td>
                    <td>${f.month}</td>
                    <td><span class="badge ${f.status.toLowerCase()}">${f.status}</span></td>
                    <td>${f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Dashboard Error:', err);
    }
}

// ========== STUDENTS CRUD ==========
async function loadStudents() {
    const cls = document.getElementById('filterStudentClass').value;
    const search = document.getElementById('searchStudent').value;
    let url = '/api/students?';
    if (cls) url += `class=${cls}&`;
    if (search) url += `search=${search}&`;

    const students = await api(url);
    if (!students) return;

    document.getElementById('studentsTable').innerHTML = students.length ? students.map(s => `
        <tr>
            <td><strong>${s.admissionNumber}</strong></td>
            <td>${s.name}</td>
            <td>Class ${s.class}</td>
            <td>${s.section}</td>
            <td>${s.rollNumber}</td>
            <td>${s.fatherName}</td>
            <td>${s.phone}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editStudent('${s._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s._id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="8" class="text-center" style="padding:32px;color:var(--gray-400)">No students found</td></tr>';
}

async function handleAddStudent(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('sName').value,
        address: document.getElementById('sAddress').value,
        class: document.getElementById('sClass').value,
        section: document.getElementById('sSection').value,
        rollNumber: document.getElementById('sRoll').value,
        fatherName: document.getElementById('sFather').value,
        phone: document.getElementById('sPhone').value,
        email: document.getElementById('sEmail').value,
        dateOfBirth: document.getElementById('sDob').value
    };

    const result = await api('/api/students', 'POST', data);
    if (result && !result.msg?.includes('error')) {
        showToast('Student added successfully!');
        closeModal('addStudentModal');
        document.getElementById('addStudentForm').reset();
        loadStudents();
    } else {
        showToast(result?.msg || 'Error adding student', 'error');
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to remove this student?')) return;
    const result = await api(`/api/students/${id}`, 'DELETE');
    if (result) {
        showToast('Student removed');
        loadStudents();
    }
}

async function editStudent(id) {
    try {
        const student = await api(`/api/students/${id}`);
        if (!student) return showToast('Student not found', 'error');

        document.getElementById('editStudentId').value = student._id;
        document.getElementById('esName').value = student.name || '';

        document.getElementById('esClass').value = student.class || '';
        document.getElementById('esSection').value = student.section || 'A';
        document.getElementById('esRoll').value = student.rollNumber || '';
        document.getElementById('esFather').value = student.fatherName || '';
        document.getElementById('esMother').value = student.motherName || '';
        document.getElementById('esPhone').value = student.phone || '';
        document.getElementById('esEmail').value = student.email || '';
        document.getElementById('esAddress').value = student.address || '';
        document.getElementById('esDob').value = student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '';

        openModal('editStudentModal');
    } catch (err) {
        showToast('Error loading student details', 'error');
    }
}

async function handleEditStudent(e) {
    e.preventDefault();
    const id = document.getElementById('editStudentId').value;
    const data = {
        name: document.getElementById('esName').value,
        class: document.getElementById('esClass').value,
        section: document.getElementById('esSection').value,
        rollNumber: document.getElementById('esRoll').value,
        fatherName: document.getElementById('esFather').value,
        motherName: document.getElementById('esMother').value,
        phone: document.getElementById('esPhone').value,
        email: document.getElementById('esEmail').value,
        address: document.getElementById('esAddress').value,
        dateOfBirth: document.getElementById('esDob').value
    };

    const result = await api(`/api/students/${id}`, 'PUT', data);
    if (result && result.student) {
        showToast('Student updated successfully!');
        closeModal('editStudentModal');
        loadStudents();
    } else {
        showToast(result?.msg || 'Error updating student', 'error');
    }
}

// ========== STUDENT DROPDOWN ==========
async function loadStudentsDropdown(selectId) {
    const students = await api('/api/students');
    if (!students) return;
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select Student</option>' +
        students.map(s => `<option value="${s._id}">${s.name} (${s.class}-${s.section}, ${s.admissionNumber})</option>`).join('');
}

async function loadTeachers() {
    const teachers = await api('/api/teachers');
    if (!teachers) return;

    document.getElementById('teachersTable').innerHTML = teachers.length ? teachers.map(t => `
        <tr>
            <td><strong>${t.employeeId}</strong></td>
            <td>${t.name}</td>
            <td>${t.subject}</td>
            <td>${t.assignedClasses?.join(', ') || '-'}</td>
            <td>${t.phone}</td>
            <td>${t.qualification || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editTeacher('${t._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${t._id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--gray-400)">No teachers found</td></tr>';
}

async function editTeacher(id) {
    try {
        const teacher = await api(`/api/teachers/${id}`);
        if (!teacher) return showToast('Teacher not found', 'error');

        document.getElementById('editTeacherId').value = teacher._id;
        document.getElementById('etName').value = teacher.name || '';

        document.getElementById('etSubject').value = teacher.subject || '';
        document.getElementById('etQual').value = teacher.qualification || '';
        document.getElementById('etPhone').value = teacher.phone || '';
        document.getElementById('etEmail').value = teacher.email || '';
        document.getElementById('etClasses').value = (teacher.assignedClasses || []).join(', ');
        document.getElementById('etAddress').value = teacher.address || '';
        document.getElementById('etDob').value = teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : '';

        openModal('editTeacherModal');
    } catch (err) {
        showToast('Error loading teacher details', 'error');
    }
}

async function handleEditTeacher(e) {
    e.preventDefault();
    const id = document.getElementById('editTeacherId').value;
    const data = {
        name: document.getElementById('etName').value,
        subject: document.getElementById('etSubject').value,
        qualification: document.getElementById('etQual').value,
        phone: document.getElementById('etPhone').value,
        email: document.getElementById('etEmail').value,
        assignedClasses: document.getElementById('etClasses').value.split(',').map(c => c.trim()).filter(Boolean),
        address: document.getElementById('etAddress').value,
        dateOfBirth: document.getElementById('etDob').value
    };

    const result = await api(`/api/teachers/${id}`, 'PUT', data);
    if (result && result.teacher) {
        showToast('Teacher updated successfully!');
        closeModal('editTeacherModal');
        loadTeachers();
    } else {
        showToast(result?.msg || 'Error updating teacher', 'error');
    }
}

async function handleAddTeacher(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('tName').value,
        employeeId: document.getElementById('tEmpId').value.trim(),
        address: document.getElementById('tAddress').value,
        subject: document.getElementById('tSubjectInput').value,
        qualification: document.getElementById('tQual').value,
        phone: document.getElementById('tPhone').value,
        email: document.getElementById('tEmail').value,
        assignedClasses: document.getElementById('tClasses').value.split(',').map(c => c.trim()).filter(Boolean),
        dateOfBirth: document.getElementById('tDob').value
    };

    const result = await api('/api/teachers', 'POST', data);
    if (result && !result.msg?.includes('error')) {
        showToast('Teacher added successfully!');
        closeModal('addTeacherModal');
        document.getElementById('addTeacherForm').reset();
        loadTeachers();
    } else {
        showToast(result?.msg || 'Error adding teacher', 'error');
    }
}

async function deleteTeacher(id) {
    if (!confirm('Are you sure you want to remove this teacher?')) return;
    await api(`/api/teachers/${id}`, 'DELETE');
    showToast('Teacher removed');
    loadTeachers();
}

// ========== FEES MANAGEMENT ==========
async function loadFees() {
    const status = document.getElementById('filterFeeStatus').value;
    const month = document.getElementById('filterFeeMonth').value;
    let url = '/api/fees?';
    if (status) url += `status=${status}&`;
    if (month) url += `month=${month}&`;

    const fees = await api(url);
    if (!fees) return;

    document.getElementById('feesTable').innerHTML = fees.length ? fees.map(f => `
        <tr>
            <td><strong>${f.student?.name || 'N/A'}</strong></td>
            <td>${f.student?.class || '-'}-${f.student?.section || ''}</td>
            <td>${f.feeType}</td>
            <td>₹${f.amount}</td>
            <td>${f.month} ${f.year}</td>
            <td><span class="badge ${f.status.toLowerCase()}">${f.status}</span></td>
            <td>
                ${f.status === 'Pending' ? `<button class="btn btn-sm btn-success" onclick="markFeePaid('${f._id}', ${f.amount})"><i class="fas fa-check"></i> Pay</button>` : ''}
                <button class="btn btn-sm btn-outline" onclick="downloadReceipt('${f._id}')" title="Receipt"><i class="fas fa-download"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteFee('${f._id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--gray-400)">No fee records found</td></tr>';
}

async function handleAddFee(e) {
    e.preventDefault();
    const data = {
        student: document.getElementById('fStudent').value,
        feeType: document.getElementById('fType').value,
        amount: parseInt(document.getElementById('fAmount').value),
        month: document.getElementById('fMonth').value,
        year: parseInt(document.getElementById('fYear').value),
        status: document.getElementById('fStatus').value,
        paymentMethod: document.getElementById('fMethod').value
    };

    const result = await api('/api/fees', 'POST', data);
    if (result && result.fee) {
        showToast('Fee record created!');
        closeModal('addFeeModal');
        document.getElementById('addFeeForm').reset();
        loadFees();
    } else {
        showToast(result?.msg || 'Error creating fee', 'error');
    }
}

async function markFeePaid(id, amount) {
    if (!confirm('Mark this fee as Paid?')) return;
    const result = await api(`/api/fees/${id}`, 'PUT', { status: 'Paid', amount, paymentMethod: 'Cash' });
    if (result) {
        showToast('Fee marked as Paid!');
        loadFees();
    }
}

async function deleteFee(id) {
    if (!confirm('Delete this fee record?')) return;
    await api(`/api/fees/${id}`, 'DELETE');
    showToast('Fee record deleted');
    loadFees();
}

async function downloadReceipt(feeId) {
    try {
        const response = await fetch(`${API}/api/fees/receipt/${feeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to generate receipt');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${feeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast('Receipt downloaded!');
    } catch (err) {
        showToast('Error downloading receipt', 'error');
    }
}

// ========== ATTENDANCE MANAGEMENT ==========
async function loadAttendanceStudents() {
    const cls = document.getElementById('attClass').value;
    const section = document.getElementById('attSection').value;
    if (!cls) {
        document.getElementById('attendanceList').innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>Select a class to mark attendance</h3></div>';
        return;
    }

    const students = await api(`/api/students?class=${cls}&section=${section}`);
    if (!students || !students.length) {
        document.getElementById('attendanceList').innerHTML = '<div class="empty-state"><h3>No students found</h3></div>';
        return;
    }

    document.getElementById('attendanceList').innerHTML = `
        <div class="attendance-grid">
            ${students.map(s => `
                <div class="attendance-row">
                    <div>
                        <div class="student-name">${s.name}</div>
                        <div class="roll-num">Roll: ${s.rollNumber}</div>
                    </div>
                    <div class="roll-num">${s.admissionNumber}</div>
                    <select id="att_${s._id}" class="form-control">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half-Day">Half-Day</option>
                    </select>
                    <input type="text" class="form-control" id="attRem_${s._id}" placeholder="Remarks" style="font-size:12px;">
                </div>
            `).join('')}
        </div>
    `;
}

async function saveAttendance() {
    const cls = document.getElementById('attClass').value;
    const section = document.getElementById('attSection').value;
    const date = document.getElementById('attDate').value;

    if (!cls || !date) {
        showToast('Please select class and date', 'warning');
        return;
    }

    const students = await api(`/api/students?class=${cls}&section=${section}`);
    if (!students) return;

    const records = students.map(s => ({
        studentId: s._id,
        status: document.getElementById(`att_${s._id}`)?.value || 'Present',
        remarks: document.getElementById(`attRem_${s._id}`)?.value || ''
    }));

    const result = await api('/api/attendance/bulk', 'POST', { date, class: cls, section, records });
    if (result) {
        showToast(`Attendance saved for ${records.length} students!`);
        loadAttendanceRecords();
    }
}

async function loadAttendanceRecords() {
    const cls = document.getElementById('attClass')?.value || '';
    const dateEl = document.getElementById('attFilterDate');
    const date = dateEl?.value || '';

    let url = '/api/attendance?';
    if (cls) url += `class=${cls}&`;
    if (date) url += `date=${date}&`;

    const records = await api(url);
    if (!records) return;

    const tbody = document.getElementById('attendanceRecords');
    if (!tbody) return;

    tbody.innerHTML = records.length ? records.map(r => `
        <tr>
            <td><strong>${r.student?.name || 'N/A'}</strong></td>
            <td>${r.class}-${r.section}</td>
            <td>${new Date(r.date).toLocaleDateString('en-IN')}</td>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="text-center" style="padding:32px;color:var(--gray-400)">No attendance records found</td></tr>';
}

// ========== RESULTS ==========
async function loadResults() {
    const results = await api('/api/results');
    if (!results) return;

    document.getElementById('resultsTable').innerHTML = results.length ? results.map(r => `
        <tr>
            <td><strong>${r.student?.name || 'N/A'}</strong></td>
            <td>${r.class}-${r.section}</td>
            <td>${r.examType}</td>
            <td>${r.totalObtained}/${r.totalMarks}</td>
            <td><strong>${r.percentage}%</strong></td>
            <td><span class="badge ${r.result.toLowerCase()}">${r.result}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewResult('${r._id}')" title="View"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--gray-400)">No results found</td></tr>';
}

async function handleAddResult(e) {
    e.preventDefault();
    const studentId = document.getElementById('rStudent').value;
    if (!studentId) { showToast('Select a student', 'warning'); return; }

    // Get student info for class/section
    const student = await api(`/api/students/${studentId}`);

    const data = {
        student: studentId,
        class: student.class,
        section: student.section,
        examType: document.getElementById('rExam').value,
        academicYear: document.getElementById('rYear').value,
        subjects: [
            { subjectName: 'Mathematics', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('rMath').value) || 0 },
            { subjectName: 'Science', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('rScience').value) || 0 },
            { subjectName: 'English', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('rEnglish').value) || 0 },
            { subjectName: 'Hindi', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('rHindi').value) || 0 },
            { subjectName: 'Social Science', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('rSocial').value) || 0 }
        ]
    };

    const result = await api('/api/results', 'POST', data);
    if (result && result.result) {
        showToast('Result uploaded!');
        closeModal('addResultModal');
        document.getElementById('addResultForm').reset();
        loadResults();
    } else {
        showToast(result?.msg || 'Error uploading result', 'error');
    }
}

function viewResult(id) {
    showToast('View full result details', 'info');
}

// ========== ADMISSION ==========
async function handleAdmission(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('admName').value,
        admissionNumber: document.getElementById('admAdmNo').value.trim(),
        class: document.getElementById('admClass').value,
        section: document.getElementById('admSection').value,
        rollNumber: document.getElementById('admRoll').value,
        gender: document.getElementById('admGender').value,
        dateOfBirth: document.getElementById('admDob').value,
        bloodGroup: document.getElementById('admBlood').value,
        fatherName: document.getElementById('admFather').value,
        motherName: document.getElementById('admMother').value,
        phone: document.getElementById('admPhone').value,
        email: document.getElementById('admEmail').value,
        address: document.getElementById('admAddress').value
    };

    const result = await api('/api/students', 'POST', data);
    if (result && result.student) {
        showToast('Admission successful! Username & Password: ' + result.student.admissionNumber, 'success');
        document.getElementById('admissionForm').reset();
    } else {
        showToast(result?.msg || 'Admission failed', 'error');
    }
}

// ========== TEACHER DASHBOARD ==========
async function loadTeacherDashboard() {
    try {
        document.getElementById('teacherWelcomeName').textContent = currentUser?.name || 'Teacher';
        // Load teacher profile
        const me = await api('/api/auth/me');
        if (!me || !me.profileId) return;

        const teacher = await api(`/api/teachers/${me.profileId}`);
        if (!teacher) return;

        document.getElementById('tMyClasses').textContent = teacher.assignedClasses?.length || 0;
        document.getElementById('tSubject').textContent = teacher.subject || '-';

        // Populate class dropdown
        const classSelect = document.getElementById('tAttClass');
        classSelect.innerHTML = '<option value="">Select Class</option>' +
            (teacher.assignedClasses || []).map(c => `<option value="${c}">Class ${c}</option>`).join('');

        // Count students in assigned classes
        let totalStudents = 0;
        for (const cls of (teacher.assignedClasses || [])) {
            const students = await api(`/api/students?class=${cls}`);
            totalStudents += students?.length || 0;
        }
        document.getElementById('tMyStudents').textContent = totalStudents;

        // Load students for marks dropdown
        const allStudents = await api('/api/students');
        if (allStudents) {
            const marksSelect = document.getElementById('marksStudent');
            marksSelect.innerHTML = '<option value="">Select Student</option>' +
                allStudents.map(s => `<option value="${s._id}">${s.name} (${s.class}-${s.section})</option>`).join('');
        }
    } catch (err) {
        console.error('Teacher dashboard error:', err);
    }
}

async function loadTeacherAttendanceStudents() {
    const cls = document.getElementById('tAttClass').value;
    const section = document.getElementById('tAttSection').value;
    if (!cls) return;

    const students = await api(`/api/students?class=${cls}&section=${section}`);
    if (!students || !students.length) {
        document.getElementById('teacherAttendanceList').innerHTML = '<div class="empty-state"><h3>No students found</h3></div>';
        return;
    }

    document.getElementById('teacherAttendanceList').innerHTML = `
        <div class="attendance-grid">
            ${students.map(s => `
                <div class="attendance-row">
                    <div>
                        <div class="student-name">${s.name}</div>
                        <div class="roll-num">Roll: ${s.rollNumber}</div>
                    </div>
                    <div class="roll-num">${s.admissionNumber}</div>
                    <select id="tAtt_${s._id}">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                    <input type="text" class="form-control" id="tAttRem_${s._id}" placeholder="Remarks" style="font-size:12px;">
                </div>
            `).join('')}
        </div>
    `;
}

async function saveTeacherAttendance() {
    const cls = document.getElementById('tAttClass').value;
    const section = document.getElementById('tAttSection').value;
    const date = document.getElementById('tAttDate').value;

    if (!cls || !date) { showToast('Select class and date', 'warning'); return; }

    const students = await api(`/api/students?class=${cls}&section=${section}`);
    if (!students) return;

    const records = students.map(s => ({
        studentId: s._id,
        status: document.getElementById(`tAtt_${s._id}`)?.value || 'Present',
        remarks: document.getElementById(`tAttRem_${s._id}`)?.value || ''
    }));

    const result = await api('/api/attendance/bulk', 'POST', { date, class: cls, section, records });
    if (result) {
        showToast(`Attendance saved for ${records.length} students!`);
    }
}

async function handleUploadMarks(e) {
    e.preventDefault();
    const studentId = document.getElementById('marksStudent').value;
    if (!studentId) { showToast('Select a student', 'warning'); return; }

    const student = await api(`/api/students/${studentId}`);

    const data = {
        student: studentId,
        class: student.class,
        section: student.section,
        examType: document.getElementById('marksExam').value,
        academicYear: document.getElementById('marksYear').value,
        subjects: [
            { subjectName: 'Mathematics', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('marksMath').value) || 0 },
            { subjectName: 'Science', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('marksScience').value) || 0 },
            { subjectName: 'English', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('marksEnglish').value) || 0 },
            { subjectName: 'Hindi', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('marksHindi').value) || 0 },
            { subjectName: 'Social Science', maxMarks: 100, obtainedMarks: parseInt(document.getElementById('marksSocial').value) || 0 }
        ]
    };

    const result = await api('/api/results', 'POST', data);
    if (result && result.result) {
        showToast('Marks uploaded successfully!');
        document.getElementById('uploadMarksForm').reset();
    } else {
        showToast(result?.msg || 'Error uploading marks', 'error');
    }
}

async function loadTeacherStudents() {
    const students = await api('/api/students');
    if (!students) return;

    document.getElementById('teacherStudentsTable').innerHTML = students.map(s => `
        <tr>
            <td>${s.rollNumber}</td>
            <td><strong>${s.name}</strong></td>
            <td>Class ${s.class}</td>
            <td>${s.section}</td>
            <td>${s.phone}</td>
        </tr>
    `).join('');
}

// ========== UTILITIES ==========
function formatNum(num) {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
}

// ========== FORGOT PASSWORD ==========
function showForgotPassword(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
}


function showResetForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) return showToast('Please enter your email', 'warning');

    const btn = document.getElementById('forgotBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.classList.add('loading');

    try {
        const result = await api('/api/auth/forgot-password', 'POST', { email });
        if (result) {
            showToast(result.msg || 'Reset link sent! Check your email.', 'success');
            // For development: if token returned, show it
            if (result.resetToken) {
                console.log('Reset Token (dev):', result.resetToken);
            }
        }
    } catch (err) {
        showToast('Error sending reset link', 'error');
    }

    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
    btn.classList.remove('loading');
}

async function handleResetPassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword.length < 6) {
        return showToast('Password must be at least 6 characters', 'warning');
    }
    if (newPassword !== confirmPassword) {
        return showToast('Passwords do not match', 'error');
    }

    // Get token from URL hash
    const hash = window.location.hash;
    const tokenMatch = hash.match(/token=(.+)/);
    if (!tokenMatch) {
        return showToast('Invalid reset link', 'error');
    }

    const resetToken = tokenMatch[1];
    const btn = document.getElementById('resetBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    btn.classList.add('loading');

    try {
        const response = await fetch(`${API}/api/auth/reset-password/${resetToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
        });
        const result = await response.json();

        if (response.ok) {
            showToast(result.msg || 'Password reset successfully!', 'success');
            // Clear hash and go to login
            window.location.hash = '';
            setTimeout(() => showLoginForm(), 1500);
        } else {
            showToast(result.msg || 'Error resetting password', 'error');
        }
    } catch (err) {
        showToast('Error resetting password', 'error');
    }

    btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
    btn.classList.remove('loading');
}

// ========== HOMEWORK MANAGEMENT ==========
async function loadTeacherHomework() {
    try {
        const homework = await api('/api/homework');
        if (!homework || !Array.isArray(homework)) {
            document.getElementById('teacherHomeworkTable').innerHTML = '<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--gray-400)">No homework assigned yet</td></tr>';
            return;
        }

        document.getElementById('teacherHomeworkTable').innerHTML = homework.length ? homework.map(hw => {
            const dueDate = new Date(hw.dueDate);
            const isOverdue = dueDate < new Date();
            return `
            <tr>
                <td><strong>${hw.subject}</strong></td>
                <td>${hw.title}</td>
                <td>Class ${hw.class}-${hw.section}</td>
                <td>${new Date(hw.assignedDate).toLocaleDateString('en-IN')}</td>
                <td><span class="badge ${isOverdue ? 'overdue' : 'pending'}">${dueDate.toLocaleDateString('en-IN')}</span></td>
                <td>${hw.submissions?.length || 0} submitted</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteHomework('${hw._id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        }).join('') : '<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--gray-400)">No homework assigned yet</td></tr>';
    } catch (err) {
        console.error('Homework load error:', err);
        document.getElementById('teacherHomeworkTable').innerHTML = '<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--gray-400)">Error loading homework</td></tr>';
    }
}

async function handleCreateHomework(e) {
    e.preventDefault();
    const data = {
        subject: document.getElementById('hwSubject').value,
        title: document.getElementById('hwTitle').value,
        class: document.getElementById('hwClass').value,
        section: document.getElementById('hwSection').value,
        dueDate: document.getElementById('hwDueDate').value,
        description: document.getElementById('hwDescription').value
    };

    if (!data.subject || !data.title || !data.class || !data.dueDate || !data.description) {
        return showToast('Please fill all required fields', 'warning');
    }

    const result = await api('/api/homework', 'POST', data);
    if (result && !result.msg?.includes('error') && !result.msg?.includes('not found') && !result.msg?.includes('Not authorized')) {
        showToast('Homework created successfully!');
        closeModal('createHomeworkModal');
        document.getElementById('createHomeworkForm').reset();
        loadTeacherHomework();
    } else {
        showToast(result?.msg || 'Error creating homework', 'error');
    }
}

async function deleteHomework(id) {
    if (!confirm('Delete this homework?')) return;
    await api(`/api/homework/${id}`, 'DELETE');
    showToast('Homework deleted');
    loadTeacherHomework();
}



// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date for attendance inputs
    const today = new Date().toISOString().split('T')[0];
    const attDate = document.getElementById('attDate');
    const tAttDate = document.getElementById('tAttDate');
    if (attDate) attDate.value = today;
    if (tAttDate) tAttDate.value = today;

    // Check for reset-password token in URL hash
    const hash = window.location.hash;
    if (hash.includes('reset-password') && hash.includes('token=')) {
        showResetForm();
        return;
    }

    // Check if already logged in
    if (token && currentUser) {
        showDashboard(currentUser.role);
    }
});
