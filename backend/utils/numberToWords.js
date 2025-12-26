// Convert numbers to Indian words format
// Example: 160300 → "One Lakh Sixty Thousand Three Hundred Only"

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

function convertTwoDigit(num) {
    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
}

function numberToWords(num) {
    if (num === 0) return 'Zero Only';

    // Handle decimal part (paise)
    const parts = num.toString().split('.');
    const rupees = parseInt(parts[0]);
    const paise = parts[1] ? parseInt(parts[1].padEnd(2, '0').substring(0, 2)) : 0;

    let words = '';

    // Crores (10,000,000)
    if (rupees >= 10000000) {
        const crores = Math.floor(rupees / 10000000);
        words += convertTwoDigit(crores) + ' Crore ';
    }

    // Lakhs (100,000)
    const lakhs = Math.floor((rupees % 10000000) / 100000);
    if (lakhs > 0) {
        words += convertTwoDigit(lakhs) + ' Lakh ';
    }

    // Thousands (1,000)
    const thousands = Math.floor((rupees % 100000) / 1000);
    if (thousands > 0) {
        words += convertTwoDigit(thousands) + ' Thousand ';
    }

    // Hundreds (100)
    const hundreds = Math.floor((rupees % 1000) / 100);
    if (hundreds > 0) {
        words += ones[hundreds] + ' Hundred ';
    }

    // Tens and ones
    const remainder = rupees % 100;
    if (remainder > 0) {
        words += convertTwoDigit(remainder) + ' ';
    }

    words = words.trim();

    // Add paise if present
    if (paise > 0) {
        words += ' and ' + convertTwoDigit(paise) + ' Paise';
    }

    return words + ' Only';
}

export default numberToWords;
