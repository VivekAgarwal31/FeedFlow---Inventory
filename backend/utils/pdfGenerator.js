import PDFDocument from 'pdfkit';

/**
 * Generate PDF report header with company information
 * @param {PDFDocument} doc - PDF document instance
 * @param {Object} company - Company information
 * @param {String} reportTitle - Title of the report
 * @param {Object} dateRange - Start and end dates
 */
const addReportHeader = (doc, company, reportTitle, dateRange) => {
    // Company name and code
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .text(company.name || 'Company Name', 50, 50);

    doc.fontSize(10)
        .font('Helvetica')
        .text(`Code: ${company.companyCode || 'N/A'}`, 50, 75);

    // Report title
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(reportTitle, 50, 110);

    // Date range
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
        const startDate = dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString() : 'Beginning';
        const endDate = dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString() : 'Present';
        doc.fontSize(10)
            .font('Helvetica')
            .text(`Period: ${startDate} to ${endDate}`, 50, 135);
    }

    // Generation timestamp
    doc.fontSize(8)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleString()}`, 50, 155, { align: 'left' });

    // Horizontal line
    doc.moveTo(50, 175)
        .lineTo(550, 175)
        .stroke();

    return 190; // Return Y position for content start
};

/**
 * Add table to PDF
 * @param {PDFDocument} doc - PDF document instance
 * @param {Number} startY - Starting Y position
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table data rows
 * @param {Array} columnWidths - Width for each column
 */
const addTable = (doc, startY, headers, rows, columnWidths) => {
    const startX = 50;
    let currentY = startY;
    const rowHeight = 25;
    const headerHeight = 30;

    // Draw header
    doc.font('Helvetica-Bold').fontSize(9);
    let currentX = startX;

    // Header background
    doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
        .fillAndStroke('#2D7A3E', '#2D7A3E');

    // Header text
    doc.fillColor('#FFFFFF');
    headers.forEach((header, i) => {
        doc.text(header, currentX + 5, currentY + 10, {
            width: columnWidths[i] - 10,
            align: 'left'
        });
        currentX += columnWidths[i];
    });

    currentY += headerHeight;
    doc.fillColor('#000000');

    // Draw rows
    doc.font('Helvetica').fontSize(8);
    rows.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }

        currentX = startX;

        // Alternate row colors
        if (rowIndex % 2 === 0) {
            doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
                .fill('#F5F5F5');
        }

        // Row data
        row.forEach((cell, i) => {
            doc.fillColor('#000000')
                .text(String(cell || ''), currentX + 5, currentY + 8, {
                    width: columnWidths[i] - 10,
                    align: 'left',
                    ellipsis: true
                });
            currentX += columnWidths[i];
        });

        currentY += rowHeight;
    });

    return currentY + 10; // Return next Y position
};

/**
 * Add summary section to PDF
 * @param {PDFDocument} doc - PDF document instance
 * @param {Number} startY - Starting Y position
 * @param {Object} summary - Summary statistics
 */
const addSummary = (doc, startY, summary) => {
    let currentY = startY;

    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Summary', 50, currentY);

    currentY += 25;

    doc.fontSize(10)
        .font('Helvetica');

    Object.entries(summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${label}: ${value}`, 50, currentY);
        currentY += 20;
    });

    return currentY + 10;
};

