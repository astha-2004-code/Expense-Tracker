export const formatCurrency = (amount, currencyCode = 'INR') => {
    // Convert to number if it's a string, or default to 0 if invalid
    const numericAmount = Number(amount) || 0;
    
    // Choose appropriate locale based on currency
    let locale = 'en-IN';
    if (currencyCode === 'USD') locale = 'en-US';
    else if (currencyCode === 'EUR') locale = 'de-DE';

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
    }).format(numericAmount);
};
