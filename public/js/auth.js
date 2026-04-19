/* === Auth State Management === */

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function isLoggedIn() { return !!getToken() && !!getCurrentUser(); }

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    window.location.href = '/login.html';
}

function updateNavAuth() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('nav-login-btn');
    const userMenu = document.getElementById('nav-user-menu');
    const userName = document.getElementById('nav-user-name');

    if (user && loginBtn) {
        loginBtn.style.display = 'none';
        if (userMenu) { userMenu.style.display = 'flex'; }
        if (userName) { userName.textContent = user.name.split(' ')[0]; }
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }

    // Show admin link if admin
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) {
        adminLink.style.display = (user && user.role === 'admin') ? 'block' : 'none';
    }
}

function requireAuth(redirectTo = '/login.html') {
    if (!isLoggedIn()) {
        showToast('Please login to continue', 'info');
        setTimeout(() => { window.location.href = redirectTo; }, 1200);
        return false;
    }
    return true;
}

function requireAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        showToast('Admin access required', 'error');
        setTimeout(() => { window.location.href = '/'; }, 1500);
        return false;
    }
    return true;
}

/* === Login / Register Functions === */
async function loginUser(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
}

async function registerUser(name, email, password, phone) {
    const data = await api.post('/auth/register', { name, email, password, phone });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
}

// Initialize auth on every page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navbar-nav');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    // Scroll effect on navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        });
    }
});
