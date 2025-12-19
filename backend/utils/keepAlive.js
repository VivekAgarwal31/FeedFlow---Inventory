import axios from 'axios';

// Keep Render service alive by pinging it every 2 minutes
const RENDER_URL = process.env.RENDER_URL || 'http://localhost:5000';
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes

export const startHttpPing = () => {
    if (process.env.NODE_ENV === 'production' && process.env.RENDER_URL) {
        console.log('🔄 Starting HTTP keep-alive ping...');
        console.log(`📍 Pinging ${RENDER_URL}/api/ping every 2 minutes`);

        // Send initial ping immediately
        axios.get(`${RENDER_URL}/api/ping`)
            .then(() => console.log('✅ Initial HTTP ping successful'))
            .catch(error => console.error('❌ Initial HTTP ping failed:', error.message));

        // Then ping every 2 minutes
        setInterval(async () => {
            try {
                const response = await axios.get(`${RENDER_URL}/api/ping`);
                console.log('✅ HTTP ping successful:', response.data);
            } catch (error) {
                console.error('❌ HTTP ping failed:', error.message);
            }
        }, PING_INTERVAL);
    } else {
        console.log('ℹ️ HTTP keep-alive ping disabled (not in production or RENDER_URL not set)');
    }
};

export default { startHttpPing };
