import ExcelJS from 'exceljs';

/**
 * Parse CSV file buffer to JSON
 * @param {Buffer} fileBuffer - CSV file buffer
 * @returns {Array} Parsed data
 */
export const parseCSV = (fileBuffer) => {
    const csvString = fileBuffer.toString('utf-8');
    const lines = csvString.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue; // Skip empty lines

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }

    return data;
};

/**
 * Parse a single CSV line handling quoted values
 * @param {String} line - CSV line
 * @returns {Array} Parsed values
 */
const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of value
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add last value
    values.push(current.trim());

    return values;
};

/**
 * Parse Excel file buffer to JSON
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {String} sheetName - Sheet name (optional, uses first sheet if not provided)
 * @returns {Promise<Array>} Parsed data
 */
export const parseExcel = async (fileBuffer, sheetName = null) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    // Get worksheet
    const worksheet = sheetName
        ? workbook.getWorksheet(sheetName)
        : workbook.worksheets[0];

    if (!worksheet) {
        throw new Error('Worksheet not found');
    }

    const data = [];
    let headers = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            // Header row
            headers = row.values.slice(1); // Remove first empty element
        } else {
            // Data row
            const rowData = {};
            row.values.slice(1).forEach((value, index) => {
                const header = headers[index];
                if (header) {
                    rowData[header] = value !== null && value !== undefined ? String(value).trim() : '';
                }
            });

            // Only add non-empty rows
            if (Object.values(rowData).some(v => v !== '')) {
                data.push(rowData);
            }
        }
    });

    return data;
};

/**
 * Validation schemas for each entity type
 */
const VALIDATION_SCHEMAS = {
    stockItems: {
        required: ['Item Name', 'Bag Size (kg)', 'Warehouse'],
        types: {
            'Bag Size (kg)': 'number',
            'Quantity': 'number',
            'Cost Price': 'number',
            'Selling Price': 'number',
            'Low Stock Alert': 'number'
        },
        enums: {
            'Category': ['raw_material', 'finished_product', 'packaging']
        }
    },
    sales: {
        required: ['Client Name', 'Total Amount', 'Staff Name'],
        types: {
            'Total Amount': 'number'
        },
        enums: {
            'Payment Status': ['paid', 'pending', 'partial'],
            'Payment Method': ['cash', 'card', 'upi', 'bank_transfer', 'cheque']
        }
    },
    purchases: {
        required: ['Supplier Name', 'Total Amount', 'Staff Name'],
        types: {
            'Total Amount': 'number'
        },
        enums: {
            'Payment Status': ['paid', 'pending', 'partial'],
            'Payment Method': ['cash', 'card', 'upi', 'bank_transfer', 'cheque']
        }
    },
    clients: {
        required: ['Name'],
        types: {
            'Total Purchases': 'number',
            'Total Revenue': 'number',
            'Sales Count': 'number'
        }
    },
    suppliers: {
        required: ['Name'],
        types: {
            'Total Purchases': 'number',
            'Purchase Count': 'number'
        }
    },
    warehouses: {
        required: ['Name', 'Location'],
        types: {
            'Capacity': 'number'
        }
    },
    stockTransactions: {
        required: ['Transaction Type', 'Item Name', 'Warehouse', 'Quantity', 'Staff Name'],
        types: {
            'Quantity': 'number'
        },
        enums: {
            'Transaction Type': ['stock_in', 'stock_out', 'stock_move', 'stock_adjust', 'purchase', 'sale']
        }
    }
};

/**
 * Validate imported data against schema
 * @param {Array} data - Imported data
 * @param {String} entityType - Entity type
 * @returns {Object} Validation result { valid: boolean, errors: [] }
 */
