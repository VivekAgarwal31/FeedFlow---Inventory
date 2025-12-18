import axios from 'axios';

// Keep Render service alive by pinging it every 14 minutes
const RENDER_URL = process.env.RENDER_URL || 'http://localhost:5000';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

export const startHttpPing = () => {
    if (process.env.NODE_ENV === 'production' && process.env.RENDER_URL) {
        console.log('🔄 Starting HTTP keep-alive ping...');

        setInterval(async () => {
            try {
                await axios.get(`${RENDER_URL}/api/ping`);
                console.log('✅ HTTP ping successful');
            } catch (error) {
                console.error('❌ HTTP ping failed:', error.message);
            }
        }, PING_INTERVAL);
    }
};

export default { startHttpPing };
