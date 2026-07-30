import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage");
            }
        }
        setLoading(false);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`).catch(() => {});
    };

    const updateBudget = (budget) => {
        if (user) {
            const updatedUser = { ...user, monthly_budget: budget };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    const apiCall = async (endpoint, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...(options.headers || {})
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, { ...options, headers });
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401 && endpoint !== '/api/auth/login') {
                    logout(); // Auto logout on unauthorized
                }
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, apiCall, showToast, toast, updateBudget }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
