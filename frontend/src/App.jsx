import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SavingsGoals from './pages/SavingsGoals';
import RecurringTransactions from './pages/RecurringTransactions';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children;
};

const Toast = () => {
    const { toast } = useAuth();
    if (!toast.show) return null;
    
    let icon = 'fa-check-circle';
    if (toast.type === 'error') icon = 'fa-exclamation-circle';
    if (toast.type === 'warning') icon = 'fa-exclamation-triangle';

    return (
        <div className="toast-container" style={{ zIndex: 9999 }}>
            <div className={`toast ${toast.type}`} style={{ transform: 'translateX(0)', opacity: 1, animation: 'none' }}>
                <i className={`fas ${icon}`}></i> <span>{toast.message}</span>
            </div>
        </div>
    );
};

function AppRoutes() {
    return (
        <>
            <Toast />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
                <Route path="/goals" element={
                    <ProtectedRoute>
                        <SavingsGoals />
                    </ProtectedRoute>
                } />
                <Route path="/recurring" element={
                    <ProtectedRoute>
                        <RecurringTransactions />
                    </ProtectedRoute>
                } />
            </Routes>
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <CurrencyProvider>
                    <AppRoutes />
                </CurrencyProvider>
            </Router>
        </AuthProvider>
    );
}

export default App;
