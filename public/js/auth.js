let isLoginMode = true;

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/dashboard';
    }
});

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const nameGroup = document.getElementById('name-group');
    const nameInput = document.getElementById('name');
    const authBtn = document.getElementById('auth-btn');
    const toggleText = document.getElementById('toggle-text');
    
    if (isLoginMode) {
        title.textContent = 'Welcome Back';
        nameGroup.style.display = 'none';
        nameInput.removeAttribute('required');
        authBtn.textContent = 'Login';
        toggleText.innerHTML = `Don't have an account? <span onclick="toggleAuthMode()">Sign up</span>`;
    } else {
        title.textContent = 'Create Account';
        nameGroup.style.display = 'block';
        nameInput.setAttribute('required', 'true');
        authBtn.textContent = 'Sign Up';
        toggleText.innerHTML = `Already have an account? <span onclick="toggleAuthMode()">Login</span>`;
    }
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const payload = { email, password };
    let endpoint = '/api/auth/login';
    
    if (!isLoginMode) {
        payload.name = document.getElementById('name').value;
        endpoint = '/api/auth/register';
    }
    
    try {
        const data = await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (data && data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast('Authentication successful!');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        }
    } catch (error) {
        // Error is handled in common.js
    }
});
