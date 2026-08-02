import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/formatCurrency';

const UpcomingRecurring = () => {
    const { apiCall } = useAuth();
    const { currency, convert } = useCurrency();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecurring = async () => {
            try {
                const res = await apiCall('/api/recurring');
                if (res && res.data) {
                    // Filter active and sort by next execution
                    const upcoming = res.data
                        .filter(t => t.is_active)
                        .sort((a, b) => new Date(a.next_execution) - new Date(b.next_execution))
                        .slice(0, 4);
                    setTransactions(upcoming);
                }
            } catch (error) {
                console.error("Failed to fetch recurring");
            } finally {
                setLoading(false);
            }
        };
        fetchRecurring();
    }, [apiCall]);

    if (loading) return <div className="card"><p>Loading upcoming bills...</p></div>;

    return (
        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <i className="fas fa-calendar-alt" style={{ color: 'var(--warning-color)' }}></i> Upcoming Bills
                </h3>
                <Link to="/recurring" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none' }}>Manage</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {transactions.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No upcoming recurring transactions.</p>
                ) : (
                    transactions.map((t) => {
                        const daysLeft = Math.ceil((new Date(t.next_execution) - new Date()) / (1000 * 60 * 60 * 24));
                        const isIncome = t.type === 'income';
                        
                        return (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className={t.category_icon} style={{ color: 'var(--text-secondary)' }}></i>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{t.description || t.category_name}</span>
                                        <span style={{ fontSize: '0.75rem', color: daysLeft <= 3 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                                            {daysLeft <= 0 ? 'Due Today' : `In ${daysLeft} days`}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ color: isIncome ? 'var(--success-color)' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    {isIncome ? '+' : '-'}{formatCurrency(convert(t.amount), currency)}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default UpcomingRecurring;
