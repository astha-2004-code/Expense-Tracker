let overviewChart, categoryChart;
let allCategories = [];
let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/';
        return;
    }

    document.getElementById('greeting').textContent = `Hello, ${user.name.split(' ')[0]}!`;

    // Set default month filter to current month
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('filter-month').value = monthStr;

    init();
});

async function init() {
    await fetchCategories();
    await fetchDashboardData();
}

async function fetchCategories() {
    try {
        const res = await apiCall('/api/categories');
        if (res && res.data) {
            allCategories = res.data;
            populateFilterCategories();
            populateCategories(); // for modal
        }
    } catch (e) {
        console.error(e);
    }
}

function populateFilterCategories() {
    const select = document.getElementById('filter-category');
    select.innerHTML = '<option value="">All Categories</option>';
    allCategories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

function populateCategories() {
    const type = document.getElementById('trans-type').value;
    const select = document.getElementById('trans-category');
    select.innerHTML = '';
    
    const filteredCats = allCategories.filter(c => c.type === type);
    filteredCats.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

async function fetchDashboardData() {
    await Promise.all([
        fetchTransactions(),
        fetchAnalytics()
    ]);
}

function debounceFetchTransactions() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchTransactions();
    }, 500);
}

async function fetchTransactions() {
    const type = document.getElementById('filter-type').value;
    const categoryId = document.getElementById('filter-category').value;
    const sortBy = document.getElementById('filter-sort').value;
    const search = document.getElementById('search-input').value;
    const monthVal = document.getElementById('filter-month').value;
    
    let query = `?sortBy=${sortBy}`;
    if (type) query += `&type=${type}`;
    if (categoryId) query += `&categoryId=${categoryId}`;
    if (search) query += `&search=${search}`;
    if (monthVal) {
        const [year, month] = monthVal.split('-');
        query += `&year=${year}&month=${month}`;
    }

    try {
        const res = await apiCall(`/api/transactions${query}`);
        if (res && res.data) {
            renderTransactions(res.data);
        }
    } catch (e) {
        console.error(e);
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No transactions found.</td></tr>';
        return;
    }

    transactions.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(t.date)}</td>
            <td>${t.description || '-'}</td>
            <td><i class="${t.category_icon}"></i> ${t.category_name}</td>
            <td><span class="type-badge ${t.type}">${t.type}</span></td>
            <td style="color: ${t.type === 'income' ? 'var(--success-color)' : 'var(--text-primary)'}; font-weight: 600;">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
            </td>
            <td class="action-btns">
                <button class="edit-btn" onclick='editTransaction(${JSON.stringify(t)})' title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function fetchAnalytics() {
    const monthVal = document.getElementById('filter-month').value;
    let query = '';
    if (monthVal) {
        const [year, month] = monthVal.split('-');
        query = `?year=${year}&month=${month}`;
    }

    try {
        const res = await apiCall(`/api/transactions/analytics${query}`);
        if (res && res.data) {
            updateSummaryCards(res.data.summary);
            renderCharts(res.data);
        }
    } catch (e) {
        console.error(e);
    }
}

function updateSummaryCards(summary) {
    document.getElementById('total-income').textContent = formatCurrency(summary.income);
    document.getElementById('total-expense').textContent = formatCurrency(summary.expense);
    document.getElementById('current-balance').textContent = formatCurrency(summary.balance);

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.monthly_budget > 0 && summary.expense > user.monthly_budget) {
        showToast(`Warning: You have exceeded your monthly budget of ${formatCurrency(user.monthly_budget)}!`, 'warning');
    }
}

// Chart Configurations
Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
Chart.defaults.font.family = "'Inter', sans-serif";

function renderCharts(data) {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim();
    const dangerColor = getComputedStyle(document.documentElement).getPropertyValue('--danger-color').trim();
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();

    // 1. Overview Chart (Doughnut)
    const ctxOverview = document.getElementById('overviewChart').getContext('2d');
    if (overviewChart) overviewChart.destroy();
    
    overviewChart = new Chart(ctxOverview, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                data: [data.summary.income, data.summary.expense],
                backgroundColor: [successColor, dangerColor],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor } }
            },
            cutout: '70%'
        }
    });

    // 2. Category Expense Chart (Bar)
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    const catLabels = data.expenseBreakdown.map(c => c.category_name);
    const catData = data.expenseBreakdown.map(c => c.total);

    categoryChart = new Chart(ctxCategory, {
        type: 'bar',
        data: {
            labels: catLabels,
            datasets: [{
                label: 'Expenses',
                data: catData,
                backgroundColor: primaryColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { ticks: { color: textColor }, grid: { display: false } }
            }
        }
    });
}

// Handle Theme Change for Charts
window.addEventListener('themeChanged', () => {
    fetchAnalytics(); // re-render charts with new theme colors
});

// Modal Logic
function openModal(id) {
    document.getElementById('transaction-id').value = '';
    document.getElementById('transaction-form').reset();
    document.getElementById('trans-date').valueAsDate = new Date();
    document.getElementById('modal-title').textContent = 'Add Transaction';
    populateCategories();
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Transaction Form Submit
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('transaction-id').value;
    const payload = {
        type: document.getElementById('trans-type').value,
        categoryId: document.getElementById('trans-category').value,
        amount: document.getElementById('trans-amount').value,
        date: document.getElementById('trans-date').value,
        description: document.getElementById('trans-desc').value
    };

    try {
        if (id) {
            // Update
            await apiCall(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Transaction updated successfully');
        } else {
            // Add
            await apiCall('/api/transactions', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Transaction added successfully');
        }
        closeModal('addTransactionModal');
        fetchDashboardData();
    } catch (e) {
        console.error(e);
    }
});

function editTransaction(t) {
    document.getElementById('modal-title').textContent = 'Edit Transaction';
    document.getElementById('transaction-id').value = t.id;
    document.getElementById('trans-type').value = t.type;
    populateCategories(); // Update category dropdown based on type
    
    document.getElementById('trans-category').value = t.category_id;
    document.getElementById('trans-amount').value = t.amount;
    document.getElementById('trans-desc').value = t.description;
    document.getElementById('trans-date').value = t.date.split('T')[0];
    
    document.getElementById('addTransactionModal').classList.add('active');
}

async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            await apiCall(`/api/transactions/${id}`, { method: 'DELETE' });
            showToast('Transaction deleted successfully');
            fetchDashboardData();
        } catch (e) {
            console.error(e);
        }
    }
}

// Export to CSV
async function exportToCSV() {
    const monthVal = document.getElementById('filter-month').value;
    let query = '?limit=1000'; // fetch more for export
    if (monthVal) {
        const [year, month] = monthVal.split('-');
        query += `&year=${year}&month=${month}`;
    }

    try {
        const res = await apiCall(`/api/transactions${query}`);
        if (res && res.data) {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Date,Description,Category,Type,Amount\n";
            
            res.data.forEach(t => {
                const date = t.date.split('T')[0];
                const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
                const row = [date, desc, t.category_name, t.type, t.amount].join(",");
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `transactions_${monthVal || 'all'}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Export successful');
        }
    } catch (e) {
        console.error(e);
    }
}
