import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, apiCall, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const payload = { email, password };
        const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
        
        if (!isLoginMode) {
            payload.name = name;
        }

        try {
            const data = await apiCall(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (data && data.success) {
                login(data.user, data.token);
                navigate('/dashboard');
            }
        } catch (error) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="logo">
                    <i className="fas fa-wallet"></i>
                </div>
                <h2>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
                
                <form onSubmit={handleSubmit}>
                    {!isLoginMode && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input 
                                type="text" 
                                id="name" 
                                className="form-control" 
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLoginMode}
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input 
                            type="email" 
                            id="email" 
                            className="form-control" 
                            placeholder="Enter your email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            className="form-control" 
                            placeholder="Enter your password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px' }} disabled={loading}>
                        {loading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
                    </button>
                </form>
                
                <div className="toggle-form">
                    <p>
                        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                        <span onClick={() => setIsLoginMode(!isLoginMode)}>
                            {isLoginMode ? 'Sign up' : 'Login'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
