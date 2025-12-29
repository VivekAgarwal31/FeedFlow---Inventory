import ExcelJS from 'exceljs';

/**
 * Entity field definitions for export/import
 * Defines which fields to export and their headers
 */
const ENTITY_FIELDS = {
    stockItems: [
        { key: 'itemName', header: 'Item Name' },
        { key: 'category', header: 'Category' },
        { key: 'itemCategory', header: 'Item Category' },
        { key: 'bagSize', header: 'Bag Size (kg)' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'costPrice', header: 'Cost Price' },
        { key: 'sellingPrice', header: 'Selling Price' },
        { key: 'lowStockAlert', header: 'Low Stock Alert' },
        { key: 'warehouse', header: 'Warehouse' }
    ],
    sales: [
        { key: 'clientName', header: 'Client Name' },
        { key: 'clientPhone', header: 'Client Phone' },
        { key: 'clientEmail', header: 'Client Email' },
        { key: 'totalAmount', header: 'Total Amount' },
        { key: 'paymentStatus', header: 'Payment Status' },
        { key: 'paymentMethod', header: 'Payment Method' },
        { key: 'staffName', header: 'Staff Name' },
        { key: 'saleDate', header: 'Sale Date' },
        { key: 'notes', header: 'Notes' }
    ],
    salesOrders: [
        { key: 'orderNumber', header: 'Order Number' },
        { key: 'clientName', header: 'Client Name' },
        { key: 'orderDate', header: 'Order Date' },
        { key: 'orderStatus', header: 'Order Status' },
        { key: 'totalAmount', header: 'Total Amount' },
        { key: 'amountPaid', header: 'Amount Paid' },
        { key: 'amountDue', header: 'Amount Due' },
        { key: 'paymentStatus', header: 'Payment Status' },
        { key: 'wages', header: 'Wages' },
        { key: 'notes', header: 'Notes' }
    ],
    purchases: [
        { key: 'supplierName', header: 'Supplier Name' },
        { key: 'invoiceNumber', header: 'Invoice Number' },
        { key: 'totalAmount', header: 'Total Amount' },
        { key: 'paymentStatus', header: 'Payment Status' },
        { key: 'paymentMethod', header: 'Payment Method' },
        { key: 'staffName', header: 'Staff Name' },
        { key: 'purchaseDate', header: 'Purchase Date' },
        { key: 'notes', header: 'Notes' }
    ],
    purchaseOrders: [
        { key: 'orderNumber', header: 'Order Number' },
        { key: 'supplierName', header: 'Supplier Name' },
        { key: 'orderDate', header: 'Order Date' },
        { key: 'orderStatus', header: 'Order Status' },
        { key: 'totalAmount', header: 'Total Amount' },
        { key: 'amountPaid', header: 'Amount Paid' },
        { key: 'amountDue', header: 'Amount Due' },
        { key: 'paymentStatus', header: 'Payment Status' },
        { key: 'notes', header: 'Notes' }
    ],
    clients: [
        { key: 'name', header: 'Name' },
        { key: 'phone', header: 'Phone' },
        { key: 'email', header: 'Email' },
        { key: 'address', header: 'Address' },
        { key: 'gstNumber', header: 'GST Number' },
        { key: 'totalPurchases', header: 'Total Purchases' },
        { key: 'totalRevenue', header: 'Total Revenue' },
        { key: 'salesCount', header: 'Sales Count' },
        { key: 'notes', header: 'Notes' }
    ],
    suppliers: [
        { key: 'name', header: 'Name' },
        { key: 'contactPerson', header: 'Contact Person' },
        { key: 'phone', header: 'Phone' },
        { key: 'email', header: 'Email' },
        { key: 'address', header: 'Address' },
        { key: 'gstNumber', header: 'GST Number' },
        { key: 'panNumber', header: 'PAN Number' },
        { key: 'paymentTerms', header: 'Payment Terms' },
        { key: 'totalPurchases', header: 'Total Purchases' },
        { key: 'purchaseCount', header: 'Purchase Count' },
        { key: 'notes', header: 'Notes' }
    ],
    warehouses: [
        { key: 'name', header: 'Name' },
        { key: 'location', header: 'Location' },
        { key: 'capacity', header: 'Capacity' },
        { key: 'description', header: 'Description' }
    ],
    stockTransactions: [
        { key: 'type', header: 'Transaction Type' },
        { key: 'itemName', header: 'Item Name' },
        { key: 'warehouseName', header: 'Warehouse' },
        { key: 'toWarehouseName', header: 'To Warehouse' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'reason', header: 'Reason' },
        { key: 'staffName', header: 'Staff Name' },
        { key: 'transactionDate', header: 'Transaction Date' },
        { key: 'notes', header: 'Notes' }
    ]
};

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} fields - Field definitions
 * @returns {String} CSV string
 */