export const validateImportData = (data, entityType) => {
    const schema = VALIDATION_SCHEMAS[entityType];

    if (!schema) {
        throw new Error(`No validation schema for entity type: ${entityType}`);
    }

    const errors = [];

    data.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because index is 0-based and header is row 1

        // Check required fields
        schema.required.forEach(field => {
            if (!row[field] || String(row[field]).trim() === '') {
                errors.push({
                    row: rowNumber,
                    field,
                    error: 'Required field is missing or empty'
                });
            }
        });

        // Check data types
        if (schema.types) {
            Object.entries(schema.types).forEach(([field, type]) => {
                const value = row[field];
                if (value && value !== '') {
                    if (type === 'number' && isNaN(Number(value))) {
                        errors.push({
                            row: rowNumber,
                            field,
                            error: `Must be a valid number, got: ${value}`
                        });
                    }
                }
            });
        }

        // Check enum values
        if (schema.enums) {
            Object.entries(schema.enums).forEach(([field, allowedValues]) => {
                const value = row[field];
                if (value && value !== '' && !allowedValues.includes(value)) {
                    errors.push({
                        row: rowNumber,
                        field,
                        error: `Invalid value "${value}". Allowed values: ${allowedValues.join(', ')}`
                    });
                }
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        rowCount: data.length
    };
};

/**
 * Map imported data headers to database field names
 * @param {Array} data - Imported data with display headers
 * @param {String} entityType - Entity type
 * @returns {Array} Data with database field names
 */
export const mapImportHeaders = (data, entityType) => {
    const headerMap = {
        stockItems: {
            'Item Name': 'itemName',
            'Category': 'category',
            'Item Category': 'itemCategory',
            'Bag Size (kg)': 'bagSize',
            'Quantity': 'quantity',
            'Cost Price': 'costPrice',
            'Selling Price': 'sellingPrice',
            'Low Stock Alert': 'lowStockAlert',
            'Warehouse': 'warehouseName'
        },
        sales: {
            'Client Name': 'clientName',
            'Client Phone': 'clientPhone',
            'Client Email': 'clientEmail',
            'Total Amount': 'totalAmount',
            'Payment Status': 'paymentStatus',
            'Payment Method': 'paymentMethod',
            'Staff Name': 'staffName',
            'Sale Date': 'saleDate',
            'Notes': 'notes'
        },
        purchases: {
            'Supplier Name': 'supplierName',
            'Invoice Number': 'invoiceNumber',
            'Total Amount': 'totalAmount',
            'Payment Status': 'paymentStatus',
            'Payment Method': 'paymentMethod',
            'Staff Name': 'staffName',
            'Purchase Date': 'purchaseDate',
            'Notes': 'notes'
        },
        clients: {
            'Name': 'name',
            'Phone': 'phone',
            'Email': 'email',
            'Address': 'address',
            'GST Number': 'gstNumber',
            'Total Purchases': 'totalPurchases',
            'Total Revenue': 'totalRevenue',
            'Sales Count': 'salesCount',
            'Notes': 'notes'
        },
        suppliers: {
            'Name': 'name',
            'Contact Person': 'contactPerson',
            'Phone': 'phone',
            'Email': 'email',
            'Address': 'address',
            'GST Number': 'gstNumber',
            'PAN Number': 'panNumber',
            'Payment Terms': 'paymentTerms',
            'Total Purchases': 'totalPurchases',
            'Purchase Count': 'purchaseCount',
            'Notes': 'notes'
        },
        warehouses: {
            'Name': 'name',
            'Location': 'location',
            'Capacity': 'capacity',
            'Description': 'description'
        },
        stockTransactions: {
            'Transaction Type': 'type',
            'Item Name': 'itemName',
            'Warehouse': 'warehouseName',
            'To Warehouse': 'toWarehouseName',
            'Quantity': 'quantity',
            'Reason': 'reason',
            'Staff Name': 'staffName',
            'Transaction Date': 'transactionDate',
            'Notes': 'notes'
        }
    };

    const map = headerMap[entityType];
    if (!map) {
        throw new Error(`No header mapping for entity type: ${entityType}`);
    }

    return data.map(row => {
        const mappedRow = {};
        Object.entries(row).forEach(([displayHeader, value]) => {
            const dbField = map[displayHeader];
            if (dbField) {
                mappedRow[dbField] = value;
            }
        });
        return mappedRow;
    });
};

/**
 * Import data with transaction support
 * @param {Array} data - Validated and mapped data
 * @param {Model} model - Mongoose model
 * @param {String} companyId - Company ID
 * @param {Object} additionalFields - Additional fields to add to each record
 * @returns {Promise<Object>} Import result
 */
export const importWithTransaction = async (data, model, companyId, additionalFields = {}) => {
    const session = await model.db.startSession();
    session.startTransaction();

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            try {
                const record = {
                    ...data[i],
                    companyId,
                    ...additionalFields
                };

                // Convert numeric strings to numbers
                Object.keys(record).forEach(key => {
                    if (record[key] && !isNaN(record[key]) && typeof record[key] === 'string') {
                        const num = Number(record[key]);
                        if (!isNaN(num)) {
                            record[key] = num;
                        }
                    }
                });

                await model.create([record], { session });
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    error: error.message
                });
            }
        }

        await session.commitTransaction();
        return results;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
