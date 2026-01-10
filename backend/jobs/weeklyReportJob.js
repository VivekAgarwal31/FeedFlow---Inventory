import cron from 'node-cron';
import Company from '../models/Company.js';
import { sendWeeklyReportEmail } from '../services/weeklyReportService.js';

/**
 * Weekly report cron job
 * Runs every Monday at 9:00 AM IST
 * Cron expression: 0 9 * * 1 (minute hour day month weekday)
 * IST is UTC+5:30, so 9 AM IST = 3:30 AM UTC
 */
export const startWeeklyReportJob = () => {
    // Schedule for Monday 9 AM IST (3:30 AM UTC)
    const cronExpression = '30 3 * * 1';

    cron.schedule(cronExpression, async () => {
        console.log('📧 Starting weekly report job...');
        const startTime = Date.now();

        try {
            // Get all companies with Trial or Paid plans
            const companies = await Company.find({}).lean();

            let sentCount = 0;
            let skippedCount = 0;
            let failedCount = 0;

            for (const company of companies) {
                try {
                    const result = await sendWeeklyReportEmail(company._id);

                    if (result.success) {
                        sentCount++;
                        console.log(`✅ Sent weekly report to ${company.name} (${result.recipientCount} recipients)`);
                    } else {
                        skippedCount++;
                        console.log(`⏭️  Skipped ${company.name}: ${result.reason}`);
                    }

                    // Rate limiting: wait 1 second between companies
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    failedCount++;
                    console.error(`❌ Failed to send report to ${company.name}:`, error.message);
                }
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`📊 Weekly report job completed in ${duration}s`);
            console.log(`   Sent: ${sentCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);
        } catch (error) {
            console.error('❌ Weekly report job error:', error);
        }
    }, {
        timezone: 'Asia/Kolkata' // IST timezone
    });

    console.log('✅ Weekly report cron job scheduled (Every Monday 9 AM IST)');
};

/**
 * Manual trigger for testing
 */
export const triggerWeeklyReportsManually = async () => {
    console.log('🔧 Manually triggering weekly reports...');

    const companies = await Company.find({}).lean();
    const results = [];

    for (const company of companies) {
        try {
            const result = await sendWeeklyReportEmail(company._id);
            results.push({
                company: company.name,
                success: result.success,
                reason: result.reason,
                recipientCount: result.recipientCount
            });

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            results.push({
                company: company.name,
                success: false,
                error: error.message
            });
        }
    }

    return results;
};
