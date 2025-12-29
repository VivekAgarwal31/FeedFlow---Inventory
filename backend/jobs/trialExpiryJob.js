import cron from 'node-cron';
import Plan from '../models/Plan.js';
import UserSubscription from '../models/UserSubscription.js';

/**
 * Background job to check and downgrade expired trials
 * Runs daily at 2:00 AM
 */
export const startTrialExpiryJob = () => {
    // Run every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('[Trial Expiry Job] Starting trial expiry check...');

        try {
            // Get free plan
            const freePlan = await Plan.getByType('free');

            if (!freePlan) {
                console.error('[Trial Expiry Job] Free plan not found, cannot downgrade trials');
                return;
            }

            // Downgrade expired trials
            const result = await UserSubscription.downgradeExpiredTrials(freePlan._id);

            console.log(`[Trial Expiry Job] Processed ${result.processed} expired trials`);

            if (result.downgraded.length > 0) {
                console.log(`[Trial Expiry Job] Downgraded users: ${result.downgraded.join(', ')}`);
            }
        } catch (error) {
            console.error('[Trial Expiry Job] Error:', error);
        }
    });

    console.log('[Trial Expiry Job] Scheduled to run daily at 2:00 AM');
};

/**
 * Manually run trial expiry check (for testing)
 */
export const runTrialExpiryCheck = async () => {
    console.log('[Trial Expiry Job] Manual run started...');

    try {
        const freePlan = await Plan.getByType('free');

        if (!freePlan) {
            throw new Error('Free plan not found');
        }

        const result = await UserSubscription.downgradeExpiredTrials(freePlan._id);

        console.log(`[Trial Expiry Job] Processed ${result.processed} expired trials`);

        return result;
    } catch (error) {
        console.error('[Trial Expiry Job] Error:', error);
        throw error;
    }
};
