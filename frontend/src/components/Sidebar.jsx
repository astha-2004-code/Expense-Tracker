import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <aside className="sidebar">
            <div className="brand">
                <i className="fas fa-wallet"></i>
                <span>Expenze</span>
            </div>
            <ul className="nav-links">
                <li>
                    <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                        <i className="fas fa-home"></i> Dashboard
                    </Link>
                </li>
                <li>
                    <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
                        <i className="fas fa-user"></i> Profile
                    </Link>
                </li>
            </ul>
            <div className="logout-btn" onClick={logout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </div>
        </aside>
    );
};

export default Sidebar;
