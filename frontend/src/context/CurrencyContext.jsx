import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

const STATIC_RATES = {
    INR: 1,
    USD: 0.012, // 1 INR = 0.012 USD
    EUR: 0.011, // 1 INR = 0.011 EUR
};

export const CurrencyProvider = ({ children }) => {
    const { user, apiCall, showToast } = useAuth();
    
    // Default to INR if no user or no preferred currency
    const [currency, setCurrency] = useState('INR');
    
    useEffect(() => {
        if (user && user.preferred_currency) {
            setCurrency(user.preferred_currency);
        } else {
            setCurrency('INR');
        }
    }, [user]);

    const changeCurrency = async (newCurrency) => {
        try {
            setCurrency(newCurrency); // Optimistic UI update
            
            // Save to backend
            await apiCall('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ preferred_currency: newCurrency })
            });
            showToast(`Currency changed to ${newCurrency}`);
        } catch (error) {
            console.error("Failed to update currency", error);
            // Revert on failure
            if (user && user.preferred_currency) {
                setCurrency(user.preferred_currency);
            }
        }
    };

    // Convert an amount from INR (base) to the selected currency
    const convert = (amountInINR) => {
        const rate = STATIC_RATES[currency] || 1;
        return (Number(amountInINR) || 0) * rate;
    };

    return (
        <CurrencyContext.Provider value={{ currency, changeCurrency, convert }}>
            {children}
        </CurrencyContext.Provider>
    );
};
