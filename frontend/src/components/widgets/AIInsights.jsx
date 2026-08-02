import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AIInsights = () => {
    const { apiCall } = useAuth();
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await apiCall('/api/insights');
                if (res && res.data) {
                    setInsights(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch AI insights");
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [apiCall]);

    if (loading) return <div className="card"><p>Analyzing your spending...</p></div>;

    const getIcon = (type) => {
        switch(type) {
            case 'warning': return 'fa-exclamation-triangle';
            case 'success': return 'fa-check-circle';
            case 'prediction': return 'fa-chart-line';
            case 'recommendation': return 'fa-lightbulb';
            default: return 'fa-info-circle';
        }
    };

    const getColor = (type) => {
        switch(type) {
            case 'warning': return 'var(--danger-color)';
            case 'success': return 'var(--success-color)';
            case 'prediction': return 'var(--primary-color)';
            case 'recommendation': return 'var(--warning-color)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <i className="fas fa-brain" style={{ color: 'var(--primary-color)' }}></i> AI Spending Insights
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {insights.map((insight, index) => (
                    <div key={index} style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        alignItems: 'flex-start',
                        padding: '12px',
                        background: 'var(--bg-color)',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${getColor(insight.type)}`
                    }}>
                        <i className={`fas ${getIcon(insight.type)}`} style={{ color: getColor(insight.type), marginTop: '3px' }}></i>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>{insight.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIInsights;
