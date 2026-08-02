import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AIInsights = () => {
    const { apiCall } = useAuth();
    const [insights, setInsights] = useState(null);
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
    
    if (!insights) return null;

    const getRiskColor = (level) => {
        switch(level?.toLowerCase()) {
            case 'high': return 'var(--danger-color)';
            case 'medium': return 'var(--warning-color)';
            case 'low': return 'var(--success-color)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <i className="fas fa-brain" style={{ color: 'var(--primary-color)' }}></i> AI Spending Insights
            </h3>
            
            {insights.error && (
                <div style={{ padding: '12px', marginBottom: '15px', background: 'rgba(231, 76, 60, 0.1)', borderLeft: '4px solid var(--danger-color)', borderRadius: '4px' }}>
                    <strong><i className="fas fa-exclamation-circle" style={{ color: 'var(--danger-color)' }}></i> Warning:</strong> {insights.error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}><i className="fas fa-chart-pie"></i> Summary</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{insights.summary}</p>
                </div>
                
                <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--warning-color)' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}><i className="fas fa-exclamation-triangle"></i> Overspending</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{insights.overspending}</p>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--success-color)' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}><i className="fas fa-lightbulb"></i> Recommendations</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem' }}>
                        {(insights.tips || []).map((tip, idx) => (
                            <li key={idx} style={{ marginBottom: '5px' }}>{tip}</li>
                        ))}
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1, padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}><i className="fas fa-chart-line"></i> Next Month</h4>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>{insights.prediction}</p>
                    </div>
                    <div style={{ flex: 1, padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', borderLeft: `4px solid ${getRiskColor(insights.riskLevel)}` }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}><i className="fas fa-shield-alt"></i> Risk Level</h4>
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: getRiskColor(insights.riskLevel) }}>{insights.riskLevel}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
