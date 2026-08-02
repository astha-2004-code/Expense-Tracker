import { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';

const SavingsGoals = () => {
    const { apiCall, showToast } = useAuth();
    const { currency, convert } = useCurrency();
    
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        goal_name: '',
        target_amount: '',
        deadline: '',
        description: ''
    });

    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [addAmount, setAddAmount] = useState('');

    const fetchGoals = useCallback(async () => {
        try {
            const res = await apiCall('/api/goals');
            if (res && res.data) {
                setGoals(res.data);
            }
        } catch (e) { console.error(e); } finally {
            setLoading(false);
        }
    }, [apiCall]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await apiCall(`/api/goals/${formData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                showToast('Goal updated successfully');
            } else {
                await apiCall('/api/goals', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                showToast('Goal created successfully');
            }
            setIsModalOpen(false);
            setFormData({ id: '', goal_name: '', target_amount: '', deadline: '', description: '' });
            fetchGoals();
        } catch (error) {
            showToast('Failed to save goal', 'error');
        }
    };

    const handleEdit = (goal) => {
        setFormData({
            id: goal.id,
            goal_name: goal.goal_name,
            target_amount: goal.target_amount,
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
            description: goal.description || ''
        });
        setIsModalOpen(true);
    };

    const handleAddFunds = async (e) => {
        e.preventDefault();
        try {
            const newTotal = Number(selectedGoal.saved_amount) + Number(addAmount);
            await apiCall(`/api/goals/${selectedGoal.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ saved_amount: newTotal })
            });
            
            showToast('Funds added successfully');
            
            if (newTotal >= selectedGoal.target_amount && Number(selectedGoal.saved_amount) < selectedGoal.target_amount) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }
            
            setIsAddFundsOpen(false);
            setAddAmount('');
            setSelectedGoal(null);
            fetchGoals();
        } catch (error) {
            showToast('Failed to add funds', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this goal?')) return;
        try {
            await apiCall(`/api/goals/${id}`, { method: 'DELETE' });
            showToast('Goal deleted');
            fetchGoals();
        } catch (error) {
            showToast('Failed to delete goal', 'error');
        }
    };

    return (
        <div className="app-container">
            {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
            <Sidebar />
            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2>Savings Goals</h2>
                        <p>Track your financial targets and celebrate when you reach them.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setFormData({ id: '', goal_name: '', target_amount: '', deadline: '', description: '' }); setIsModalOpen(true); }}>
                        <i className="fas fa-plus"></i> New Goal
                    </button>
                </header>

                <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {loading ? <p>Loading goals...</p> : goals.length === 0 ? <p>No goals set yet. Start saving today!</p> : goals.map(goal => {
                        const progress = Math.min(100, Math.max(0, (goal.saved_amount / goal.target_amount) * 100));
                        const isCompleted = progress >= 100;
                        
                        return (
                            <div key={goal.id} className="card goal-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{goal.goal_name}</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="edit-btn" onClick={() => handleEdit(goal)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}>
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDelete(goal.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{goal.description}</p>
                                
                                <div className="progress-container" style={{ background: 'var(--bg-color)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
                                    <div className="progress-bar" style={{ width: `${progress}%`, background: isCompleted ? 'var(--success-color)' : 'var(--primary-color)', height: '100%', transition: 'width 0.5s ease' }}></div>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{progress.toFixed(1)}%</span>
                                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(convert(goal.saved_amount), currency)} / {formatCurrency(convert(goal.target_amount), currency)}</span>
                                </div>
                                
                                {goal.deadline && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <i className="fas fa-calendar"></i> Deadline: {new Date(goal.deadline).toLocaleDateString()}
                                    </div>
                                )}
                                
                                <button 
                                    className={`btn ${isCompleted ? 'btn-success' : 'btn-primary'}`} 
                                    style={{ width: '100%', marginTop: 'auto' }}
                                    onClick={() => { setSelectedGoal(goal); setIsAddFundsOpen(true); }}
                                    disabled={isCompleted}
                                >
                                    {isCompleted ? 'Goal Reached! 🎉' : 'Add Funds'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Create Goal Modal */}
            {isModalOpen && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{formData.id ? 'Edit Savings Goal' : 'Create Savings Goal'}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Goal Name</label>
                                <input type="text" className="form-control" value={formData.goal_name} onChange={e => setFormData({...formData, goal_name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Target Amount ({currency})</label>
                                <input type="number" step="0.01" className="form-control" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Deadline (Optional)</label>
                                <input type="date" className="form-control" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <input type="text" className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Goal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Funds Modal */}
            {isAddFundsOpen && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Add Funds to {selectedGoal?.goal_name}</h2>
                            <button className="close-btn" onClick={() => setIsAddFundsOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddFunds} className="modal-body">
                            <div className="form-group">
                                <label>Amount to Add ({currency})</label>
                                <input type="number" step="0.01" className="form-control" value={addAmount} onChange={e => setAddAmount(e.target.value)} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAddFundsOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Funds</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavingsGoals;
