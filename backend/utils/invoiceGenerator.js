import PDFDocument from 'pdfkit';
import numberToWords from './numberToWords.js';

/**
 * Generate professional invoice PDF matching the custom template format
 * @param {Object} invoiceData - Invoice data from Invoice model
 * @returns {PDFDocument} PDF document stream
 */
function generateInvoicePDF(invoiceData) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    const pageWidth = doc.page.width - 80;
    const leftMargin = 40;
    const rightMargin = doc.page.width - 40;

    // Helper to draw rectangle
    const drawRect = (x, y, width, height) => {
        doc.lineWidth(1);
        doc.rect(x, y, width, height).stroke();
    };

    let currentY = 40;

    // Main outer border
    const contentHeight = doc.page.height - 80;
    drawRect(leftMargin, currentY, pageWidth, contentHeight);

    // Header section
    currentY += 15;
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(invoiceData.companyDetails.name, leftMargin + 10, currentY);

    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('INVOICE', rightMargin - 100, currentY, { width: 90, align: 'right' });

    currentY += 20;
    doc.fontSize(9).font('Helvetica');
    doc.text(`INVOICE #: ${invoiceData.invoiceNumber}`, rightMargin - 150, currentY, { width: 140, align: 'right' });

    currentY += 25;

    // Horizontal line after header
    doc.lineWidth(1);
    doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

    currentY += 15;

    // FROM section and DATE on same line
    const fromSectionY = currentY;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('FROM', leftMargin + 10, currentY);

    // DATE on the right (same line as FROM)
    doc.text('DATE', rightMargin - 150, currentY, { width: 140, align: 'right' });
    currentY += 12;

    doc.fontSize(9).font('Helvetica');
    doc.text(invoiceData.companyDetails.name, leftMargin + 10, currentY);

    // Date value on the right
    doc.text(new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN'), rightMargin - 150, currentY, { width: 140, align: 'right' });
    currentY += 12;

    if (invoiceData.companyDetails.email) {
        doc.text(invoiceData.companyDetails.email, leftMargin + 10, currentY);
        currentY += 12;
    }

    if (invoiceData.companyDetails.phone) {
        doc.text(invoiceData.companyDetails.phone, leftMargin + 10, currentY);
        currentY += 12;
    }

    currentY += 10;

    // BILL TO section and DUE ON on same line
    const billToY = currentY;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('BILL TO', leftMargin + 10, currentY);

    // DUE ON on the right (same line as BILL TO)
    doc.text('DUE ON', rightMargin - 150, currentY, { width: 140, align: 'right' });
    currentY += 12;

    doc.fontSize(9).font('Helvetica');
    doc.text(invoiceData.clientDetails.name, leftMargin + 10, currentY);

    // Due date value on the right
    const dueDate = invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('en-IN') : 'On Receipt';
    doc.text(dueDate, rightMargin - 150, currentY, { width: 140, align: 'right' });
    currentY += 12;

    if (invoiceData.clientDetails.email) {
        doc.text(invoiceData.clientDetails.email, leftMargin + 10, currentY);
        currentY += 12;
    }

    if (invoiceData.clientDetails.address) {
        doc.text(invoiceData.clientDetails.address, leftMargin + 10, currentY, { width: 250 });
        currentY += 12;
    }

    currentY += 20;

    // Items table
    const tableTop = currentY;

    // Define column positions
    const descCol = leftMargin;
    const qtyCol = leftMargin + 250;
    const rateCol = leftMargin + 340;
    const perCol = leftMargin + 420;
    const amountCol = leftMargin + 470;
    const tableRight = rightMargin;

    // Table header
    doc.lineWidth(1);
    doc.moveTo(leftMargin, tableTop).lineTo(rightMargin, tableTop).stroke();

    currentY = tableTop + 8;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('DESCRIPTION', descCol + 10, currentY);
    doc.text('QUANTITY', qtyCol + 10, currentY);
    doc.text('RATE', rateCol + 5, currentY, { width: 70, align: 'right' });
    doc.text('Per', perCol + 5, currentY);
    doc.text('Amount', amountCol + 5, currentY, { width: tableRight - amountCol - 10, align: 'right' });

    currentY += 15;
    doc.lineWidth(1);
    doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

    currentY += 8;

    // Store starting Y for vertical lines
    const tableContentStart = currentY;

    // Table rows
    doc.font('Helvetica');
    invoiceData.items.forEach((item) => {
        const rowStartY = currentY;

        // Description
        doc.text(item.description, descCol + 10, currentY, { width: 230 });

        // Quantity
        let quantityText = `${item.quantity} ${item.unit}`;
        if (item.weightInKgs) {
            quantityText += `\n(${item.weightInKgs} KGS)`;
        }
        doc.text(quantityText, qtyCol + 10, currentY, { width: 80 });

        // Rate
        doc.text(item.rate.toFixed(2), rateCol + 5, currentY, { width: 70, align: 'right' });

        // Per
        doc.text(item.per, perCol + 5, currentY, { width: 40 });

        // Amount
        doc.text(item.amount.toFixed(2), amountCol + 5, currentY, { width: tableRight - amountCol - 10, align: 'right' });

        currentY += item.weightInKgs ? 30 : 20;
    });

    // Bottom line of table
    const tableContentEnd = currentY;
    doc.lineWidth(1);
    doc.moveTo(leftMargin, tableContentEnd).lineTo(rightMargin, tableContentEnd).stroke();

    // Draw continuous vertical lines for entire table
    doc.lineWidth(1);

    // Left border
    doc.moveTo(leftMargin, tableTop).lineTo(leftMargin, tableContentEnd).stroke();

    // Column separators
    doc.moveTo(qtyCol, tableTop).lineTo(qtyCol, tableContentEnd).stroke();
    doc.moveTo(rateCol, tableTop).lineTo(rateCol, tableContentEnd).stroke();
    doc.moveTo(perCol, tableTop).lineTo(perCol, tableContentEnd).stroke();
    doc.moveTo(amountCol, tableTop).lineTo(amountCol, tableContentEnd).stroke();

    // Right border
    doc.moveTo(rightMargin, tableTop).lineTo(rightMargin, tableContentEnd).stroke();

    // Ensure we're at a good position for totals
    if (currentY < doc.page.height - 250) {
        currentY = doc.page.height - 250;
    }

    // Bottom section line
    doc.lineWidth(1);
    doc.moveTo(leftMargin, currentY).lineTo(rightMargin, currentY).stroke();

    currentY += 10;

    // Declaration on left, Totals on right
    const declarationX = leftMargin + 10;
    const totalsX = rightMargin - 200;

    // Declaration
    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text(
        'Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct',
        declarationX,
        currentY,
        { width: 300 }
    );

    // Totals section
    let totalsY = currentY;
    doc.fontSize(9).font('Helvetica');

    // Calculate items subtotal from items array (not from totalAmount)
    const itemsSubtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);

    // SUBTOTAL (items only)
    doc.text('SUBTOTAL', totalsX, totalsY);
    doc.text(itemsSubtotal.toFixed(2), totalsX + 100, totalsY, { width: 90, align: 'right' });
    totalsY += 15;

    // WAGES (always show, even if 0)
    const wagesAmount = invoiceData.wages || 0;
    doc.text('Wages', totalsX, totalsY);
    doc.text(wagesAmount.toFixed(2), totalsX + 100, totalsY, { width: 90, align: 'right' });
    totalsY += 15;

    // TOTAL (subtotal + wages)
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('TOTAL', totalsX, totalsY);
    doc.text(invoiceData.totalAmount.toFixed(2), totalsX + 100, totalsY, { width: 90, align: 'right' });

    totalsY += 25;

    // Amount in words
    currentY = Math.max(currentY + 50, totalsY);
    doc.fontSize(9).font('Helvetica');
    const amountWords = invoiceData.amountInWords || numberToWords(invoiceData.totalAmount);
    doc.text('Amount in words:', leftMargin + 10, currentY);
    currentY += 12;
    doc.font('Helvetica-Bold');
    doc.text(`Rs. ${amountWords}`, leftMargin + 10, currentY, { width: pageWidth - 20 });

    // Footer
    currentY = doc.page.height - 60;
    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text('This is a computer generated invoice.', 0, currentY, {
        align: 'center',
        width: doc.page.width
    });

    // Authorized signatory
    doc.fontSize(9).font('Helvetica');
    doc.text('Authorised Signatory', rightMargin - 120, doc.page.height - 80, { width: 110, align: 'right' });

    return doc;
}

/**
 * Format quantity with unit and weight
 * @param {Number} qty - Quantity
 * @param {String} unit - Unit (BAGS, KGS, etc.)
 * @param {Number} weight - Weight in KGS
 * @returns {String} Formatted quantity
 */
function formatQuantity(qty, unit, weight) {
    let formatted = `${qty} ${unit}`;
    if (weight) {
        formatted += ` (${weight} KGS)`;
    }
    return formatted;
}

/**
 * Calculate total quantity across all items
 * @param {Array} items - Invoice items
 * @returns {String} Total quantity summary
 */
function calculateTotalQuantity(items) {
    const totals = {};

    items.forEach(item => {
        if (!totals[item.unit]) {
            totals[item.unit] = 0;
        }
        totals[item.unit] += item.quantity;
    });

    const parts = Object.entries(totals).map(([unit, qty]) => `${qty} ${unit}`);
    return parts.join(' + ');
}

export { generateInvoicePDF, formatQuantity, calculateTotalQuantity };
export default generateInvoicePDF;