/**
 * Generate Sales Report PDF
 * @param {Array} sales - Sales data
 * @param {Object} company - Company information
 * @param {Object} filters - Report filters (dateRange, clientId, etc.)
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateSalesPDF = async (sales, company, filters = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Add header
            let yPos = addReportHeader(doc, company, 'Sales Report', {
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            // Calculate summary
            const totalSales = sales.length;
            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
            const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
            const paidSales = sales.filter(s => s.paymentStatus === 'paid').length;
            const pendingSales = sales.filter(s => s.paymentStatus === 'pending').length;

            // Add summary
            yPos = addSummary(doc, yPos, {
                'Total Sales': totalSales
            });

            yPos += 20;

            // Add sales table
            if (sales.length > 0) {
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Sales Details', 50, yPos);

                yPos += 25;

                const headers = ['Date', 'Client', 'Staff Name', 'Items (Warehouse - Quantity)'];
                const columnWidths = [70, 80, 80, 265]; // Total: 495pt (fits in A4 with margins)

                const rows = sales.map(sale => {
                    // Format items with warehouse and quantity
                    let itemsText = 'N/A';
                    if (sale.items && sale.items.length > 0) {
                        itemsText = sale.items.map(item =>
                            `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                        ).join(', ');
                    }

                    return [
                        new Date(sale.saleDate).toLocaleDateString(),
                        sale.clientName || 'N/A',
                        sale.staffName || 'N/A',
                        itemsText
                    ];
                });

                addTable(doc, yPos, headers, rows, columnWidths);
            } else {
                doc.fontSize(10)
                    .font('Helvetica')
                    .text('No sales data found for the selected period.', 50, yPos);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Purchase Report PDF
 * @param {Array} purchases - Purchase data
 * @param {Object} company - Company information
 * @param {Object} filters - Report filters
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePurchasePDF = async (purchases, company, filters = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Add header
            let yPos = addReportHeader(doc, company, 'Purchase Report', {
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            // Calculate summary
            const totalPurchases = purchases.length;
            const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
            const averagePurchase = totalPurchases > 0 ? totalAmount / totalPurchases : 0;
            const paidPurchases = purchases.filter(p => p.paymentStatus === 'paid').length;
            const pendingPurchases = purchases.filter(p => p.paymentStatus === 'pending').length;

            // Add summary
            yPos = addSummary(doc, yPos, {
                'Total Purchases': totalPurchases
            });

            yPos += 20;

            // Add purchases table
            if (purchases.length > 0) {
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Purchase Details', 50, yPos);

                yPos += 25;

                const headers = ['Date', 'Supplier', 'Staff Name', 'Items (Warehouse - Quantity)'];
                const columnWidths = [70, 80, 80, 265]; // Total: 495pt (fits in A4 with margins)

                const rows = purchases.map(purchase => {
                    // Format items with warehouse and quantity
                    let itemsText = 'N/A';
                    if (purchase.items && purchase.items.length > 0) {
                        itemsText = purchase.items.map(item =>
                            `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
                        ).join(', ');
                    }

                    return [
                        new Date(purchase.purchaseDate).toLocaleDateString(),
                        purchase.supplierName || 'N/A',
                        purchase.staffName || 'N/A',
                        itemsText
                    ];
                });

                addTable(doc, yPos, headers, rows, columnWidths);
            } else {
                doc.fontSize(10)
                    .font('Helvetica')
                    .text('No purchase data found for the selected period.', 50, yPos);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Inventory Report PDF
 * @param {Array} stockItems - Stock items data
 * @param {Object} company - Company information
 * @param {Object} filters - Report filters
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateInventoryPDF = async (stockItems, company, filters = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Add header
            let yPos = addReportHeader(doc, company, 'Inventory Report', {});

            // Group items by itemName and collect warehouse quantities
            const itemsMap = new Map();
            const warehousesSet = new Set();

            stockItems.forEach(item => {
                const itemName = item.itemName || 'N/A';
                const warehouseName = item.warehouseName || item.warehouseId?.name || 'Unknown Warehouse';

                warehousesSet.add(warehouseName);

                if (!itemsMap.has(itemName)) {
                    itemsMap.set(itemName, {
                        itemName,
                        totalQuantity: 0,
                        warehouses: {}
                    });
                }

                const itemData = itemsMap.get(itemName);
                itemData.totalQuantity += (item.quantity || 0);
                itemData.warehouses[warehouseName] = (itemData.warehouses[warehouseName] || 0) + (item.quantity || 0);
            });

            const warehouses = Array.from(warehousesSet).sort();
            const consolidatedItems = Array.from(itemsMap.values());

            // Calculate summary
            const totalUniqueItems = consolidatedItems.length;
            const totalQuantity = consolidatedItems.reduce((sum, item) => sum + item.totalQuantity, 0);

            // Add summary
            yPos = addSummary(doc, yPos, {
                'Total Unique Items': totalUniqueItems,
                'Total Quantity': totalQuantity,
                'Warehouses': warehouses.length
            });

            yPos += 20;

            // Add inventory table
            if (consolidatedItems.length > 0) {
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Inventory Details', 50, yPos);

                yPos += 25;

                // Build headers: Item Name, Total Quantity, then each warehouse
                const headers = ['Item Name', 'Total Qty', ...warehouses];

                // Calculate column widths dynamically
                const itemNameWidth = 150;
                const totalQtyWidth = 80;
                const warehouseWidth = Math.min(100, Math.floor((750 - itemNameWidth - totalQtyWidth) / warehouses.length));
                const columnWidths = [itemNameWidth, totalQtyWidth, ...warehouses.map(() => warehouseWidth)];

                // Build rows
                const rows = consolidatedItems.map(item => {
                    const row = [
                        item.itemName,
                        item.totalQuantity.toString()
                    ];

                    // Add warehouse quantities
                    warehouses.forEach(warehouse => {
                        row.push((item.warehouses[warehouse] || 0).toString());
                    });

                    return row;
                });

                addTable(doc, yPos, headers, rows, columnWidths);
            } else {
                doc.fontSize(10)
                    .font('Helvetica')
                    .text('No inventory data found.', 50, yPos);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
