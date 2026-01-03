import ExcelJS from 'exceljs';

/**
 * Generate Excel template for bulk stock item creation
 * @param {Array} warehouses - List of available warehouses
 * @returns {Promise<Blob>} Excel file as blob
 */
export async function generateStockItemTemplate(warehouses) {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Stock Items Template
    const itemsSheet = workbook.addWorksheet('Stock Items');

    // Define columns
    itemsSheet.columns = [
        { header: 'Item Name *', key: 'itemName', width: 25 },
        { header: 'Category *', key: 'category', width: 20 },
        { header: 'Item Category', key: 'itemCategory', width: 20 },
        { header: 'Bag Size (kg) *', key: 'bagSize', width: 15 },
        { header: 'Warehouse *', key: 'warehouse', width: 20 },
        { header: 'Initial Quantity', key: 'initialQuantity', width: 18 },
        { header: 'Low Stock Alert', key: 'lowStockAlert', width: 18 }
    ];

    // Style header row
    itemsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    itemsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    itemsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add sample data rows
    itemsSheet.addRow({
        itemName: 'Premium Feed',
        category: 'finished_product',
        itemCategory: 'Premium Brand',
        bagSize: 25,
        warehouse: warehouses.length > 0 ? warehouses[0].name : 'Main Warehouse',
        initialQuantity: 100,
        lowStockAlert: 10
    });

    itemsSheet.addRow({
        itemName: 'Wheat Grain',
        category: 'raw_material',
        itemCategory: '',
        bagSize: 50,
        warehouse: warehouses.length > 0 ? warehouses[0].name : 'Main Warehouse',
        initialQuantity: 0,
        lowStockAlert: 20
    });

    // Add data validation for Category column
    itemsSheet.getColumn('category').eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber > 1) { // Skip header
            cell.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: ['"raw_material,finished_product,packaging"'],
                showErrorMessage: true,
                errorTitle: 'Invalid Category',
                error: 'Please select from: raw_material, finished_product, packaging'
            };
        }
    });

    // Add data validation for Warehouse column
    if (warehouses.length > 0) {
        const warehouseNames = warehouses.map(w => w.name).join(',');
        itemsSheet.getColumn('warehouse').eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: [`"${warehouseNames}"`],
                    showErrorMessage: true,
                    errorTitle: 'Invalid Warehouse',
                    error: 'Please select from available warehouses'
                };
            }
        });
    }

    // Sheet 2: Instructions
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.columns = [
        { header: 'Field', key: 'field', width: 20 },
        { header: 'Required', key: 'required', width: 12 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Example', key: 'example', width: 25 }
    ];

    // Style header
    instructionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    instructionsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' }
    };

    // Add instructions
    const instructions = [
        {
            field: 'Item Name',
            required: 'Yes',
            description: 'Name of the stock item. Must be at least 2 characters long.',
            example: 'Premium Feed, Wheat Grain'
        },
        {
            field: 'Category',
            required: 'Yes',
            description: 'Type of item. Must be one of: raw_material, finished_product, or packaging',
            example: 'finished_product'
        },
        {
            field: 'Item Category',
            required: 'No',
            description: 'Optional sub-category for grouping items (e.g., brand, quality level)',
            example: 'Premium Brand, Economy'
        },
        {
            field: 'Bag Size (kg)',
            required: 'Yes',
            description: 'Weight of one bag in kilograms. Must be greater than 0.',
            example: '25, 50, 100'
        },
        {
            field: 'Warehouse',
            required: 'Yes',
            description: 'Name of warehouse where initial quantity will be stored. Must match existing warehouse name exactly.',
            example: warehouses.length > 0 ? warehouses[0].name : 'Main Warehouse'
        },
        {
            field: 'Initial Quantity',
            required: 'No',
            description: 'Number of bags to add initially. Leave empty or 0 to add stock later. Must be 0 or greater.',
            example: '100, 0'
        },
        {
            field: 'Low Stock Alert',
            required: 'No',
            description: 'Quantity threshold for low stock alerts. Defaults to 10 if not specified.',
            example: '10, 20, 50'
        }
    ];

    instructions.forEach(instruction => {
        instructionsSheet.addRow(instruction);
    });

    // Add general notes
    instructionsSheet.addRow({});
    instructionsSheet.addRow({ field: 'IMPORTANT NOTES:', required: '', description: '', example: '' });
    instructionsSheet.getRow(instructionsSheet.rowCount).font = { bold: true, size: 12 };

    const notes = [
        '1. Items marked with * are required fields',
        '2. Each item will be created in ALL warehouses, but initial quantity goes only to the selected warehouse',
        '3. Other warehouses will receive 0 quantity initially',
        '4. Category values are case-sensitive and must match exactly',
        '5. Warehouse names must match existing warehouses exactly (case-sensitive)',
        '6. Delete the sample rows before uploading your data',
        '7. You can add as many rows as needed'
    ];

    notes.forEach(note => {
        instructionsSheet.addRow({ field: note, required: '', description: '', example: '' });
    });

    // Available warehouses list
    if (warehouses.length > 0) {
        instructionsSheet.addRow({});
        instructionsSheet.addRow({ field: 'AVAILABLE WAREHOUSES:', required: '', description: '', example: '' });
        instructionsSheet.getRow(instructionsSheet.rowCount).font = { bold: true, size: 12 };

        warehouses.forEach(warehouse => {
            instructionsSheet.addRow({ field: `• ${warehouse.name}`, required: '', description: '', example: '' });
        });
    }

    // Generate buffer and return as blob
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Parse Excel file and extract stock item data
 * @param {File} file - Excel file to parse
 * @returns {Promise<Array>} Array of parsed stock items
 */
