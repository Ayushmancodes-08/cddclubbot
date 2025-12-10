const express = require('express');
const router = express.Router();
const { runBot } = require('../core/content-generator');
const stateManager = require('../utils/state');
const rotationManager = require('../services/gemini');
const logger = require('../utils/logger');

router.post('/run', async (req, res) => {
    logger.log("Manual trigger received via API.", 'SYSTEM');
    const dryRun = req.query.dryRun === 'true';

    const result = await runBot({ dryRun });
    res.json(result);
});

router.get('/status', (req, res) => {
    const state = stateManager.loadState();
    const activeKeyInfo = "Key #" + (rotationManager.currentIndex + 1);
    res.json({
        nextRun: "09:00 AM / 05:00 PM",
        botMode: "Autonomous (Smart Rotation)",
        activeModel: "Gemini 2.0 Flash (" + activeKeyInfo + ")",
        lastRun: state.lastRun || 'Never',
        lastMode: state.lastMode || 'None'
    });
});

module.exports = router;