export const exportToCSV = (data, fields) => {
    if (!data || data.length === 0) {
        return '';
    }

    // Create header row
    const headers = fields.map(f => f.header).join(',');

    // Create data rows
    const rows = data.map(item => {
        return fields.map(field => {
            let value = item[field.key];

            // Handle dates
            if (value instanceof Date) {
                value = value.toISOString().split('T')[0];
            }

            // Handle null/undefined
            if (value === null || value === undefined) {
                value = '';
            }

            // Escape commas and quotes in values
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }

            return value;
        }).join(',');
    });

    return [headers, ...rows].join('\n');
};

/**
 * Create Excel workbook from data
 * @param {Array} data - Array of objects to export
 * @param {Array} fields - Field definitions
 * @param {String} sheetName - Name of the worksheet
 * @returns {Promise<Buffer>} Excel file buffer
 */
export const exportToExcel = async (data, fields, sheetName = 'Data') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Set up columns
    worksheet.columns = fields.map(field => ({
        header: field.header,
        key: field.key,
        width: 20
    }));

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2D7A3E' } // Primary green color
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    data.forEach(item => {
        const row = {};
        fields.forEach(field => {
            let value = item[field.key];

            // Handle dates
            if (value instanceof Date) {
                value = value.toISOString().split('T')[0];
            }

            // Handle null/undefined
            if (value === null || value === undefined) {
                value = '';
            }

            row[field.key] = value;
        });
        worksheet.addRow(row);
    });

    // Auto-filter
    worksheet.autoFilter = {
        from: 'A1',
        to: String.fromCharCode(64 + fields.length) + '1'
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

/**
 * Generate import template (empty file with headers)
 * @param {String} entityType - Type of entity
 * @param {String} format - 'csv' or 'excel'
 * @returns {Promise<Buffer|String>} Template file
 */
export const generateImportTemplate = async (entityType, format = 'excel') => {
    const fields = ENTITY_FIELDS[entityType];

    if (!fields) {
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    if (format === 'csv') {
        // Just return headers for CSV
        return fields.map(f => f.header).join(',');
    } else {
        // Create Excel template with formatted headers and sample row
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template');

        // Set up columns
        worksheet.columns = fields.map(field => ({
            header: field.header,
            key: field.key,
            width: 20
        }));

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2D7A3E' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add a sample row with placeholders
        const sampleRow = {};
        fields.forEach(field => {
            sampleRow[field.key] = `Sample ${field.header}`;
        });
        worksheet.addRow(sampleRow);

        // Add notes sheet
        const notesSheet = workbook.addWorksheet('Instructions');
        notesSheet.getCell('A1').value = 'Import Instructions';
        notesSheet.getCell('A1').font = { bold: true, size: 14 };
        notesSheet.getCell('A3').value = '1. Fill in the "Template" sheet with your data';
        notesSheet.getCell('A4').value = '2. Remove the sample row before importing';
        notesSheet.getCell('A5').value = '3. Do not modify the header row';
        notesSheet.getCell('A6').value = '4. Required fields must not be empty';
        notesSheet.getCell('A7').value = '5. Save and upload the file to import';

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
};

/**
 * Get field definitions for an entity type
 * @param {String} entityType - Type of entity
 * @returns {Array} Field definitions
 */
export const getEntityFields = (entityType) => {
    return ENTITY_FIELDS[entityType] || [];
};

/**
 * Get all supported entity types
 * @returns {Array} List of entity types
 */
export const getSupportedEntities = () => {
    return Object.keys(ENTITY_FIELDS);
};

/**
 * Generate Sales Report in Excel format
 * @param {Array} sales - Sales data
 * @param {Object} company - Company information
 * @param {Object} filters - Report filters
 * @returns {Promise<Buffer>} Excel file buffer
 */
export const generateSalesReportExcel = async (sales, company, filters = {}) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add company header
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = company.name || 'Company Name';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add date range
    if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Beginning';
        const endDate = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'Present';
        worksheet.mergeCells('A2:E2');
        worksheet.getCell('A2').value = `Period: ${startDate} to ${endDate}`;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
    }

    // Calculate summary
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    const paidSales = sales.filter(s => s.paymentStatus === 'paid').length;
    const pendingSales = sales.filter(s => s.paymentStatus === 'pending').length;

    // Add summary section
    let currentRow = 4;
    worksheet.getCell(`A${currentRow}`).value = 'Summary';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    const summaryData = [
        ['Total Sales:', totalSales]
    ];

    summaryData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow++;
    });

    currentRow += 2;

    // Add data table
    const headers = ['Date', 'Client Name', 'Staff Name', 'Items (Warehouse - Quantity)'];
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2D7A3E' }
        };
        cell.alignment = { horizontal: 'center' };
    });

    currentRow++;

    // Add sales data
    sales.forEach(sale => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = new Date(sale.saleDate).toLocaleDateString();
        row.getCell(2).value = sale.clientName || 'N/A';
        row.getCell(3).value = sale.staffName || 'N/A';

        // Format items with warehouse and quantity
        let itemsText = 'N/A';
        if (sale.items && sale.items.length > 0) {
            itemsText = sale.items.map(item =>
                `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
            ).join(', ');
        }
        row.getCell(4).value = itemsText;

        currentRow++;
    });

    // Set column widths
    worksheet.getColumn(1).width = 15;  // Date
    worksheet.getColumn(2).width = 25;  // Client Name
    worksheet.getColumn(3).width = 20;  // Staff Name
    worksheet.getColumn(4).width = 60;  // Items (Warehouse - Quantity)

    // Add auto-filter
    if (sales.length > 0) {
        worksheet.autoFilter = {
            from: { row: currentRow - sales.length - 1, column: 1 },
            to: { row: currentRow - 1, column: 4 }
        };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

/**
 * Generate Purchase Report in Excel format
 * @param {Array} purchases - Purchase data
 * @param {Object} company - Company information
 * @param {Object} filters - Report filters
 * @returns {Promise<Buffer>} Excel file buffer
 */
export const generatePurchaseReportExcel = async (purchases, company, filters = {}) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Purchase Report');

    // Add company header
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = company.name || 'Company Name';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add date range
    if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Beginning';
        const endDate = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'Present';
        worksheet.mergeCells('A2:F2');
        worksheet.getCell('A2').value = `Period: ${startDate} to ${endDate}`;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
    }

    // Calculate summary
    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const averagePurchase = totalPurchases > 0 ? totalAmount / totalPurchases : 0;
    const paidPurchases = purchases.filter(p => p.paymentStatus === 'paid').length;
    const pendingPurchases = purchases.filter(p => p.paymentStatus === 'pending').length;

    // Add summary section
    let currentRow = 4;
    worksheet.getCell(`A${currentRow}`).value = 'Summary';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    const summaryData = [
        ['Total Purchases:', totalPurchases]
    ];

    summaryData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow++;
    });

    currentRow += 2;

    // Add data table
    const headers = ['Date', 'Supplier Name', 'Staff Name', 'Items (Warehouse - Quantity)'];
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2D7A3E' }
        };
        cell.alignment = { horizontal: 'center' };
    });

    currentRow++;

    // Add purchase data
    purchases.forEach(purchase => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = new Date(purchase.purchaseDate).toLocaleDateString();
        row.getCell(2).value = purchase.supplierName || 'N/A';
        row.getCell(3).value = purchase.staffName || 'N/A';

        // Format items with warehouse and quantity
        let itemsText = 'N/A';
        if (purchase.items && purchase.items.length > 0) {
            itemsText = purchase.items.map(item =>
                `${item.itemName || 'Unknown'} (${item.warehouseName || 'Unknown'} - ${item.quantity || 0} bags)`
            ).join(', ');
        }
        row.getCell(4).value = itemsText;

        currentRow++;
    });

    // Set column widths
    worksheet.getColumn(1).width = 15;  // Date
    worksheet.getColumn(2).width = 25;  // Supplier Name
    worksheet.getColumn(3).width = 20;  // Staff Name
    worksheet.getColumn(4).width = 60;  // Items (Warehouse - Quantity)

    // Add auto-filter
    if (purchases.length > 0) {
        worksheet.autoFilter = {
            from: { row: currentRow - purchases.length - 1, column: 1 },
            to: { row: currentRow - 1, column: 4 }
        };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

/**
 * Generate Inventory Report in Excel format
 * @param {Array} stockItems - Stock items data
 * @param {Object} company - Company information
 * @param {Object} filters - Report filters
 * @returns {Promise<Buffer>} Excel file buffer
 */
export const generateInventoryReportExcel = async (stockItems, company, filters = {}) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');

    // Add company header
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = company.name || 'Company Name';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Group items by itemName and collect warehouse quantities
    const itemsMap = new Map();
    const warehousesSet = new Set();

    stockItems.forEach(item => {
        const itemName = item.itemName || 'N/A';
        const warehouseName = item.warehouseId?.name || 'Unknown Warehouse';

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

    // Add summary section
    let currentRow = 4;
    worksheet.getCell(`A${currentRow}`).value = 'Summary';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    const summaryData = [
        ['Total Unique Items:', totalUniqueItems],
        ['Total Quantity:', totalQuantity],
        ['Warehouses:', warehouses.length]
    ];

    summaryData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow++;
    });

    currentRow += 2;

    // Add data table
    const headers = ['Item Name', 'Total Qty', ...warehouses];
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2D7A3E' }
        };
        cell.alignment = { horizontal: 'center' };
    });

    currentRow++;

    // Add inventory data
    consolidatedItems.forEach(item => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = item.itemName;
        row.getCell(2).value = item.totalQuantity;

        // Add warehouse quantities
        warehouses.forEach((warehouse, index) => {
            row.getCell(3 + index).value = item.warehouses[warehouse] || 0;
        });

        currentRow++;
    });

    // Set column widths dynamically
    worksheet.getColumn(1).width = 25; // Item Name
    worksheet.getColumn(2).width = 12; // Total Qty
    warehouses.forEach((_, index) => {
        worksheet.getColumn(3 + index).width = 15; // Warehouse columns
    });

    // Add auto-filter
    if (consolidatedItems.length > 0) {
        worksheet.autoFilter = {
            from: { row: currentRow - consolidatedItems.length - 1, column: 1 },
            to: { row: currentRow - 1, column: 2 + warehouses.length }
        };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

