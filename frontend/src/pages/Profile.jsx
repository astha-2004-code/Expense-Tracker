import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, apiCall, showToast, updateBudget } = useAuth();
    
    const [profile, setProfile] = useState({ name: 'Loading...', email: 'Loading...', monthly_budget: 0 });
    const [budgetInput, setBudgetInput] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const fetchProfile = useCallback(async () => {
        try {
            const res = await apiCall('/api/auth/profile');
            if (res && res.data) {
                setProfile(res.data);
                setBudgetInput(res.data.monthly_budget);
                updateBudget(res.data.monthly_budget); // sync context
            }
        } catch (e) { console.error(e); }
    }, [apiCall, updateBudget]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleBudgetSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall('/api/auth/budget', {
                method: 'PUT',
                body: JSON.stringify({ budget: budgetInput })
            });
            showToast('Monthly budget updated successfully');
            fetchProfile();
        } catch (e) { console.error(e); }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall('/api/auth/password', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            showToast('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
        } catch (e) { console.error(e); }
    };

    const toggleTheme = () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2>My Profile</h2>
                        <p>Manage your account settings and preferences.</p>
                    </div>
                    <div className="user-info">
                        <div className="theme-toggle" onClick={toggleTheme}>
                            <i className="fas fa-moon" id="theme-icon"></i>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    
                    <div className="card" style={{ flexDirection: 'column', alignItems: 'flex-start', borderLeft: '5px solid var(--primary-color)' }}>
                        <h3 style={{ marginBottom: '20px' }}>Account Details</h3>
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Name</strong>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{profile.name}</p>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Email</strong>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{profile.email}</p>
                        </div>
                    </div>

                    <div className="card" style={{ flexDirection: 'column', alignItems: 'flex-start', borderLeft: '5px solid var(--warning-color)' }}>
                        <h3 style={{ marginBottom: '20px' }}>Monthly Budget</h3>
                        <form onSubmit={handleBudgetSubmit} style={{ width: '100%' }}>
                            <div className="form-group">
                                <label>Set Monthly Expense Budget ($)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    step="0.01" 
                                    min="0"
                                    value={budgetInput}
                                    onChange={e => setBudgetInput(e.target.value)}
                                />
                                <small style={{ color: 'var(--text-secondary)', marginTop: '5px', display: 'block' }}>
                                    We'll warn you if your monthly expenses exceed this amount.
                                </small>
                            </div>
                            <button type="submit" className="btn btn-primary">Update Budget</button>
                        </form>
                    </div>

                    <div className="card" style={{ flexDirection: 'column', alignItems: 'flex-start', borderLeft: '5px solid var(--danger-color)' }}>
                        <h3 style={{ marginBottom: '20px' }}>Change Password</h3>
                        <form onSubmit={handlePasswordSubmit} style={{ width: '100%' }}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    required 
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Change Password</button>
                        </form>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Profile;
