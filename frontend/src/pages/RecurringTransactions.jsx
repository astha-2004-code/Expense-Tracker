import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/formatCurrency';

const RecurringTransactions = () => {
    const { apiCall, showToast } = useAuth();
    const { currency, convert } = useCurrency();
    
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        category_id: '',
        type: 'expense',
        amount: '',
        description: '',
        frequency: 'monthly',
        next_execution: ''
    });

    const fetchCategories = useCallback(async () => {
        try {
            const res = await apiCall('/api/categories');
            if (res && res.data) {
                setCategories(res.data);
                // default category
                if (res.data.length > 0) {
                    setFormData(prev => ({...prev, category_id: res.data.find(c => c.type === 'expense').id }));
                }
            }
        } catch (e) { console.error(e); }
    }, [apiCall]);

    const fetchRecurring = useCallback(async () => {
        try {
            const res = await apiCall('/api/recurring');
            if (res && res.data) {
                setTransactions(res.data);
            }
        } catch (e) { console.error(e); } finally {
            setLoading(false);
        }
    }, [apiCall]);

    useEffect(() => {
        fetchCategories();
        fetchRecurring();
    }, [fetchCategories, fetchRecurring]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await apiCall(`/api/recurring/${formData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                showToast('Recurring transaction updated');
            } else {
                await apiCall('/api/recurring', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                showToast('Recurring transaction created');
            }
            setIsModalOpen(false);
            setFormData(prev => ({ ...prev, id: '', amount: '', description: '', next_execution: '' }));
            fetchRecurring();
        } catch (error) {
            showToast('Failed to save recurring transaction', 'error');
        }
    };

    const handleEdit = (t) => {
        setFormData({
            id: t.id,
            category_id: t.category_id,
            type: t.type,
            amount: t.amount,
            description: t.description || '',
            frequency: t.frequency,
            next_execution: t.next_execution.split('T')[0]
        });
        setIsModalOpen(true);
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            await apiCall(`/api/recurring/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !currentStatus })
            });
            showToast(`Transaction ${!currentStatus ? 'activated' : 'paused'}`);
            fetchRecurring();
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this recurring transaction?')) return;
        try {
            await apiCall(`/api/recurring/${id}`, { method: 'DELETE' });
            showToast('Transaction deleted');
            fetchRecurring();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    // Filter categories by selected type
    const filteredCategories = categories.filter(c => c.type === formData.type);

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2>Recurring Transactions</h2>
                        <p>Manage your subscriptions, bills, and automated incomes.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setFormData({ id: '', category_id: categories.find(c => c.type === 'expense')?.id || '', type: 'expense', amount: '', description: '', frequency: 'monthly', next_execution: '' }); setIsModalOpen(true); }}>
                        <i className="fas fa-plus"></i> Add New
                    </button>
                </header>

                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Frequency</th>
                                    <th>Next Due</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center' }}>No recurring transactions set up.</td></tr>
                                ) : (
                                    transactions.map(t => (
                                        <tr key={t.id}>
                                            <td>{t.description || 'N/A'}</td>
                                            <td><i className={t.category_icon}></i> {t.category_name}</td>
                                            <td style={{color: t.type === 'income' ? 'var(--success-color)' : 'var(--text-primary)', fontWeight: 600}}>
                                                {t.type === 'income' ? '+' : '-'}{formatCurrency(convert(t.amount), currency)}
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{t.frequency}</td>
                                            <td>{new Date(t.next_execution).toLocaleDateString()}</td>
                                            <td>
                                                <button 
                                                    className={`btn ${t.is_active ? 'btn-success' : 'btn-secondary'}`} 
                                                    style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                                    onClick={() => toggleActive(t.id, t.is_active)}
                                                >
                                                    {t.is_active ? 'Active' : 'Paused'}
                                                </button>
                                            </td>
                                            <td className="action-btns">
                                                <button className="edit-btn" onClick={() => handleEdit(t)}><i className="fas fa-edit"></i></button>
                                                <button className="delete-btn" onClick={() => handleDelete(t.id)}><i className="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{formData.id ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Type</label>
                                <div className="type-toggle">
                                    <button 
                                        type="button" 
                                        className={formData.type === 'expense' ? 'active expense' : ''} 
                                        onClick={() => {
                                            setFormData(prev => ({...prev, type: 'expense', category_id: categories.find(c => c.type === 'expense')?.id || ''}));
                                        }}
                                    >Expense</button>
                                    <button 
                                        type="button" 
                                        className={formData.type === 'income' ? 'active income' : ''} 
                                        onClick={() => {
                                            setFormData(prev => ({...prev, type: 'income', category_id: categories.find(c => c.type === 'income')?.id || ''}));
                                        }}
                                    >Income</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-control" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} required>
                                    {filteredCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title / Description</label>
                                <input type="text" className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Amount ({currency})</label>
                                <input type="number" step="0.01" className="form-control" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Frequency</label>
                                <select className="form-control" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} required>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>First / Next Execution Date</label>
                                <input type="date" className="form-control" value={formData.next_execution} onChange={e => setFormData({...formData, next_execution: e.target.value})} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Automation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringTransactions;
