import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';

// Export client transactions to Excel
export const exportClientToExcel = async (clientName, transactions, dateRange) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Client Transactions');

  // Set up header
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Reference', key: 'reference', width: 15 },
    { header: 'Item Name', key: 'itemName', width: 25 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit Price', key: 'unitPrice', width: 15 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '366092' }
  };

  // Add title rows
  worksheet.insertRow(1, [`Client Transaction Report - ${clientName}`]);
  worksheet.insertRow(2, [`Date Range: ${dateRange.from} to ${dateRange.to}`]);
  worksheet.insertRow(3, ['']);
  
  // Style title
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 16 };
  worksheet.mergeCells('A1:G1');

  const dateRow = worksheet.getRow(2);
  dateRow.font = { italic: true };
  worksheet.mergeCells('A2:G2');

  // Add data
  transactions.forEach(transaction => {
    worksheet.addRow({
      date: formatDate(transaction.createdAt),
      reference: transaction.reference || transaction._id?.slice(-6) || 'N/A',
      itemName: transaction.itemName || 'N/A',
      quantity: transaction.quantity || 0,
      unitPrice: formatCurrency(transaction.unitPrice || 0),
      totalAmount: formatCurrency(transaction.totalAmount || 0),
      notes: transaction.notes || ''
    });
  });

  // Add totals row
  const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalRow = worksheet.addRow({
    date: '',
    reference: '',
    itemName: '',
    quantity: '',
    unitPrice: 'TOTAL:',
    totalAmount: formatCurrency(totalAmount),
    notes: ''
  });
  totalRow.font = { bold: true };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.header !== 'Notes') {
      column.width = Math.max(column.width, 12);
    }
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${clientName}_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Export client transactions to PDF
export const exportClientToPDF = (clientName, transactions, dateRange) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(`Client Transaction Report`, 20, 20);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text(`Client: ${clientName}`, 20, 30);
  doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 20, 40);

  // Prepare data for table
  const tableData = transactions.map(transaction => [
    formatDate(transaction.createdAt),
    transaction.reference || transaction._id?.slice(-6) || 'N/A',
    transaction.itemName || 'N/A',
    transaction.quantity || 0,
    formatCurrency(transaction.unitPrice || 0),
    formatCurrency(transaction.totalAmount || 0)
  ]);

  // Add total row
  const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  tableData.push(['', '', '', '', 'TOTAL:', formatCurrency(totalAmount)]);

  // Create table
  doc.autoTable({
    head: [['Date', 'Reference', 'Item Name', 'Quantity', 'Unit Price', 'Total Amount']],
    body: tableData,
    startY: 50,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [54, 96, 146],
      textColor: 255,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 240, 240],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249]
    }
  });

  // Download
  doc.save(`${clientName}_transactions_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export supplier transactions to Excel
export const exportSupplierToExcel = async (supplierName, transactions, dateRange) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Supplier Transactions');

  // Set up header
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Reference', key: 'reference', width: 15 },
    { header: 'Item Name', key: 'itemName', width: 25 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit Cost', key: 'unitCost', width: 15 },
    { header: 'Total Cost', key: 'totalCost', width: 15 },
    { header: 'Notes', key: 'notes', width: 30 }
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '366092' }
  };

  // Add title rows
  worksheet.insertRow(1, [`Supplier Transaction Report - ${supplierName}`]);
  worksheet.insertRow(2, [`Date Range: ${dateRange.from} to ${dateRange.to}`]);
  worksheet.insertRow(3, ['']);
  
  // Style title
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 16 };
  worksheet.mergeCells('A1:G1');

  const dateRow = worksheet.getRow(2);
  dateRow.font = { italic: true };
  worksheet.mergeCells('A2:G2');

  // Add data
  transactions.forEach(transaction => {
    worksheet.addRow({
      date: formatDate(transaction.createdAt),
      reference: transaction.reference || transaction._id?.slice(-6) || 'N/A',
      itemName: transaction.itemName || 'N/A',
      quantity: transaction.quantity || 0,
      unitCost: formatCurrency(transaction.unitCost || transaction.unitPrice || 0),
      totalCost: formatCurrency(transaction.totalCost || transaction.totalAmount || 0),
      notes: transaction.notes || ''
    });
  });

  // Add totals row
  const totalCost = transactions.reduce((sum, t) => sum + (t.totalCost || t.totalAmount || 0), 0);
  const totalRow = worksheet.addRow({
    date: '',
    reference: '',
    itemName: '',
    quantity: '',
    unitCost: 'TOTAL:',
    totalCost: formatCurrency(totalCost),
    notes: ''
  });
  totalRow.font = { bold: true };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.header !== 'Notes') {
      column.width = Math.max(column.width, 12);
    }
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${supplierName}_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Export supplier transactions to PDF
export const exportSupplierToPDF = (supplierName, transactions, dateRange) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(`Supplier Transaction Report`, 20, 20);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text(`Supplier: ${supplierName}`, 20, 30);
  doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, 20, 40);

  // Prepare data for table
  const tableData = transactions.map(transaction => [
    formatDate(transaction.createdAt),
    transaction.reference || transaction._id?.slice(-6) || 'N/A',
    transaction.itemName || 'N/A',
    transaction.quantity || 0,
    formatCurrency(transaction.unitCost || transaction.unitPrice || 0),
    formatCurrency(transaction.totalCost || transaction.totalAmount || 0)
  ]);

  // Add total row
  const totalCost = transactions.reduce((sum, t) => sum + (t.totalCost || t.totalAmount || 0), 0);
  tableData.push(['', '', '', '', 'TOTAL:', formatCurrency(totalCost)]);

  // Create table
  doc.autoTable({
    head: [['Date', 'Reference', 'Item Name', 'Quantity', 'Unit Cost', 'Total Cost']],
    body: tableData,
    startY: 50,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [54, 96, 146],
      textColor: 255,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 240, 240],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249]
    }
  });

  // Download
  doc.save(`${supplierName}_transactions_${new Date().toISOString().split('T')[0]}.pdf`);
};
