import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import UserSubscription from './models/UserSubscription.js';

dotenv.config();

const removeSuperAdminSubscription = async () => {
    try {
        console.log('🔧 Removing subscription from super admin...');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find super admin
        const superAdmin = await User.findOne({ role: 'super_admin' });

        if (!superAdmin) {
            console.log('ℹ️  No super admin found');
            await mongoose.disconnect();
            return;
        }

        console.log(`📋 Found super admin: ${superAdmin.email}`);

        // Remove their subscription
        const result = await UserSubscription.deleteOne({ userId: superAdmin._id });

        if (result.deletedCount > 0) {
            console.log('✅ Successfully removed subscription from super admin');
            console.log('ℹ️  Super admins bypass all plan restrictions and don\'t need subscriptions');
        } else {
            console.log('ℹ️  Super admin had no subscription to remove');
        }

        await mongoose.disconnect();
        console.log('✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

removeSuperAdminSubscription();
