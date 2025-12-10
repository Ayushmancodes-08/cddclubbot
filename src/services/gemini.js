const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_KEYS } = require('../config/env');
const logger = require('../utils/logger');

// Available models in priority order (most capable first, then fallbacks)
const MODEL_PRIORITY = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash-8b"
];

class RotationManager {
    constructor() {
        this.keys = GEMINI_KEYS;
        this.currentKeyIndex = 0;
        this.currentModelIndex = 0;
        this.keyCooldowns = {};
        this.modelCooldowns = {};
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000; // 2 seconds between requests

        if (this.keys.length > 0) {
            logger.log("Loaded " + this.keys.length + " Gemini API Key(s).", 'SYSTEM');
            logger.log("Available models: " + MODEL_PRIORITY.join(", "), 'SYSTEM');
        }
    }

    getKey() {
        return this.keys[this.currentKeyIndex];
    }

    getCurrentModel() {
        return MODEL_PRIORITY[this.currentModelIndex];
    }

    // Find a key that's not in cooldown
    findAvailableKey() {
        const now = Date.now();
        for (let i = 0; i < this.keys.length; i++) {
            const idx = (this.currentKeyIndex + i) % this.keys.length;
            if ((this.keyCooldowns[idx] || 0) <= now) {
                this.currentKeyIndex = idx;
                return true;
            }
        }
        return false;
    }

    // Find a model that's not in cooldown
    findAvailableModel() {
        const now = Date.now();
        for (let i = 0; i < MODEL_PRIORITY.length; i++) {
            const model = MODEL_PRIORITY[i];
            if ((this.modelCooldowns[model] || 0) <= now) {
                this.currentModelIndex = i;
                return model;
            }
        }
        return null;
    }

    markKeyRateLimited(keyIndex, cooldownMs) {
        this.keyCooldowns[keyIndex] = Date.now() + cooldownMs;
        logger.log("Key #" + (keyIndex + 1) + " in cooldown for " + Math.ceil(cooldownMs / 1000) + "s", 'WARNING');
    }

    markModelRateLimited(modelName, cooldownMs) {
        this.modelCooldowns[modelName] = Date.now() + cooldownMs;
        logger.log("Model " + modelName + " in cooldown for " + Math.ceil(cooldownMs / 1000) + "s", 'WARNING');
    }

    rotateKey() {
        if (this.keys.length <= 1) return false;
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        return true;
    }

    rotateModel() {
        if (this.currentModelIndex < MODEL_PRIORITY.length - 1) {
            this.currentModelIndex++;
            logger.log("Rotating to model: " + MODEL_PRIORITY[this.currentModelIndex], 'SYSTEM');
            return true;
        }
        return false;
    }

    // Throttle requests to avoid hitting rate limits
    async throttle() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.minRequestInterval) {
            await new Promise(r => setTimeout(r, this.minRequestInterval - elapsed));
        }
        this.lastRequestTime = Date.now();
    }

    async generateContentWithRetry(prompt) {
        if (this.keys.length === 0) {
            throw new Error("No Gemini Keys available.");
        }

        // Reset model index to try best model first
        this.currentModelIndex = 0;

        const maxAttempts = this.keys.length * MODEL_PRIORITY.length;
        let attempts = 0;

        while (attempts < maxAttempts) {
            attempts++;

            // Find available key and model
            if (!this.findAvailableKey()) {
                const minWait = this.getMinCooldownWait(this.keyCooldowns);
                if (minWait > 0) {
                    logger.log("All keys cooling down. Waiting " + Math.ceil(minWait / 1000) + "s...", 'WARNING');
                    await new Promise(r => setTimeout(r, minWait));
                }
                continue;
            }

            const modelName = this.findAvailableModel();
            if (!modelName) {
                const minWait = this.getMinCooldownWait(this.modelCooldowns);
                if (minWait > 0) {
                    logger.log("All models cooling down. Waiting " + Math.ceil(minWait / 1000) + "s...", 'WARNING');
                    await new Promise(r => setTimeout(r, minWait));
                }
                // Reset model cooldowns and try again
                this.modelCooldowns = {};
                this.currentModelIndex = 0;
                continue;
            }

            await this.throttle();

            const currentKey = this.getKey();
            const keyIndex = this.currentKeyIndex;

            try {
                const genAI = new GoogleGenerativeAI(currentKey);
                const model = genAI.getGenerativeModel({ model: modelName });

                logger.log("Trying Key #" + (keyIndex + 1) + " with " + modelName, 'INFO');

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text().replace(/^"|"$/g, '').trim();

                logger.log("Success with " + modelName, 'SUCCESS');
                return text;

            } catch (error) {
                const errorMsg = error.message || '';
                const isRateLimit = errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
                const isModelError = errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('not supported');

                if (isModelError) {
                    // Model not available, mark it and try next model
                    this.markModelRateLimited(modelName, 300000); // 5 min cooldown for model errors
                    if (!this.rotateModel()) {
                        // No more models, try next key with first model
                        this.currentModelIndex = 0;
                        this.rotateKey();
                    }
                } else if (isRateLimit) {
                    // Rate limited - could be key or model specific
                    // Mark both with different cooldowns
                    this.markKeyRateLimited(keyIndex, 60000); // 1 min for key
                    this.markModelRateLimited(modelName, 30000); // 30s for model

                    // Try next key with same model first
                    if (!this.rotateKey()) {
                        // No more keys, try next model
                        if (!this.rotateModel()) {
                            // All exhausted, wait a bit
                            await new Promise(r => setTimeout(r, 10000));
                            this.currentModelIndex = 0;
                        }
                    }
                } else {
                    logger.log("Gemini Error: " + errorMsg, 'ERROR');
                    this.rotateKey();
                }
            }
        }

        throw new Error("All API keys and models exhausted after " + attempts + " attempts.");
    }

    getMinCooldownWait(cooldowns) {
        const now = Date.now();
        let minWait = Infinity;
        for (const key in cooldowns) {
            const wait = cooldowns[key] - now;
            if (wait > 0 && wait < minWait) minWait = wait;
        }
        return minWait === Infinity ? 0 : minWait;
    }
}

module.exports = new RotationManager();
