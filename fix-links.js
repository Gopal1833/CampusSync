const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// The prompt asked to add `auth-section` class to these forms or just use showSection logic?
// The prompt:
// - Login form:           id="loginSection"
// - Forgot password form: id="forgotPasswordSection"  
// - Reset password form:  id="resetPasswordSection"
// - Register school form: id="registerSchoolSection"

// Rename form IDs
html = html.replace('id="loginForm"', 'id="loginSection" class="login-form auth-section"');
html = html.replace('id="forgotPasswordForm"', 'id="forgotPasswordSection" class="login-form auth-section"');
html = html.replace('id="resetPasswordForm"', 'id="resetPasswordSection" class="login-form auth-section"');
html = html.replace('id="registerSchoolForm"', 'id="registerSchoolSection" class="login-form auth-section"');

// Fix Links
html = html.replace(/onclick="showForgotPassword\([^)]*\)"/g, 'onclick="showSection(\'forgotPassword\')"');
html = html.replace(/onclick="showRegisterSchool\([^)]*\)"/g, 'onclick="showSection(\'registerSchool\')"');
html = html.replace(/onclick="showLoginForm\([^)]*\)"/g, 'onclick="showSection(\'login\')"');

// Add auth-section to loginSection if it wasn't caught
if (!html.includes('auth-section')) {
    html = html.replace('class="login-form"', 'class="login-form auth-section"');
}

// Ensure the broken staff panel message is fixed
html = html.replace(/<strong>Welcome to the Staff Panel!<\/strong><br>\r?\n\s*?\s*ï¿½?\s*â?\s*.*Use <strong>Mark Attendance/g,
    '<strong>Welcome to the Staff Panel! 👋</strong><br>\n                                • Use <strong>Mark Attendance');

// Even simpler replace for the staff panel text
html = html.replace(/<strong>Welcome to the Staff Panel!<\/strong><br>/g, "<strong>Welcome to the Staff Panel!</strong> 👋<br>");
html = html.replace(/👋 👋/g, '👋'); // dedup

fs.writeFileSync('public/index.html', html, 'utf8');

// Now in app.js
let js = fs.readFileSync('public/js/app.js', 'utf8');
if (!js.includes('function showSection(section')) {
    js += `
function showSection(section) {
  // Hide all form sections
  document.querySelectorAll('.auth-section')
    .forEach(el => el.style.display = 'none');
  
  // Show requested section
  document.getElementById(section + 'Section')
    .style.display = 'block';
}
`;
}

// Update the functions for forgot pass and register to API targets
// In app.js, find handleRegisterSchool and modify it
js = js.replace(/async function handleRegisterSchool[\s\S]*?catch \(err\) {[\s\S]*?}/,
    `async function handleRegisterSchool(e) {
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
}`);

// handleForgotPassword
js = js.replace(/async function handleForgotPassword[\s\S]*?catch \(err\) {[\s\S]*?}/,
    `async function handleForgotPassword(e) {
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
}`);

// Ensure handleLogin points to 'loginSection' instead of 'loginForm' (which app.js probably does internally if it did).
// Actually app.js doesn't seem to reference "loginForm" ID.
fs.writeFileSync('public/js/app.js', js, 'utf8');

console.log("Links and forms fixed.");
