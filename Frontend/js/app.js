import { api } from './api.js';

let currentUser = null;
let currentAiQuestion = '';

// --- UI Utils ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
}

function toggleNavbar(show) {
    const nav = document.getElementById('navbar');
    nav.style.display = show ? 'flex' : 'none';
    if (show && currentUser) {
        document.getElementById('user-greeting').textContent = `Hello, ${currentUser.name}`;
        
        document.getElementById('nav-my-complaints').style.display = currentUser.role === 'user' ? 'block' : 'none';
        document.getElementById('nav-admin-dashboard').style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }
}

// --- Auth State ---
async function checkSession() {
    try {
        const user = await api.auth.me();
        currentUser = user;
        toggleNavbar(true);
        if (user.role === 'admin') {
            loadAdminDashboard();
        } else {
            loadMyComplaints();
        }
    } catch (error) {
        currentUser = null;
        toggleNavbar(false);
        showView('view-auth');
    }
}

// --- Init & Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
            document.getElementById(e.target.dataset.target).style.display = 'block';
            
            // reset register flow
            document.getElementById('step-send-otp').style.display = 'block';
            document.getElementById('step-verify-otp').style.display = 'none';
        });
    });

    // Login Form
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('btn-login-submit');
        
        try {
            btn.disabled = true;
            await api.auth.login(email, password);
            showToast('Logged in successfully');
            checkSession();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });

    // Send OTP
    document.getElementById('step-send-otp').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const btn = document.getElementById('btn-send-otp');
        
        try {
            btn.disabled = true;
            await api.auth.sendOtp(name, email);
            showToast('OTP sent to your email');
            document.getElementById('step-send-otp').style.display = 'none';
            document.getElementById('step-verify-otp').style.display = 'block';
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });

    // Complete Registration
    document.getElementById('step-verify-otp').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value; // from step 1
        const otp = document.getElementById('reg-otp').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm-password').value;
        const btn = document.getElementById('btn-register');
        
        if (password !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            btn.disabled = true;
            await api.auth.register(email, otp, password);
            showToast('Registration successful. You can now login.');
            
            // Switch to login tab
            document.querySelector('.tab[data-target="form-login"]').click();
            document.getElementById('login-email').value = email;
            
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        try {
            await api.auth.logout();
            showToast('Logged out');
            checkSession();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // Navigation
    document.getElementById('nav-my-complaints').addEventListener('click', loadMyComplaints);
    document.getElementById('nav-admin-dashboard').addEventListener('click', loadAdminDashboard);
    document.getElementById('btn-new-complaint').addEventListener('click', () => {
        document.getElementById('form-complaint').reset();
        document.getElementById('ai-section').style.display = 'none';
        currentAiQuestion = '';
        showView('view-submit-complaint');
    });
    document.getElementById('btn-back-to-my-complaints').addEventListener('click', loadMyComplaints);

    // AI Follow-up
    document.getElementById('btn-get-ai-question').addEventListener('click', async () => {
        const text = document.getElementById('complaint-text').value;
        if (!text) {
            showToast('Please describe your issue first', 'error');
            return;
        }
        
        const btn = document.getElementById('btn-get-ai-question');
        try {
            btn.disabled = true;
            btn.textContent = 'Analyzing...';
            const res = await api.complaints.getAiQuestion(text);
            
            currentAiQuestion = res.question;
            document.getElementById('ai-question-text').textContent = res.question;
            document.getElementById('ai-section').style.display = 'block';
            btn.style.display = 'none';
            
        } catch (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Get Follow-up Question';
        }
    });

    // Final Submit
    document.getElementById('form-complaint').addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('complaint-text').value;
        const answer = document.getElementById('user-answer').value;
        const btn = document.getElementById('btn-submit-final');
        
        if (!text || !currentAiQuestion || !answer) return;

        try {
            btn.disabled = true;
            await api.complaints.submit(text, currentAiQuestion, answer);
            showToast('Complaint submitted successfully');
            loadMyComplaints();
            // Reset state
            document.getElementById('btn-get-ai-question').style.display = 'block';
            document.getElementById('btn-get-ai-question').disabled = false;
            document.getElementById('btn-get-ai-question').textContent = 'Get Follow-up Question';
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });
});

// --- Views Loading ---
async function loadMyComplaints() {
    showView('view-my-complaints');
    const container = document.getElementById('my-complaints-list');
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const complaints = await api.complaints.getMy();
        if (complaints.length === 0) {
            container.innerHTML = '<p class="subtitle">You have no complaints yet.</p>';
            return;
        }
        
        container.innerHTML = complaints.map(c => `
            <div class="complaint-card fade-in">
                <div class="date">${new Date(c.created_at).toLocaleString()}</div>
                <div class="text"><strong>Complaint:</strong><br>${c.complaint_text}</div>
                <div class="ai-qa">
                    <strong>AI:</strong> ${c.ai_question}<br>
                    <strong>You:</strong> ${c.user_answer}
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
    }
}

async function loadAdminDashboard() {
    showView('view-admin-dashboard');
    const container = document.getElementById('all-complaints-list');
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const complaints = await api.complaints.getAll();
        if (complaints.length === 0) {
            container.innerHTML = '<p class="subtitle">No complaints found in the system.</p>';
            return;
        }
        
        container.innerHTML = complaints.map(c => `
            <div class="complaint-card fade-in">
                <div class="header-action" style="margin-bottom:0.5rem">
                    <span class="author"><strong>User:</strong> ${c.user_name} (${c.user_email})</span>
                    <span class="date">${new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div class="text"><strong>Complaint:</strong><br>${c.complaint_text}</div>
                <div class="ai-qa">
                    <strong>AI Question:</strong> ${c.ai_question}<br>
                    <strong>User Answer:</strong> ${c.user_answer}
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
    }
}
