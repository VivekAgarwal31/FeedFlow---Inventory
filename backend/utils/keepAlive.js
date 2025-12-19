import axios from 'axios';

// Keep Render service alive by pinging it every 2 minutes
const RENDER_URL = (process.env.RENDER_URL || 'http://localhost:5000').replace(/\/$/, ''); // Remove trailing slash
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes

export const startHttpPing = () => {
    if (process.env.NODE_ENV === 'production' && process.env.RENDER_URL) {
        console.log('🔄 Starting HTTP keep-alive ping...');
        console.log(`📍 Target URL: ${RENDER_URL}`);
        console.log(`📍 Ping endpoint: ${RENDER_URL}/api/ping`);
        console.log(`📍 Ping interval: every 2 minutes`);

        // Wait 5 seconds before initial ping to ensure server is fully ready
        setTimeout(() => {
            axios.get(`${RENDER_URL}/api/ping`, { timeout: 10000 })
                .then((response) => {
                    console.log('✅ Initial HTTP ping successful');
                    console.log('📊 Response:', response.data);
                })
                .catch(error => {
                    console.error('❌ Initial HTTP ping failed');
                    console.error('🔍 Error details:', {
                        message: error.message,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        url: error.config?.url
                    });
                });
        }, 5000);

        // Then ping every 2 minutes
        setInterval(async () => {
            try {
                const response = await axios.get(`${RENDER_URL}/api/ping`, { timeout: 10000 });
                console.log('✅ HTTP ping successful:', response.data);
            } catch (error) {
                console.error('❌ HTTP ping failed');
                console.error('🔍 Error details:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url
                });
            }
        }, PING_INTERVAL);
    } else {
        console.log('ℹ️ HTTP keep-alive ping disabled');
        console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`   RENDER_URL: ${process.env.RENDER_URL || 'not set'}`);
    }
};

export default { startHttpPing };
