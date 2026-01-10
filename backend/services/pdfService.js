import PDFDocument from 'pdfkit';
import { formatDateRange } from '../utils/dateHelpers.js';

/**
 * Generate weekly report PDF for Paid users
 * @param {Object} reportData - Complete report data
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateWeeklyReportPDF = async (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('Stockwise', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(18).font('Helvetica').text('Weekly Inventory Summary', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(12).font('Helvetica').text(reportData.companyName, { align: 'center' });
            doc.fontSize(10).text(formatDateRange(reportData.weekStart, reportData.weekEnd), { align: 'center' });
            doc.moveDown(2);

            // Divider
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Key Metrics Section
            doc.fontSize(14).font('Helvetica-Bold').text('Key Metrics');
            doc.moveDown(0.5);

            const metrics = reportData.metrics;
            doc.fontSize(11).font('Helvetica');

            // Common metrics
            doc.text(`Total Products: ${metrics.totalProducts}`);
            doc.text(`Low Stock Items: ${metrics.lowStockItems}`);
            doc.text(`Out of Stock Items: ${metrics.outOfStockItems}`);
            doc.moveDown(0.5);

            // Mode-specific metrics
            if (reportData.deliveryMode === 'direct') {
                doc.text(`Direct Sales: ${metrics.directSalesCount}`);
                doc.text(`Direct Purchases: ${metrics.directPurchasesCount}`);
            } else {
                doc.text(`Sales Orders Created: ${metrics.salesOrdersCount}`);
                doc.text(`Purchase Orders Created: ${metrics.purchaseOrdersCount}`);
                doc.text(`Deliveries Out: ${metrics.deliveriesOutCount}`);
                doc.text(`Deliveries In: ${metrics.deliveriesInCount}`);
            }
            doc.text(`Stock Movements: ${metrics.stockMovementsCount}`);
            doc.moveDown(2);

            // Charts Section
            if (reportData.charts) {
                doc.fontSize(14).font('Helvetica-Bold').text('Activity Trends');
                doc.moveDown(1);

                if (reportData.deliveryMode === 'direct') {
                    // Sales chart
                    if (reportData.charts.salesChart) {
                        doc.image(reportData.charts.salesChart, {
                            fit: [500, 250],
                            align: 'center'
                        });
                        doc.moveDown(1);
                    }

                    // Purchases chart
                    if (reportData.charts.purchasesChart) {
                        doc.image(reportData.charts.purchasesChart, {
                            fit: [500, 250],
                            align: 'center'
                        });
                        doc.moveDown(1);
                    }
                } else {
                    // Deliveries Out chart
                    if (reportData.charts.deliveriesOutChart) {
                        doc.image(reportData.charts.deliveriesOutChart, {
                            fit: [500, 250],
                            align: 'center'
                        });
                        doc.moveDown(1);
                    }

                    // Deliveries In chart
                    if (reportData.charts.deliveriesInChart) {
                        doc.image(reportData.charts.deliveriesInChart, {
                            fit: [500, 250],
                            align: 'center'
                        });
                        doc.moveDown(1);
                    }
                }
            }

            // Insights Section
            if (reportData.insights && reportData.insights.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('Insights & Highlights');
                doc.moveDown(0.5);

                doc.fontSize(11).font('Helvetica');
                reportData.insights.forEach((insight, index) => {
                    doc.text(`${index + 1}. ${insight}`);
                    doc.moveDown(0.3);
                });
                doc.moveDown(1);
            }

            // Footer
            doc.fontSize(8).font('Helvetica').fillColor('#666666');
            const footerY = doc.page.height - 50;
            doc.text(
                `Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`,
                50,
                footerY,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
