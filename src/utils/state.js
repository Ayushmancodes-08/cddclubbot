const fs = require('fs');
const { STATE_FILE } = require('../config/constants');
const logger = require('./logger');

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        logger.log(`Failed to load state: ${e.message}`, 'ERROR');
    }
    return { lastMode: null };
}

function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        logger.log(`Failed to save state: ${e.message}`, 'ERROR');
    }
}

module.exports = { loadState, saveState };
