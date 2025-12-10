const cron = require('node-cron');
const { runBot } = require('./content-generator');
const { CRON_SCHEDULES } = require('../config/constants');
const logger = require('../utils/logger');

function initScheduler() {
    logger.log("Initializing Scheduler...", 'SYSTEM');

    // Use Asia/Kolkata timezone so schedules run at correct IST times
    // (Render servers use UTC by default)
    const cronOptions = {
        timezone: "Asia/Kolkata"
    };

    cron.schedule(CRON_SCHEDULES.MORNING, () => {
        logger.log("Triggering Morning Run", 'SYSTEM');
        runBot();
    }, cronOptions);

    cron.schedule(CRON_SCHEDULES.EVENING, () => {
        logger.log("Triggering Evening Run", 'SYSTEM');
        runBot();
    }, cronOptions);

    logger.log("Scheduled jobs for: " + Object.values(CRON_SCHEDULES).join(' and ') + " (IST)", 'SUCCESS');
}

module.exports = { initScheduler };
