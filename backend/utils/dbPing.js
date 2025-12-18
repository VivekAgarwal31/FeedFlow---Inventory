import mongoose from 'mongoose';

// Keep MongoDB connection alive by pinging every 5 minutes
const DB_PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const startDbPing = () => {
    if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Starting MongoDB keep-alive ping...');

        setInterval(async () => {
            try {
                // Ping MongoDB to keep connection alive
                await mongoose.connection.db.admin().ping();
                console.log('✅ MongoDB ping successful');
            } catch (error) {
                console.error('❌ MongoDB ping failed:', error.message);
            }
        }, DB_PING_INTERVAL);
    }
};

export default { startDbPing };
