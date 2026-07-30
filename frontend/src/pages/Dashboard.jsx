import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
    const { user, apiCall, showToast } = useAuth();
    
    // State
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);
    const [categories, setCategories] = useState([]);
    
    // Filters
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [monthFilter, setMonthFilter] = useState(defaultMonth);
    const [typeFilter, setTypeFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('latest');
    const [searchFilter, setSearchFilter] = useState('');
    
    // Modal
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: '', type: 'expense', categoryId: '', amount: '', date: '', description: '' });

    // Chart Options
    const chartOptions = {
        color: '#777777',
        font: { family: "'Inter', sans-serif" }
    };

    const fetchCategories = useCallback(async () => {
        try {
            const res = await apiCall('/api/categories');
            if (res && res.data) setCategories(res.data);
        } catch (e) { console.error(e); }
    }, [apiCall]);

    const fetchDashboardData = useCallback(async () => {
        let query = `?sortBy=${sortFilter}`;
        if (typeFilter) query += `&type=${typeFilter}`;
        if (categoryFilter) query += `&categoryId=${categoryFilter}`;
        if (searchFilter) query += `&search=${searchFilter}`;
        if (monthFilter) {
            const [year, month] = monthFilter.split('-');
            query += `&year=${year}&month=${month}`;
        }

        try {
            const [transRes, statsRes] = await Promise.all([
                apiCall(`/api/transactions${query}`),
                apiCall(`/api/transactions/analytics${monthFilter ? `?year=${monthFilter.split('-')[0]}&month=${monthFilter.split('-')[1]}` : ''}`)
            ]);

            if (transRes?.data) setTransactions(transRes.data);
            if (statsRes?.data) {
                setSummary(statsRes.data.summary);
                setExpenseBreakdown(statsRes.data.expenseBreakdown);
                
                if (user.monthly_budget > 0 && statsRes.data.summary.expense > user.monthly_budget) {
                    showToast(`Warning: You exceeded your budget of $${user.monthly_budget}!`, 'warning');
                }
            }
        } catch (e) { console.error(e); }
    }, [apiCall, sortFilter, typeFilter, categoryFilter, searchFilter, monthFilter, user.monthly_budget, showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchDashboardData();
        }, 500); // debounce search
        return () => clearTimeout(timeoutId);
    }, [fetchDashboardData, searchFilter]); // Also runs when other dependencies in useCallback change

    const handleModalOpen = (transaction = null) => {
        if (transaction) {
            setFormData({
                id: transaction.id,
                type: transaction.type,
                categoryId: transaction.category_id,
                amount: transaction.amount,
                date: transaction.date.split('T')[0],
                description: transaction.description
            });
        } else {
            setFormData({ id: '', type: 'expense', categoryId: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
        }
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await apiCall(`/api/transactions/${formData.id}`, { method: 'PUT', body: JSON.stringify(formData) });
                showToast('Transaction updated');
            } else {
                await apiCall('/api/transactions', { method: 'POST', body: JSON.stringify(formData) });
                showToast('Transaction added');
            }
            setShowModal(false);
            fetchDashboardData();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this transaction?')) {
            try {
                await apiCall(`/api/transactions/${id}`, { method: 'DELETE' });
                showToast('Transaction deleted');
                fetchDashboardData();
            } catch (e) { console.error(e); }
        }
    };

    const toggleTheme = () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        // Force chart update if needed
        setSummary({...summary}); 
    };

    const exportToCSV = async () => {
        let query = '?limit=1000';
        if (monthFilter) {
            const [year, month] = monthFilter.split('-');
            query += `&year=${year}&month=${month}`;
        }
        try {
            const res = await apiCall(`/api/transactions${query}`);
            if (res && res.data) {
                let csvContent = "data:text/csv;charset=utf-8,Date,Description,Category,Type,Amount\n";
                res.data.forEach(t => {
                    const row = [t.date.split('T')[0], `"${(t.description || '').replace(/"/g, '""')}"`, t.category_name, t.type, t.amount].join(",");
                    csvContent += row + "\n";
                });
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `transactions_${monthFilter || 'all'}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (e) { console.error(e); }
    };

    // Chart Data Config
    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#4361ee';
    const successColor = getComputedStyle(document.body).getPropertyValue('--success-color').trim() || '#2ecc71';
    const dangerColor = getComputedStyle(document.body).getPropertyValue('--danger-color').trim() || '#e74c3c';
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-primary').trim() || '#333';

    const doughnutData = {
        labels: ['Income', 'Expense'],
        datasets: [{
            data: [summary.income, summary.expense],
            backgroundColor: [successColor, dangerColor],
            borderWidth: 0
        }]
    };

    const barData = {
        labels: expenseBreakdown.map(c => c.category_name),
        datasets: [{
            label: 'Expenses',
            data: expenseBreakdown.map(c => c.total),
            backgroundColor: primaryColor,
            borderRadius: 4
        }]
    };

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2>Hello, {user.name.split(' ')[0]}!</h2>
                        <p>Here's what's happening with your money.</p>
                    </div>
                    <div className="user-info">
                        <div className="theme-toggle" onClick={toggleTheme}>
                            <i className="fas fa-moon" id="theme-icon"></i>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleModalOpen()}>
                            <i className="fas fa-plus"></i> Add Transaction
                        </button>
                    </div>
                </header>

                <section className="summary-cards">
                    <div className="card income">
                        <div className="card-icon"><i className="fas fa-arrow-up"></i></div>
                        <div className="card-info">
                            <h3>Total Income</h3>
                            <div className="amount">${parseFloat(summary.income).toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="card expense">
                        <div className="card-icon"><i className="fas fa-arrow-down"></i></div>
                        <div className="card-info">
                            <h3>Total Expense</h3>
                            <div className="amount">${parseFloat(summary.expense).toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-icon" style={{color: 'var(--primary-color)'}}><i className="fas fa-balance-scale"></i></div>
                        <div className="card-info">
                            <h3>Current Balance</h3>
                            <div className="amount">${parseFloat(summary.balance).toFixed(2)}</div>
                        </div>
                    </div>
                </section>

                <section className="charts-section">
                    <div className="chart-container">
                        <h3>Income vs Expense</h3>
                        <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: textColor } } }, cutout: '70%' }} />
                    </div>
                    <div className="chart-container">
                        <h3>Expense by Category</h3>
                        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: textColor } }, x: { ticks: { color: textColor } } } }} />
                    </div>
                </section>

                <section className="transactions-section">
                    <div className="section-header">
                        <h3>Recent Transactions</h3>
                        <button className="btn btn-outline" onClick={exportToCSV}><i className="fas fa-download"></i> Export CSV</button>
                    </div>
                    
                    <div className="filters">
                        <input type="text" placeholder="Search description..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={sortFilter} onChange={e => setSortFilter(e.target.value)}>
                            <option value="latest">Latest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Amount</option>
                            <option value="lowest">Lowest Amount</option>
                        </select>
                        <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
                    </div>

                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign:'center'}}>No transactions found.</td></tr>
                                ) : (
                                    transactions.map(t => (
                                        <tr key={t.id}>
                                            <td>{new Date(t.date).toLocaleDateString()}</td>
                                            <td>{t.description || '-'}</td>
                                            <td><i className={t.category_icon}></i> {t.category_name}</td>
                                            <td><span className={`type-badge ${t.type}`}>{t.type}</span></td>
                                            <td style={{color: t.type === 'income' ? 'var(--success-color)' : 'var(--text-primary)', fontWeight: 600}}>
                                                {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                                            </td>
                                            <td className="action-btns">
                                                <button className="edit-btn" onClick={() => handleModalOpen(t)}><i className="fas fa-edit"></i></button>
                                                <button className="delete-btn" onClick={() => handleDelete(t.id)}><i className="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal-content">
                        <i className="fas fa-times close-modal" onClick={() => setShowModal(false)}></i>
                        <h2>{formData.id ? 'Edit Transaction' : 'Add Transaction'}</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Type</label>
                                <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, categoryId: ''})} required>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-control" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                                    <option value="" disabled>Select Category</option>
                                    {categories.filter(c => c.type === formData.type).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount ($)</label>
                                <input type="number" step="0.01" className="form-control" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <input type="text" className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Save Transaction</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
