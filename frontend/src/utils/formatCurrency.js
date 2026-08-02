export const formatCurrency = (amount) => {
    // Convert to number if it's a string, or default to 0 if invalid
    const numericAmount = Number(amount) || 0;
    
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(numericAmount);
};
