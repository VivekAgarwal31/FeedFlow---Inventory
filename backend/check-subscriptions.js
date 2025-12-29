import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserSubscription from './models/UserSubscription.js';
import User from './models/User.js';
import Plan from './models/Plan.js';

dotenv.config();

const checkSubscriptions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all subscriptions with user and plan details
        const subscriptions = await UserSubscription.find()
            .populate('userId', 'email fullName role')
            .populate('planId')
            .lean();

        console.log(`📊 Total Subscriptions: ${subscriptions.length}\n`);

        subscriptions.forEach((sub, index) => {
            console.log(`\n--- Subscription ${index + 1} ---`);
            console.log(`User: ${sub.userId?.fullName} (${sub.userId?.email})`);
            console.log(`Role: ${sub.userId?.role}`);
            console.log(`Plan: ${sub.planId?.name} (${sub.planId?.type})`);
            console.log(`Status: ${sub.status}`);
            console.log(`Is Trial: ${sub.trial?.isTrial}`);
            console.log(`Trial Ends: ${sub.trial?.endsAt}`);
            console.log(`Updated By Admin: ${sub.updatedByAdmin}`);

            // Check if trial is expired
            if (sub.trial?.isTrial && sub.trial?.endsAt) {
                const now = new Date();
                const endsAt = new Date(sub.trial.endsAt);
                const daysRemaining = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));
                console.log(`Days Remaining: ${daysRemaining}`);
                console.log(`Expired: ${daysRemaining <= 0 ? 'YES' : 'NO'}`);
            }
        });

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkSubscriptions();
