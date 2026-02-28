// ========================================
// School Management System - Frontend App
// ========================================

const API = '';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// ========== CAPTCHA ========== 

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
    const overlay = document.querySelector('#teacherDashboard .sidebar-overlay');
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function toggleStudentSidebar() {
    const sidebar = document.getElementById('studentSidebar');
    const overlay = document.querySelector('#studentDashboard .sidebar-overlay');
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function toggleAccountantSidebar() {
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
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('accountantSidebar');
        if (sidebar) sidebar.classList.remove('open');
    }
}

function showAdminSection(sectionId, element) {
    console.log('[Routing] showAdminSection called for:', sectionId);

    // Hide all section pages
    const sections = document.querySelectorAll('#adminDashboard .section-page');
    console.log('[Routing] Found', sections.length, 'section-pages in Admin Dashboard. Removing active class from all.');
    sections.forEach(el => el.classList.remove('active'));

    // Show target section page
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        console.log('[Routing] Target section found. Adding active class.');
        targetSection.classList.add('active');
    } else {
        console.error('[Routing] ERROR: Target section not found in DOM:', sectionId);
    }

    // Toggle sidebar items active state
    document.querySelectorAll('#sidebar .nav-item').forEach(el => el.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    if (sectionId === 'adminHome') { if (typeof loadAdminDashboard === 'function') loadAdminDashboard(); }
    else if (sectionId === 'adminStudents') loadStudents();
    else if (sectionId === 'adminTeachers') loadTeachers();
    else if (sectionId === 'adminFees') loadFees();
    else if (sectionId === 'adminAttendance') loadAttendanceRecords();
    else if (sectionId === 'adminResults') loadResults();
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('#adminDashboard .sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

function showTeacherSection(sectionId, element) {
    document.querySelectorAll('#teacherDashboard .section-page').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('#teacherSidebar .nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    if (sectionId === 'teacherHome') { if (typeof loadTeacherDashboard === 'function') loadTeacherDashboard(); }
    else if (sectionId === 'teacherAttendance') loadTeacherAttendanceStudents();
    else if (sectionId === 'teacherStudentList') loadTeacherStudents();
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('teacherSidebar');
        const overlay = document.querySelector('#teacherDashboard .sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
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
        const schoolName = document.getElementById('loginSchoolName').value.trim();
        if (!schoolName) {
            showLoginError('School name is required');
            resetLoginBtn();
            return;
        }
        data.schoolName = schoolName;
        data.email = document.getElementById('loginEmail').value.trim();
    } else {
        data.schoolName = document.getElementById('loginSchoolName').value.trim() || '';
        data.loginId = document.getElementById('loginId').value.trim();
    }

    try {
        const response = await api('/api/auth/login', 'POST', data);
        if (!response || response.msg) {
            showLoginError(response?.msg || 'Login failed');
            resetLoginBtn();
            return;
        }

        // Validate that the selected portal matches the user role
        if (role === 'staff') {
            // Staff portal is shared by teachers & accountants
            const isStaffRole = response.user.role === 'teacher' || response.user.role === 'accountant';
            if (!isStaffRole) {
                showLoginError('You are logging into the wrong portal. Please select the correct role.');
                resetLoginBtn();
                return;
            }
        } else if (response.user.role !== role) {
            showLoginError('You are logging into the wrong portal. Please select the correct role.');
            resetLoginBtn();
            return;
        }

        token = response.token;
        currentUser = response.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('schoolName', currentUser.schoolName || '');
        localStorage.setItem('schoolId', currentUser.schoolId || '');

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
    localStorage.removeItem('schoolName');
    localStorage.removeItem('schoolId');
    const landingPage = document.getElementById('landingPage');
    if (landingPage) landingPage.style.display = 'block';
    document.getElementById('loginPage').style.display = 'none';
    const adminDash = document.getElementById('adminDashboard');
    const teacherDash = document.getElementById('teacherDashboard');
    const studentDash = document.getElementById('studentDashboard');
    const accountantDash = document.getElementById('accountantDashboard');
    if (adminDash) adminDash.style.display = 'none';
    if (teacherDash) teacherDash.style.display = 'none';
    if (studentDash) studentDash.style.display = 'none';
    if (accountantDash) accountantDash.style.display = 'none';

    const loginError = document.getElementById('loginError');
    if (loginError) loginError.style.display = 'none';

    // Reset to main login section
    const loginFormSection = document.getElementById('loginSection');
    const forgotSection = document.getElementById('forgotPasswordSection');
    const resetSection = document.getElementById('resetPasswordSection');
    const registerSection = document.getElementById('registerSchoolSection');

    if (loginFormSection) {
        loginFormSection.style.display = 'block';
        const formEl = loginFormSection.tagName === 'FORM' ? loginFormSection : loginFormSection.querySelector('form');
        if (formEl && typeof formEl.reset === 'function') formEl.reset();
    }
    if (forgotSection) forgotSection.style.display = 'none';
    if (resetSection) resetSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';

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

    // Reset student sections
    document.querySelectorAll('#studentDashboard .section-page').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('#studentDashboard .nav-item').forEach(n => n.classList.remove('active'));
    const studentHome = document.getElementById('studentHome');
    if (studentHome) studentHome.classList.add('active');
    const studentNavFirst = document.querySelector('#studentDashboard .nav-item');
    if (studentNavFirst) studentNavFirst.classList.add('active');

    // Reset page titles
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = 'Dashboard';
    const pageSubtitle = document.getElementById('pageSubtitle');
    if (pageSubtitle) pageSubtitle.textContent = "Welcome back! Here's your overview.";
    const teacherPageTitle = document.getElementById('teacherPageTitle');
    if (teacherPageTitle) teacherPageTitle.textContent = 'Dashboard';
    const studentPageTitle = document.getElementById('studentPageTitle');
    if (studentPageTitle) studentPageTitle.textContent = 'Dashboard';
}

function showDashboard(role) {
    const landingPage = document.getElementById('landingPage');
    if (landingPage) landingPage.style.display = 'none';
    document.getElementById('loginPage').style.display = 'none';
    resetAllSections();

    const schoolNameStr = currentUser?.schoolName || localStorage.getItem('schoolName') || 'Vidya HMS';
    if (document.getElementById('sidebarSchoolName')) document.getElementById('sidebarSchoolName').textContent = schoolNameStr;
    if (document.getElementById('teacherSidebarSchoolName')) document.getElementById('teacherSidebarSchoolName').textContent = schoolNameStr;
    if (document.getElementById('studentSidebarSchoolName')) document.getElementById('studentSidebarSchoolName').textContent = schoolNameStr;
    if (document.getElementById('welcomeSchoolName')) document.getElementById('welcomeSchoolName').textContent = schoolNameStr;
    if (document.getElementById('accountantSidebarSchoolName')) document.getElementById('accountantSidebarSchoolName').textContent = schoolNameStr;

    if (role === 'admin') {
        document.getElementById('adminDashboard').style.display = 'flex';
        if (document.getElementById('adminName')) document.getElementById('adminName').textContent = currentUser.name;
        if (document.getElementById('adminAvatar')) document.getElementById('adminAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        if (typeof loadAdminDashboard === "function") loadAdminDashboard();
    } else if (role === 'teacher') {
        document.getElementById('teacherDashboard').style.display = 'flex';
        if (document.getElementById('teacherName')) document.getElementById('teacherName').textContent = currentUser.name;
        if (document.getElementById('teacherAvatar')) document.getElementById('teacherAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        const welcomeEl = document.getElementById('teacherWelcomeName');
        if (welcomeEl) welcomeEl.textContent = currentUser.name;
        if (typeof loadTeacherDashboard === "function") loadTeacherDashboard();
    } else if (role === 'accountant') {
        document.getElementById('accountantDashboard').style.display = 'flex';
        if (document.getElementById('accountantName')) document.getElementById('accountantName').textContent = currentUser.name;

        const welcomeEl = document.getElementById('accWelcomeName');
        if (welcomeEl) welcomeEl.textContent = currentUser.name;
        if (typeof loadAccountantDashboard === "function") loadAccountantDashboard();
    }
}

// ========== REGISTER SCHOOL & FORGOT PASSWORD TOGGLES ==========
function switchLoginPortal(portalType) {
    try {
        const cardAdmin = document.getElementById('cardAdmin');
        const cardStaff = document.getElementById('cardStaff');
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
        if (cardStaff) cardStaff.classList.remove('active');

        hiddenRole.value = portalType;

        if (portalType === 'admin') {
            if (cardAdmin) cardAdmin.classList.add('active');

            // Show Admin Login Fields
            if (loginSchoolWrapper) loginSchoolWrapper.style.display = 'block';
            if (loginEmailWrapper) loginEmailWrapper.style.display = 'block';
            if (loginIdWrapper) loginIdWrapper.style.display = 'none';
            if (document.getElementById('loginSchoolName')) document.getElementById('loginSchoolName').setAttribute('required', 'true');
            if (document.getElementById('loginEmail')) document.getElementById('loginEmail').setAttribute('required', 'true');
            if (document.getElementById('loginId')) document.getElementById('loginId').removeAttribute('required');

            // Show Admin Forgot Fields
            if (forgotSchoolWrapper) forgotSchoolWrapper.style.display = 'block';
            if (forgotEmailWrapper) forgotEmailWrapper.style.display = 'block';
            if (forgotIdWrapper) forgotIdWrapper.style.display = 'none';
            if (forgotDobWrapper) forgotDobWrapper.style.display = 'none';
            if (forgotNewPassWrapper) forgotNewPassWrapper.style.display = 'none';
            if (document.getElementById('forgotSchoolName')) document.getElementById('forgotSchoolName').setAttribute('required', 'true');
            if (document.getElementById('forgotEmail')) document.getElementById('forgotEmail').setAttribute('required', 'true');
            if (document.getElementById('forgotId')) document.getElementById('forgotId').removeAttribute('required');
            if (document.getElementById('forgotDob')) document.getElementById('forgotDob').removeAttribute('required');
            if (document.getElementById('forgotNewPass')) document.getElementById('forgotNewPass').removeAttribute('required');

            if (document.getElementById('forgotBtn')) document.getElementById('forgotBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
        } else {
            if (cardStaff) cardStaff.classList.add('active');

            // Show Staff Login Fields
            if (loginSchoolWrapper) loginSchoolWrapper.style.display = 'block';
            if (loginEmailWrapper) loginEmailWrapper.style.display = 'none';
            if (loginIdWrapper) loginIdWrapper.style.display = 'block';
            if (document.getElementById('loginSchoolName')) document.getElementById('loginSchoolName').setAttribute('required', 'true');
            if (document.getElementById('loginEmail')) document.getElementById('loginEmail').removeAttribute('required');
            if (document.getElementById('loginId')) document.getElementById('loginId').setAttribute('required', 'true');
            if (document.getElementById('loginId')) document.getElementById('loginId').placeholder = 'Employee ID';

            // Show Staff Forgot Fields
            if (forgotSchoolWrapper) forgotSchoolWrapper.style.display = 'none';
            if (forgotEmailWrapper) forgotEmailWrapper.style.display = 'none';
            if (forgotIdWrapper) forgotIdWrapper.style.display = 'block';
            if (forgotDobWrapper) forgotDobWrapper.style.display = 'block';
            if (forgotNewPassWrapper) forgotNewPassWrapper.style.display = 'block';
            if (document.getElementById('forgotSchoolName')) document.getElementById('forgotSchoolName').removeAttribute('required');
            if (document.getElementById('forgotEmail')) document.getElementById('forgotEmail').removeAttribute('required');
            if (document.getElementById('forgotId')) document.getElementById('forgotId').setAttribute('required', 'true');
            if (document.getElementById('forgotId')) document.getElementById('forgotId').placeholder = 'Employee ID';
            if (document.getElementById('forgotDob')) document.getElementById('forgotDob').setAttribute('required', 'true');
            if (document.getElementById('forgotNewPass')) document.getElementById('forgotNewPass').setAttribute('required', 'true');

            if (document.getElementById('forgotBtn')) document.getElementById('forgotBtn').innerHTML = '<i class="fas fa-key"></i> Reset Password Now';
        }
    } catch (err) {
        console.error('Error in switchLoginPortal:', err);
    }
}

// Simple helper to switch between auth forms on the login page
function showSection(section) {
    // Hide all auth sections (login / forgot / reset / register)
    document.querySelectorAll('.auth-section').forEach(el => {
        el.style.display = 'none';
    });

    const target = document.getElementById(section + 'Section');
    if (target) {
        target.style.display = 'block';
    }

    const err = document.getElementById('loginError');
    if (err) err.style.display = 'none';
}

function showLoginPanel() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    showSection('login');
}

function showLandingPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('landingPage').style.display = 'block';
}

function showRegisterSchool(e) {
    if (e) e.preventDefault();
    if (e) e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('registerSchoolForm').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
}

function showLoginForm(e) {
    if (e) e.preventDefault();
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
        const res = await fetch('/api/auth/register-school', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (!res.ok) {
            alert(result.msg || 'Registration failed');
        } else {
            alert('School registered! You can now login.');
            showSection('login');
        }
    } catch (err) {
        alert('Server error');
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fas fa-plus-circle"></i> Register School';
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const btn = document.getElementById('forgotBtn');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    const data = {
        email: document.getElementById('forgotEmail').value.trim(),
        schoolName: document.getElementById('forgotSchoolName').value.trim(),
        userId: document.getElementById('forgotId').value.trim()
    };

    try {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        alert('If this account exists, a reset link has been sent.');
        showSection('login');
    } catch (err) {
        alert('Server error');
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
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

// ========== STUDENT DASHBOARD ==========
async function loadStudentDashboard() {
    try {
        document.getElementById('studentWelcomeName').textContent = currentUser?.name || 'Student';
        const data = await api('/api/dashboard/student-stats');
        if (!data) return;

        document.getElementById('studentStats').innerHTML = `
            <div class="stat-card blue">
                <div class="stat-header"><div class="stat-icon"><i class="fas fa-user"></i></div></div>
                <div class="stat-value">${data.student?.class || '-'}</div>
                <div class="stat-label">Class / Section ${data.student?.section || ''}</div>
            </div>
            <div class="stat-card green">
                <div class="stat-header"><div class="stat-icon"><i class="fas fa-clipboard-check"></i></div></div>
                <div class="stat-value">${data.attendance?.percentage || 0}%</div>
                <div class="stat-label">Attendance (${data.attendance?.presentDays}/${data.attendance?.totalDays} days)</div>
            </div>
            <div class="stat-card amber">
                <div class="stat-header"><div class="stat-icon"><i class="fas fa-rupee-sign"></i></div></div>
                <div class="stat-value">₹${formatNum(data.fees?.pendingAmount || 0)}</div>
                <div class="stat-label">Fees Pending</div>
            </div>
            <div class="stat-card rose">
                <div class="stat-header"><div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div></div>
                <div class="stat-value">${data.fees?.pendingCount || 0}</div>
                <div class="stat-label">Pending Invoices</div>
            </div>
        `;

        // Recent results
        if (data.recentResults && data.recentResults.length > 0) {
            document.getElementById('studentRecentResults').innerHTML = data.recentResults.map(r => `
                <tr>
                    <td>${r.examType}</td>
                    <td>${r.totalMarks}</td>
                    <td>${r.totalObtained}</td>
                    <td><strong>${r.percentage}%</strong></td>
                    <td><span class="badge ${r.result.toLowerCase()}">${r.result}</span></td>
                </tr>
            `).join('');
        } else {
            document.getElementById('studentRecentResults').innerHTML = '<tr><td colspan="5" class="text-center" style="padding:24px;color:var(--gray-400)">No results available</td></tr>';
        }
    } catch (err) {
        console.error('Student dashboard error:', err);
    }
}

async function loadStudentAttendance() {
    const records = await api('/api/attendance');
    if (!records) return;

    // Summary
    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const pct = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    document.getElementById('attendanceSummary').innerHTML = `
        <div class="stat-card green">
            <div class="stat-header"><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-value">${present}</div>
            <div class="stat-label">Present Days</div>
        </div>
        <div class="stat-card rose">
            <div class="stat-header"><div class="stat-icon"><i class="fas fa-times-circle"></i></div></div>
            <div class="stat-value">${absent}</div>
            <div class="stat-label">Absent Days</div>
        </div>
        <div class="stat-card blue">
            <div class="stat-header"><div class="stat-icon"><i class="fas fa-percentage"></i></div></div>
            <div class="stat-value">${pct}%</div>
            <div class="stat-label">Overall Attendance</div>
        </div>
    `;

    document.getElementById('studentAttendanceTable').innerHTML = records.map(r => `
        <tr>
            <td>${new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
            <td>${r.remarks || '-'}</td>
        </tr>
    `).join('');
}

async function loadStudentFees() {
    const fees = await api('/api/fees');
    if (!fees) return;

    document.getElementById('studentFeesTable').innerHTML = fees.map(f => `
        <tr>
            <td>${f.month} ${f.year}</td>
            <td>${f.feeType}</td>
            <td>₹${f.amount}</td>
            <td><span class="badge ${f.status.toLowerCase()}">${f.status}</span></td>
            <td>${f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-IN') : '-'}</td>
            <td>
                ${f.status === 'Paid' ? `<button class="btn btn-sm btn-outline" onclick="downloadReceipt('${f._id}')"><i class="fas fa-download"></i> PDF</button>` : '-'}
            </td>
        </tr>
    `).join('');
}

async function loadStudentResults() {
    const results = await api('/api/results');
    if (!results || !results.length) {
        document.getElementById('studentResultsDetail').innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><h3>No results available yet</h3></div>';
        return;
    }

    document.getElementById('studentResultsDetail').innerHTML = results.map(r => `
        <div class="card mb-2" style="border:1px solid var(--gray-200);">
            <div class="card-header">
                <h2 style="font-size:15px;">${r.examType} — ${r.academicYear}</h2>
                <span class="badge ${r.result.toLowerCase()}">${r.result} (${r.percentage}%)</span>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Grade</th></tr></thead>
                        <tbody>
                            ${r.subjects.map(s => `
                                <tr>
                                    <td>${s.subjectName}</td>
                                    <td>${s.maxMarks}</td>
                                    <td><strong>${s.obtainedMarks}</strong></td>
                                    <td><span class="badge ${s.grade === 'F' ? 'fail' : 'pass'}">${s.grade}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="mt-2" style="text-align:right; color:var(--gray-600); font-size:14px;">
                    <strong>Total: ${r.totalObtained}/${r.totalMarks} | Percentage: ${r.percentage}%</strong>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== UTILITIES ==========
function formatNum(num) {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
}

function showResetForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'block';
    document.getElementById('loginError').style.display = 'none';
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

// ========== STUDENT HOMEWORK ==========
// Store homework data globally for submit reference
let _homeworkCache = [];

async function loadStudentHomework() {
    const container = document.getElementById('homeworkList');
    try {
        const homework = await api('/api/homework');

        if (!homework || !Array.isArray(homework) || homework.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><h3>No homework assigned</h3><p style="color:var(--gray-400)">Your teachers haven\'t assigned any homework yet.</p></div>';
            return;
        }

        _homeworkCache = homework;

        // Get student profile to check submissions
        let studentId = null;
        if (currentUser && currentUser.profileId) {
            studentId = currentUser.profileId;
        }

        container.innerHTML = homework.map((hw, index) => {
            const dueDate = new Date(hw.dueDate);
            const isOverdue = dueDate < new Date();
            let submission = null;

            if (studentId && hw.submissions && hw.submissions.length > 0) {
                submission = hw.submissions.find(s => {
                    const sId = s.student?._id || s.student;
                    return sId === studentId || String(sId) === String(studentId);
                });
            }

            let statusBadge, statusClass;
            if (submission) {
                statusBadge = submission.status === 'Late' ? 'Late Submitted' : 'Submitted';
                statusClass = submission.status === 'Late' ? 'overdue' : 'paid';
            } else if (isOverdue) {
                statusBadge = 'Overdue';
                statusClass = 'overdue';
            } else {
                statusBadge = 'Pending';
                statusClass = 'pending';
            }

            return `
                <div class="homework-card">
                    <div class="hw-subject">${hw.subject || 'Subject'}</div>
                    <div class="hw-title" style="font-weight:600;margin:4px 0;color:var(--gray-800);">${hw.title || ''}</div>
                    <div class="hw-description">${hw.description || ''}</div>
                    <div class="hw-meta">
                        <span><i class="fas fa-calendar-alt"></i> Due: ${dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span><i class="fas fa-user"></i> ${hw.teacherName || 'Teacher'}</span>
                        <span class="badge ${statusClass}" style="font-size:11px;">${statusBadge}</span>
                    </div>
                    ${!submission ? `<div style="margin-top:12px;"><button class="btn btn-sm btn-primary" onclick="openSubmitHomework(${index})"><i class="fas fa-paper-plane"></i> Submit</button></div>` : ''}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Student homework error:', err);
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><h3>No homework available</h3><p style="color:var(--gray-400)">Check back later for assignments.</p></div>';
    }
}

function openSubmitHomework(index) {
    const hw = _homeworkCache[index];
    if (!hw) return;
    document.getElementById('submitHwId').value = hw._id;
    document.getElementById('submitHwTitle').textContent = hw.title;
    document.getElementById('hwAnswer').value = '';
    openModal('submitHomeworkModal');
}

async function handleSubmitHomework(e) {
    e.preventDefault();
    const hwId = document.getElementById('submitHwId').value;
    const answer = document.getElementById('hwAnswer').value;

    const result = await api(`/api/homework/${hwId}/submit`, 'POST', { answer });
    if (result && result.msg && !result.msg.includes('error') && !result.msg.includes('Error')) {
        showToast(result.msg || 'Homework submitted!');
        closeModal('submitHomeworkModal');
        loadStudentHomework();
    } else {
        showToast(result?.msg || 'Error submitting homework', 'error');
    }
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