export async function parseStockItemExcel(file) {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet('Stock Items');

    if (!worksheet) {
        throw new Error('Invalid template: "Stock Items" sheet not found');
    }

    const items = [];
    const headerRow = worksheet.getRow(1);

    // Validate headers
    const expectedHeaders = [
        'Item Name *',
        'Category *',
        'Item Category',
        'Bag Size (kg) *',
        'Warehouse *',
        'Initial Quantity',
        'Low Stock Alert'
    ];

    const actualHeaders = [];
    headerRow.eachCell((cell, colNumber) => {
        actualHeaders.push(cell.value?.toString().trim() || '');
    });

    // Check if headers match (allow for minor variations)
    const headersValid = expectedHeaders.every((header, index) => {
        const actual = actualHeaders[index] || '';
        return actual.toLowerCase().includes(header.toLowerCase().replace(' *', ''));
    });

    if (!headersValid) {
        throw new Error('Invalid template: Headers do not match expected format');
    }

    // Parse data rows (skip header and sample rows if they exist)
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        // Check if row has any data
        const hasData = row.values.some((cell, index) => {
            if (index === 0) return false; // Skip index 0 (Excel rows are 1-indexed)
            return cell !== null && cell !== undefined && cell !== '';
        });

        if (!hasData) return; // Skip empty rows

        const item = {
            rowNumber,
            itemName: row.getCell(1).value?.toString().trim() || '',
            category: row.getCell(2).value?.toString().trim() || '',
            itemCategory: row.getCell(3).value?.toString().trim() || '',
            bagSize: row.getCell(4).value || '',
            warehouse: row.getCell(5).value?.toString().trim() || '',
            initialQuantity: row.getCell(6).value || 0,
            lowStockAlert: row.getCell(7).value || 10
        };

        items.push(item);
    });

    return items;
}

/**
 * Validate a single stock item row
 * @param {Object} row - Stock item data
 * @param {Array} warehouses - Available warehouses
 * @returns {Object} Validation result { valid: boolean, errors: string[], warehouseId: string }
 */
export function validateStockItemRow(row, warehouses) {
    const errors = [];
    let warehouseId = null;

    // Validate Item Name
    if (!row.itemName || row.itemName.trim().length < 2) {
        errors.push('Item name must be at least 2 characters');
    }

    // Validate Category
    const validCategories = ['raw_material', 'finished_product', 'packaging'];
    if (!row.category || !validCategories.includes(row.category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Validate Bag Size
    const bagSize = parseFloat(row.bagSize);
    if (isNaN(bagSize) || bagSize <= 0) {
        errors.push('Bag size must be a number greater than 0');
    }

    // Validate Warehouse
    if (!row.warehouse) {
        errors.push('Warehouse is required');
    } else {
        const warehouse = warehouses.find(w => w.name === row.warehouse);
        if (!warehouse) {
            errors.push(`Warehouse "${row.warehouse}" not found. Available: ${warehouses.map(w => w.name).join(', ')}`);
        } else {
            warehouseId = warehouse._id;
        }
    }

    // Validate Initial Quantity (optional)
    if (row.initialQuantity !== '' && row.initialQuantity !== null && row.initialQuantity !== undefined) {
        const quantity = parseInt(row.initialQuantity);
        if (isNaN(quantity) || quantity < 0) {
            errors.push('Initial quantity must be 0 or greater');
        }
    }

    // Validate Low Stock Alert (optional)
    if (row.lowStockAlert !== '' && row.lowStockAlert !== null && row.lowStockAlert !== undefined) {
        const alert = parseInt(row.lowStockAlert);
        if (isNaN(alert) || alert < 0) {
            errors.push('Low stock alert must be 0 or greater');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warehouseId
    };
}

/**
 * Download blob as file
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
