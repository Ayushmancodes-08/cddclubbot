const axios = require('axios');
const logger = require('../utils/logger');

let keepAliveInterval = null;

function startKeepAlive(url) {
    if (!url) {
        logger.log("No RENDER_EXTERNAL_URL set. Keep-alive disabled.", 'WARNING');
        return;
    }

    const pingUrl = url + '/api/health';
    const intervalMs = 10 * 60 * 1000; // Ping every 10 minutes

    logger.log("Starting keep-alive pinger for: " + pingUrl, 'SYSTEM');

    keepAliveInterval = setInterval(async () => {
        try {
            await axios.get(pingUrl, { timeout: 10000 });
            logger.log("Keep-alive ping successful", 'INFO');
        } catch (error) {
            logger.log("Keep-alive ping failed: " + error.message, 'WARNING');
        }
    }, intervalMs);

    // Initial ping after 1 minute
    setTimeout(async () => {
        try {
            await axios.get(pingUrl, { timeout: 10000 });
            logger.log("Initial keep-alive ping successful", 'INFO');
        } catch (error) {
            logger.log("Initial keep-alive ping failed: " + error.message, 'WARNING');
        }
    }, 60000);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

module.exports = { startKeepAlive, stopKeepAlive };
