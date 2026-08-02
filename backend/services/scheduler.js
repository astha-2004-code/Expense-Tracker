const cron = require('node-cron');
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

const calculateNextExecution = (dateString, frequency) => {
    const date = new Date(dateString);
    if (frequency === 'daily') date.setDate(date.getDate() + 1);
    else if (frequency === 'weekly') date.setDate(date.getDate() + 7);
    else if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
    else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
    
    // Format back to YYYY-MM-DD
    return date.toISOString().split('T')[0];
};

const processRecurringTransactions = async () => {
    console.log('[Scheduler] Checking for due recurring transactions...');
    try {
        const dueTransactions = await RecurringTransaction.getDueTransactions();
        
        for (const rt of dueTransactions) {
            console.log(`[Scheduler] Processing recurring transaction ID: ${rt.id} - ${rt.title || rt.description}`);
            
            // 1. Insert into transactions table
            // Transaction model expects: (userId, categoryId, type, amount, description, date)
            await Transaction.create(
                rt.user_id,
                rt.category_id,
                rt.type,
                rt.amount,
                rt.description + ' (Automated)',
                new Date().toISOString().split('T')[0]
            );
            
            // 2. Calculate next execution date
            const nextExecutionDate = calculateNextExecution(rt.next_execution, rt.frequency);
            
            // 3. Update recurring transaction record
            await RecurringTransaction.updateNextExecution(rt.id, nextExecutionDate);
        }
        
        console.log(`[Scheduler] Processed ${dueTransactions.length} automated transactions.`);
    } catch (error) {
        console.error('[Scheduler] Error processing recurring transactions:', error);
    }
};

const startScheduler = () => {
    // Run every day at 00:00 (Midnight)
    cron.schedule('0 0 * * *', processRecurringTransactions);
    console.log('[Scheduler] Recurring transaction scheduler started.');
    
    // Run once on startup just in case
    processRecurringTransactions();
};

module.exports = { startScheduler };
