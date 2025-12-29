import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Plan from './models/Plan.js';
import UserSubscription from './models/UserSubscription.js';

dotenv.config();

/**
 * Migration script to assign subscriptions to existing users
 * 
 * Strategy:
 * - All existing users will be assigned a TRIAL plan
 * - Trial will start from migration date
 * - Trial will end 14 days from migration date
 */

const migrateUserSubscriptions = async () => {
    try {
        console.log('🚀 Starting user subscription migration...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Initialize plans
        await Plan.initializePlans();
        console.log('✅ Plans initialized');

        // Get trial plan
        const trialPlan = await Plan.getByType('trial');
        if (!trialPlan) {
            throw new Error('Trial plan not found');
        }
        console.log(`✅ Trial plan found: ${trialPlan.name}`);

        // Get all users without subscriptions (excluding super_admin)
        const allUsers = await User.find({ role: { $ne: 'super_admin' } });
        console.log(`📊 Found ${allUsers.length} total users (excluding super admins)`);

        const existingSubscriptions = await UserSubscription.find({});
        const usersWithSubscriptions = new Set(
            existingSubscriptions.map(sub => sub.userId.toString())
        );

        const usersWithoutSubscriptions = allUsers.filter(
            user => !usersWithSubscriptions.has(user._id.toString())
        );

        console.log(`📊 Users without subscriptions: ${usersWithoutSubscriptions.length}`);

        if (usersWithoutSubscriptions.length === 0) {
            console.log('✅ All users already have subscriptions. No migration needed.');
            await mongoose.disconnect();
            return;
        }

        // Create trial subscriptions for users without subscriptions
        let migrated = 0;
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14);

        for (const user of usersWithoutSubscriptions) {
            try {
                await UserSubscription.create({
                    userId: user._id,
                    planId: trialPlan._id,
                    status: 'active',
                    trial: {
                        isTrial: true,
                        startedAt: now,
                        endsAt: trialEnd
                    },
                    startedAt: now,
                    expiresAt: trialEnd
                });

                migrated++;
                console.log(`✅ Assigned trial to user: ${user.email}`);
            } catch (error) {
                console.error(`❌ Failed to assign trial to user ${user.email}:`, error.message);
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Total users migrated: ${migrated}`);
        console.log(`📊 Trial period: 14 days`);
        console.log(`📊 Trial ends: ${trialEnd.toLocaleDateString()}`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
migrateUserSubscriptions();
