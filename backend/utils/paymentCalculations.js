// AUDIT FIX - TASK 3: Duplicate Calculation Logic
// Shared utility for payment status calculation to ensure consistency
// across SalesOrder, PurchaseOrder, and payment routes

/**
 * Calculate payment status based on amount paid and total amount
 * Uses consistent rounding tolerance of 0.01 to handle floating point precision
 * 
 * @param {number} amountPaid - Amount already paid
 * @param {number} totalAmount - Total amount due
 * @returns {string} Payment status: 'paid', 'partial', or 'pending'
 */
export function calculatePaymentStatus(amountPaid, totalAmount) {
    const ROUNDING_TOLERANCE = 0.01;

    if (amountPaid === 0 || amountPaid < ROUNDING_TOLERANCE) {
        return 'pending';
    } else if (amountPaid >= totalAmount - ROUNDING_TOLERANCE) {
        return 'paid';
    } else {
        return 'partial';
    }
}

/**
 * Calculate amount due with proper rounding
 * 
 * @param {number} totalAmount - Total amount
 * @param {number} amountPaid - Amount already paid
 * @returns {number} Amount due, rounded to 2 decimal places
 */
export function calculateAmountDue(totalAmount, amountPaid) {
    const amountDue = totalAmount - amountPaid;
    return Math.round(Math.max(0, amountDue) * 100) / 100;
}

/**
 * Round amount to 2 decimal places for currency
 * 
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export function roundCurrency(amount) {
    return Math.round(amount * 100) / 100;
}
