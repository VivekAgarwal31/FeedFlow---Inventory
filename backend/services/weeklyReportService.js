import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Company from '../models/Company.js';
import User from '../models/User.js';
import WeeklyReportLog from '../models/WeeklyReportLog.js';
import { getUserPlanFeatures } from '../utils/subscriptionHelpers.js';
import {
    getLastWeekRange,
    formatDateRange,
    formatDateForFilename
} from '../utils/dateHelpers.js';
import {
    getDirectModeMetrics,
    getOrderModeMetrics,
    getCommonMetrics,
    getTotalInventoryQuantity,
    getWarehouseBreakdown,
    getTopSellingItemsDirect,
    getTopSellingItemsOrder,
    getLeastSellingItems,
    getDailySalesData,
    getDailyPurchasesData,
    getDailyDeliveriesOutData,
    getDailyDeliveriesInData,
    generateInsights,
    hasWeeklyActivity
} from '../utils/reportMetrics.js';
import {
    generateDirectModeCharts,
    generateOrderModeCharts
} from './chartService.js';
import { generateWeeklyReportPDF } from './pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization for Resend
let resend = null;
function getResend() {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Generate weekly report for a company
 */
export const generateWeeklyReport = async (companyId) => {
    try {
        // Get company
        const company = await Company.findById(companyId).lean();
        if (!company) {
            throw new Error('Company not found');
        }

        // Get week range
        const { startDate, endDate } = getLastWeekRange();

        // Check if company has activity
        const hasActivity = await hasWeeklyActivity(companyId, company.deliveryMode, startDate, endDate);
        if (!hasActivity) {
            console.log(`No activity for company ${company.name}, skipping report`);
            return null;
        }

        // Get common metrics
        const commonMetrics = await getCommonMetrics(companyId);

        // Get mode-specific metrics
        let modeMetrics;
        if (company.deliveryMode === 'direct') {
            modeMetrics = await getDirectModeMetrics(companyId, startDate, endDate);
        } else {
            modeMetrics = await getOrderModeMetrics(companyId, startDate, endDate);
        }

        // Get daily data for charts
        let dailyData1, dailyData2;
        if (company.deliveryMode === 'direct') {
            [dailyData1, dailyData2] = await Promise.all([
                getDailySalesData(companyId, startDate, endDate),
                getDailyPurchasesData(companyId, startDate, endDate)
            ]);
        } else {
            [dailyData1, dailyData2] = await Promise.all([
                getDailyDeliveriesOutData(companyId, startDate, endDate),
                getDailyDeliveriesInData(companyId, startDate, endDate)
            ]);
        }

        // Combine metrics
        const metrics = { ...commonMetrics, ...modeMetrics };

        // Get enhanced metrics
        const [totalInventoryQty, warehouseBreakdown, topItems, leastItems] = await Promise.all([
            getTotalInventoryQuantity(companyId),
            getWarehouseBreakdown(companyId),
            company.deliveryMode === 'direct'
                ? getTopSellingItemsDirect(companyId, startDate, endDate, 3)
                : getTopSellingItemsOrder(companyId, startDate, endDate, 3),
            getLeastSellingItems(companyId, startDate, endDate, 3)
        ]);

        // Generate insights
        const insights = await generateInsights(companyId, metrics, company.deliveryMode, startDate, endDate);

        return {
            company: {
                name: company.name,
                _id: company._id
            },
            weekStart: startDate,
            weekEnd: endDate,
            metrics,
            totalInventoryQty,
            warehouseBreakdown,
            topSellingItems: topItems,
            leastSellingItems: leastItems,
            insights,
            dailyData1,
            dailyData2,
            deliveryMode: company.deliveryMode
        };
    } catch (error) {
        console.error('Error generating weekly report:', error);
        throw error;
    }
};

/**
 * Send weekly report email to company recipients
 */
export const sendWeeklyReportEmail = async (companyId) => {
    try {
        // Generate report data
        const reportData = await generateWeeklyReport(companyId);
        if (!reportData) {
            return { success: false, reason: 'No activity' };
        }

        // Get recipients (Owner + Admins)
        const recipients = await User.find({
            companyId,
            role: { $in: ['owner', 'admin'] },
            isActive: true
        }).lean();

        if (recipients.length === 0) {
            return { success: false, reason: 'No recipients' };
        }

        // Determine if company is Trial or Paid
        const ownerUser = recipients.find(r => r.role === 'owner');
        const planFeatures = await getUserPlanFeatures(ownerUser._id);
        const isPaid = planFeatures.backupAccess === true; // Backup is Paid-only

        // Generate charts (for Paid users or optionally for Trial)
        let charts = null;
        if (isPaid) {
            if (reportData.deliveryMode === 'direct') {
                charts = await generateDirectModeCharts(reportData.dailyData1, reportData.dailyData2);
            } else {
                charts = await generateOrderModeCharts(reportData.dailyData1, reportData.dailyData2);
            }
        }

        // Generate PDF (Paid users only)
        let pdfBuffer = null;
        if (isPaid && charts) {
            pdfBuffer = await generateWeeklyReportPDF({
                ...reportData,
                charts,
                companyName: reportData.company.name
            });
        }

        // Load email template
        const templatePath = path.join(__dirname, '../templates/emails/weeklyReport.html');
        let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

        // Build Weekly Activity Section (mode-specific metrics in grid)
        let activityHtml = '';
        if (reportData.deliveryMode === 'direct') {
            activityHtml = `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Weekly Activity</h3>
                        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Direct Sales</div>
                                    <div style="color:#4caf50;font-size:24px;font-weight:700;">${reportData.metrics.directSalesCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Direct Purchases</div>
                                    <div style="color:#9c27b0;font-size:24px;font-weight:700;">${reportData.metrics.directPurchasesCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Stock Movements</div>
                                    <div style="color:#2196f3;font-size:24px;font-weight:700;">${reportData.metrics.stockMovementsCount}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            `;
        } else {
            activityHtml = `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Weekly Activity</h3>
                        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Sales Orders</div>
                                    <div style="color:#4caf50;font-size:24px;font-weight:700;">${reportData.metrics.salesOrdersCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Purchase Orders</div>
                                    <div style="color:#9c27b0;font-size:24px;font-weight:700;">${reportData.metrics.purchaseOrdersCount}</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Deliveries Out</div>
                                    <div style="color:#2196f3;font-size:24px;font-weight:700;">${reportData.metrics.deliveriesOutCount}</div>
                                </td>
                                <td style="border:1px solid #eee;font-size:13px;text-align:center;padding:15px 10px;">
                                    <div style="color:#666;font-size:11px;margin-bottom:6px;">Deliveries In</div>
                                    <div style="color:#00bcd4;font-size:24px;font-weight:700;">${reportData.metrics.deliveriesInCount}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            `;
        }

        // Build Quick Stats Section (enhanced with new metrics)
        let quickStatsHtml = `
            <tr>
                <td style="padding:0 20px 20px;">
                    <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Inventory Summary</h3>
                    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border:1px solid #eee;border-radius:4px;">
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;border-bottom:1px solid #eee;">
                                <strong style="color:#111;">Total Inventory:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #eee;">
                                ${reportData.totalInventoryQty} units across all warehouses
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;border-bottom:1px solid #eee;">
                                <strong style="color:#111;">Stock Health:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #eee;">
                                ${reportData.metrics.totalProducts - reportData.metrics.outOfStockItems - reportData.metrics.lowStockItems} items in good stock
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;border-bottom:1px solid #eee;">
                                <strong style="color:#111;">Attention Needed:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #eee;">
                                ${reportData.metrics.lowStockItems + reportData.metrics.outOfStockItems} items need restocking
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px;font-size:13px;color:#666;">
                                <strong style="color:#111;">Weekly Transactions:</strong>
                            </td>
                            <td style="padding:10px;font-size:13px;color:#333;text-align:right;">
                                ${reportData.metrics.stockMovementsCount} movements this week
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        `;

        // Add Warehouse Breakdown if available
        if (reportData.warehouseBreakdown && reportData.warehouseBreakdown.length > 0) {
            quickStatsHtml += `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">Warehouse Breakdown</h3>
                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border:1px solid #eee;border-radius:4px;">
            `;

            reportData.warehouseBreakdown.forEach((wh, index) => {
                const borderStyle = index < reportData.warehouseBreakdown.length - 1 ? 'border-bottom:1px solid #eee;' : '';
                quickStatsHtml += `
                    <tr>
                        <td style="padding:10px;font-size:13px;color:#666;${borderStyle}">
                            <strong style="color:#111;">${wh.warehouseName}:</strong>
                        </td>
                        <td style="padding:10px;font-size:13px;color:#333;text-align:right;${borderStyle}">
                            ${wh.itemCount} items (${wh.totalQuantity} units)
                        </td>
                    </tr>
                `;
            });

            quickStatsHtml += `
                        </table>
                    </td>
                </tr>
            `;
        }

        // Add Top Selling Items
        if (reportData.topSellingItems && reportData.topSellingItems.length > 0) {
            quickStatsHtml += `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">🔥 Top Selling Items</h3>
                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#e8f5e9;border:1px solid #4caf50;border-radius:4px;">
            `;

            reportData.topSellingItems.forEach((item, index) => {
                const borderStyle = index < reportData.topSellingItems.length - 1 ? 'border-bottom:1px solid #c8e6c9;' : '';
                quickStatsHtml += `
                    <tr>
                        <td style="padding:10px;font-size:13px;color:#2e7d32;${borderStyle}">
                            <strong>${index + 1}. ${item.name}</strong>
                        </td>
                        <td style="padding:10px;font-size:13px;color:#2e7d32;text-align:right;${borderStyle}">
                            ${item.quantity} units sold
                        </td>
                    </tr>
                `;
            });

            quickStatsHtml += `
                        </table>
                    </td>
                </tr>
            `;
        }

        // Add Least Selling Items (Slow Movers)
        if (reportData.leastSellingItems && reportData.leastSellingItems.length > 0) {
            quickStatsHtml += `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 12px;font-size:15px;color:#111;">📦 Slow Movers (No Sales This Week)</h3>
                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#fff3e0;border:1px solid #ff9800;border-radius:4px;">
            `;

            reportData.leastSellingItems.forEach((item, index) => {
                const borderStyle = index < reportData.leastSellingItems.length - 1 ? 'border-bottom:1px solid #ffe0b2;' : '';
                quickStatsHtml += `
                    <tr>
                        <td style="padding:10px;font-size:13px;color:#e65100;${borderStyle}">
                            ${item.name}
                        </td>
                        <td style="padding:10px;font-size:13px;color:#e65100;text-align:right;${borderStyle}">
                            ${item.quantity} units in stock
                        </td>
                    </tr>
                `;
            });

            quickStatsHtml += `
                        </table>
                    </td>
                </tr>
            `;
        }

        // Charts removed - not included in email template

        // Build insights section
        let insightsHtml = '';
        if (reportData.insights.length > 0) {
            insightsHtml = `
                <tr>
                    <td style="padding:0 20px 20px;">
                        <h3 style="margin:0 0 10px;font-size:15px;color:#111;">Highlights</h3>
                        <ul style="padding-left:20px;margin:0;color:#333;font-size:14px;line-height:1.8;">
            `;
            reportData.insights.forEach(insight => {
                insightsHtml += `<li style="margin:6px 0;">${insight}</li>`;
            });
            insightsHtml += `
                        </ul>
                    </td>
                </tr>
            `;
        }

        // Build upgrade section (Trial users only)
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        let upgradeHtml = '';
        if (!isPaid) {
            upgradeHtml = `
                <tr>
                    <td style="padding:20px;background:#f9fafb;border-top:1px solid #eee;">
                        <p style="margin:0 0 10px;font-size:14px;color:#333;">
                            Unlock detailed reports, backups, and advanced insights by upgrading your plan.
                        </p>
                        <a href="${FRONTEND_URL}/settings"
                           style="color:#4a7cff;font-size:14px;font-weight:bold;text-decoration:none;">
                            Upgrade Now →
                        </a>
                    </td>
                </tr>
            `;
        }

        // Replace template variables
        htmlTemplate = htmlTemplate
            .replace(/{{COMPANY_NAME}}/g, reportData.company.name)
            .replace(/{{DATE_RANGE}}/g, formatDateRange(reportData.weekStart, reportData.weekEnd))
            .replace(/{{TOTAL_PRODUCTS}}/g, reportData.metrics.totalProducts)
            .replace(/{{LOW_STOCK_ITEMS}}/g, reportData.metrics.lowStockItems)
            .replace(/{{OUT_OF_STOCK_ITEMS}}/g, reportData.metrics.outOfStockItems)
            .replace(/{{ACTIVITY_SECTION}}/g, activityHtml)
            .replace(/{{QUICK_STATS}}/g, quickStatsHtml)
            .replace(/{{INSIGHTS_SECTION}}/g, insightsHtml)
            .replace(/{{UPGRADE_SECTION}}/g, upgradeHtml)
            .replace(/{{DASHBOARD_URL}}/g, `${FRONTEND_URL}/reports`);

        // Prepare email attachments
        const attachments = [];

        // Charts are now embedded as base64 data URLs in the HTML

        // Add PDF attachment (Paid users only)
        if (pdfBuffer) {
            const dateRange = `${formatDateForFilename(reportData.weekStart)}_${formatDateForFilename(reportData.weekEnd)}`;
            attachments.push({
                filename: `Stockwise_Weekly_Report_${reportData.company.name.replace(/\s+/g, '_')}_${dateRange}.pdf`,
                content: pdfBuffer
            });
        }

        // Send emails to all recipients
        const emailPromises = recipients.map(recipient =>
            getResend().emails.send({
                from: 'Stockwise Reports <reports@stock-wise.in>',
                to: recipient.email,
                replyTo: 'support@stock-wise.in',
                subject: `Weekly inventory summary – ${reportData.company.name}`,
                html: htmlTemplate,
                attachments: attachments.length > 0 ? attachments : undefined
            })
        );

        await Promise.all(emailPromises);

        // Log the report
        await WeeklyReportLog.create({
            companyId,
            weekStartDate: reportData.weekStart,
            weekEndDate: reportData.weekEnd,
            recipients: recipients.map(r => ({
                userId: r._id,
                email: r.email,
                role: r.role
            })),
            metrics: reportData.metrics,
            deliveryMode: reportData.deliveryMode,
            status: 'sent',
            pdfGenerated: !!pdfBuffer
        });

        return {
            success: true,
            recipientCount: recipients.length
        };
    } catch (error) {
        console.error('Error sending weekly report:', error);

        // Log failure
        try {
            await WeeklyReportLog.create({
                companyId,
                weekStartDate: reportData?.weekStart || new Date(),
                weekEndDate: reportData?.weekEnd || new Date(),
                status: 'failed',
                errorMessage: error.message
            });
        } catch (logError) {
            console.error('Error logging failed report:', logError);
        }

        throw error;
    }
};
