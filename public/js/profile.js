document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/';
        return;
    }

    loadProfile();
});

async function loadProfile() {
    try {
        const res = await apiCall('/api/auth/profile');
        if (res && res.data) {
            document.getElementById('profile-name').textContent = res.data.name;
            document.getElementById('profile-email').textContent = res.data.email;
            document.getElementById('budget-amount').value = res.data.monthly_budget;
            
            // Update local storage user just in case
            const user = JSON.parse(localStorage.getItem('user'));
            user.monthly_budget = res.data.monthly_budget;
            localStorage.setItem('user', JSON.stringify(user));
        }
    } catch (e) {
        console.error(e);
    }
}

document.getElementById('budget-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const budget = document.getElementById('budget-amount').value;
    
    try {
        await apiCall('/api/auth/budget', {
            method: 'PUT',
            body: JSON.stringify({ budget })
        });
        showToast('Monthly budget updated successfully');
        loadProfile(); // refresh data
    } catch (e) {
        console.error(e);
    }
});

document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    try {
        await apiCall('/api/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        showToast('Password changed successfully');
        document.getElementById('password-form').reset();
    } catch (e) {
        console.error(e);
    }
});
