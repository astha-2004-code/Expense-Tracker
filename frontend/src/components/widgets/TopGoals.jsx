import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/formatCurrency';

const TopGoals = () => {
    const { apiCall } = useAuth();
    const { currency, convert } = useCurrency();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const res = await apiCall('/api/goals');
                if (res && res.data) {
                    setGoals(res.data.slice(0, 3)); // Only show top 3
                }
            } catch (error) {
                console.error("Failed to fetch goals");
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, [apiCall]);

    if (loading) return <div className="card"><p>Loading goals...</p></div>;

    return (
        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <i className="fas fa-bullseye" style={{ color: 'var(--success-color)' }}></i> Savings Goals
                </h3>
                <Link to="/goals" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none' }}>View All</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {goals.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No active goals. <Link to="/goals">Create one!</Link></p>
                ) : (
                    goals.map((goal) => {
                        const progress = Math.min(100, Math.max(0, (goal.saved_amount / goal.target_amount) * 100));
                        return (
                            <div key={goal.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span>{goal.goal_name}</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <div className="progress-container" style={{ background: 'var(--bg-color)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                    <div className="progress-bar" style={{ width: `${progress}%`, background: 'var(--success-color)', height: '100%' }}></div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                    {formatCurrency(convert(goal.saved_amount), currency)} / {formatCurrency(convert(goal.target_amount), currency)}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default TopGoals;
