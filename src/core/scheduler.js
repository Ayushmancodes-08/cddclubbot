const cron = require('node-cron');
const { runBot } = require('./content-generator');
const { CRON_SCHEDULES } = require('../config/constants');
const logger = require('../utils/logger');

function initScheduler() {
    logger.log("Initializing Scheduler...", 'SYSTEM');

    cron.schedule(CRON_SCHEDULES.MORNING, () => {
        logger.log("Triggering Morning Run", 'SYSTEM');
        runBot();
    });

    cron.schedule(CRON_SCHEDULES.EVENING, () => {
        logger.log("Triggering Evening Run", 'SYSTEM');
        runBot();
    });

    logger.log("Scheduled jobs for: " + Object.values(CRON_SCHEDULES).join(' and '), 'SUCCESS');
}

module.exports = { initScheduler };
