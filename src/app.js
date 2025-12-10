const express = require('express');
const http = require('http');
const path = require('path');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');
const apiRoutes = require('./routes/api');
const { initScheduler } = require('./core/scheduler');
const { startKeepAlive } = require('./services/keepalive');

const app = express();
const server = http.createServer(app);

logger.init(server);

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Health check endpoint for keep-alive and monitoring
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

function start() {
    initScheduler();

    server.listen(PORT, () => {
        logger.log("Server running at http://localhost:" + PORT, 'SUCCESS');
        logger.log("Socket.IO ready for real-time logs.", 'INFO');

        // Start keep-alive for Render (only if RENDER_EXTERNAL_URL is set)
        const renderUrl = process.env.RENDER_EXTERNAL_URL;
        if (renderUrl) {
            startKeepAlive(renderUrl);
        }
    });
}

module.exports = { app, server, start };
