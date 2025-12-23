import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const migrateUserPermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all users
        const users = await User.find({});
        console.log(`Found ${users.length} users to update`);

        let updated = 0;
        for (const user of users) {
            // Migrate old role values to new ones
            const roleMap = {
                'user': 'new_joinee',
                'inventory': 'staff',
                'viewer': 'staff',
                'manager': 'manager',
                'admin': 'admin',
                'owner': 'owner',
                'new_joinee': 'new_joinee',
                'staff': 'staff'
            };

            // Convert old role to new role
            if (roleMap[user.role]) {
                user.role = roleMap[user.role];
            } else {
                user.role = 'new_joinee'; // Default for unknown roles
            }

            // Set permissions based on role
            user.setRolePermissions();
            await user.save();
            updated++;
            console.log(`Updated ${user.email} (${user.role})`);
        }

        console.log(`\n✅ Successfully updated ${updated} users with permissions`);
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrateUserPermissions();
