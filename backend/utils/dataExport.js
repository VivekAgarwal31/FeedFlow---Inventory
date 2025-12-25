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
