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
        let dailyData1, dailyData2;

        if (company.deliveryMode === 'direct') {
            modeMetrics = await getDirectModeMetrics(companyId, startDate, endDate);
            dailyData1 = await getDailySalesData(companyId, startDate, endDate);
            dailyData2 = await getDailyPurchasesData(companyId, startDate, endDate);
        } else {
            modeMetrics = await getOrderModeMetrics(companyId, startDate, endDate);
            dailyData1 = await getDailyDeliveriesOutData(companyId, startDate, endDate);
            dailyData2 = await getDailyDeliveriesInData(companyId, startDate, endDate);
        }

        // Combine metrics
        const metrics = { ...commonMetrics, ...modeMetrics };

        // Generate insights
        const insights = await generateInsights(companyId, metrics, company.deliveryMode, startDate, endDate);

        return {
            company,
            weekStart: startDate,
            weekEnd: endDate,
            metrics,
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

        // Build mode-specific metrics HTML
        let modeMetricsHtml = '';
        if (reportData.deliveryMode === 'direct') {
            modeMetricsHtml = `
                <div class="metric-row">
                    <span class="metric-label">Direct Sales</span>
                    <span class="metric-value">${reportData.metrics.directSalesCount}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Direct Purchases</span>
                    <span class="metric-value">${reportData.metrics.directPurchasesCount}</span>
                </div>
            `;
        } else {
            modeMetricsHtml = `
                <div class="metric-row">
                    <span class="metric-label">Sales Orders Created</span>
                    <span class="metric-value">${reportData.metrics.salesOrdersCount}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Purchase Orders Created</span>
                    <span class="metric-value">${reportData.metrics.purchaseOrdersCount}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Deliveries Out</span>
                    <span class="metric-value">${reportData.metrics.deliveriesOutCount}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Deliveries In</span>
                    <span class="metric-value">${reportData.metrics.deliveriesInCount}</span>
                </div>
            `;
        }

        // Build charts section (if available)
        let chartsHtml = '';
        if (charts) {
            chartsHtml = '<div class="chart-section"><div class="section-title">Activity Trends</div>';
            // Charts will be embedded as attachments with CID
            if (reportData.deliveryMode === 'direct') {
                chartsHtml += '<img src="cid:salesChart" class="chart-image" alt="Daily Sales" />';
                chartsHtml += '<img src="cid:purchasesChart" class="chart-image" alt="Daily Purchases" />';
            } else {
                chartsHtml += '<img src="cid:deliveriesOutChart" class="chart-image" alt="Daily Deliveries Out" />';
                chartsHtml += '<img src="cid:deliveriesInChart" class="chart-image" alt="Daily Deliveries In" />';
            }
            chartsHtml += '</div>';
        }

        // Build insights section
        let insightsHtml = '';
        if (reportData.insights.length > 0) {
            insightsHtml = '<div class="insights-section"><div class="section-title">Insights & Highlights</div>';
            reportData.insights.forEach((insight, index) => {
                insightsHtml += `<div class="insight-item">${index + 1}. ${insight}</div>`;
            });
            insightsHtml += '</div>';
        }

        // Build upgrade section (Trial users only)
        let upgradeHtml = '';
        if (!isPaid) {
            upgradeHtml = `
                <div class="upgrade-section">
                    <div class="upgrade-text">
                        Unlock detailed reports, backups, and advanced insights by upgrading your plan.
                    </div>
                    <a href="${FRONTEND_URL}/settings" class="upgrade-button">Upgrade Now</a>
                </div>
            `;
        }

        // Replace template variables
        htmlTemplate = htmlTemplate
            .replace(/{{COMPANY_NAME}}/g, reportData.company.name)
            .replace(/{{DATE_RANGE}}/g, formatDateRange(reportData.weekStart, reportData.weekEnd))
            .replace(/{{TOTAL_PRODUCTS}}/g, reportData.metrics.totalProducts)
            .replace(/{{LOW_STOCK_ITEMS}}/g, reportData.metrics.lowStockItems)
            .replace(/{{OUT_OF_STOCK_ITEMS}}/g, reportData.metrics.outOfStockItems)
            .replace(/{{STOCK_MOVEMENTS}}/g, reportData.metrics.stockMovementsCount)
            .replace(/{{MODE_SPECIFIC_METRICS}}/g, modeMetricsHtml)
            .replace(/{{CHARTS_SECTION}}/g, chartsHtml)
            .replace(/{{INSIGHTS_SECTION}}/g, insightsHtml)
            .replace(/{{UPGRADE_SECTION}}/g, upgradeHtml)
            .replace(/{{DASHBOARD_URL}}/g, `${FRONTEND_URL}/reports`);

        // Prepare email attachments
        const attachments = [];

        // Add charts as inline attachments
        if (charts) {
            if (reportData.deliveryMode === 'direct') {
                attachments.push({
                    filename: 'sales-chart.png',
                    content: charts.salesChart,
                    cid: 'salesChart'
                });
                attachments.push({
                    filename: 'purchases-chart.png',
                    content: charts.purchasesChart,
                    cid: 'purchasesChart'
                });
            } else {
                attachments.push({
                    filename: 'deliveries-out-chart.png',
                    content: charts.deliveriesOutChart,
                    cid: 'deliveriesOutChart'
                });
                attachments.push({
                    filename: 'deliveries-in-chart.png',
                    content: charts.deliveriesInChart,
                    cid: 'deliveriesInChart'
                });
            }
        }

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
