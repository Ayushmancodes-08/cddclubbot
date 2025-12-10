const { PERSONA } = require('../config/constants');
const logger = require('../utils/logger');
const stateManager = require('../utils/state');
const rotationManager = require('../services/gemini');
const twitterService = require('../services/twitter');
const newsService = require('../services/news');

async function generateTweetContent(type, contextData) {
    let specificPrompt = "";

    const isShort = Math.random() < 0.5;
    const lengthConstraint = isShort
        ? "Length: Ultra-short & punchy (under 140 chars)."
        : "Length: Medium & insightful (under 260 chars).";

    if (type === 'NEWS' && contextData) {
        specificPrompt = PERSONA.BASE_PROMPT + "\\n" +
            "Task: Write a savvy, hook-filled comment/summary of this article to get people to click.\\n" +
            "Article Title: " + contextData.title + "\\n" +
            "Tags: " + contextData.tags + "\\n" +
            "Output: The tweet text + '👇'\\n" +
            lengthConstraint;
    } else if (type === 'LIFE') {
        specificPrompt = PERSONA.BASE_PROMPT + "\\n" +
            "Task: Share a relatable thought, observation, or motivation for engineering students.\\n" +
            "Themes: Tier-3 college struggles, overcoming imposter syndrome, 'Tutorial Hell', Placement anxiety, or the joy of fixing a bug.\\n" +
            "Output: Just the tweet text.\\n" +
            lengthConstraint;
    } else {
        specificPrompt = PERSONA.BASE_PROMPT + "\\n" +
            "Task: Share one specific, high-value coding tip, 'condition' (if this then that), or teaching.\\n" +
            "Topics: Clean Code norms, unexpected CSS behaviors, Node.js performance, System Design tradeoffs, or a 'Did you know?' fact.\\n" +
            "Output: Just the tweet text.\\n" +
            lengthConstraint;
    }

    try {
        logger.log("Generating tweet content (" + type + ") - " + (isShort ? 'Short' : 'Medium') + "...", 'INFO');
        const text = await rotationManager.generateContentWithRetry(specificPrompt);
        logger.log("Content generated successfully.", 'SUCCESS');
        return text;
    } catch (error) {
        logger.log("Gemini Generation Failed: " + error.message, 'ERROR');
        return null;
    }
}

async function runBot(options) {
    if (!options) options = { dryRun: false };

    logger.log("Bot Waking Up...", 'SYSTEM');

    const state = stateManager.loadState();
    const lastMode = state.lastMode;
    logger.log("Previous Mode: " + (lastMode || 'None'), 'SYSTEM');

    const allModes = ['NEWS', 'LIFE', 'TIP'];
    const availableModes = allModes.filter(m => m !== lastMode);

    let mode = availableModes[Math.floor(Math.random() * availableModes.length)];
    let finalTweet = "";

    try {
        if (mode === 'NEWS') {
            logger.log("Mode: Tech News (Viral/Recent)", 'INFO');
            const article = await newsService.getTechNews();
            if (article) {
                const hook = await generateTweetContent('NEWS', article);
                if (hook) {
                    finalTweet = hook + "\\n\\nRead more: " + article.url;
                }
            }
        } else if (mode === 'LIFE') {
            logger.log("Mode: Engineering Life (Tier-3 Context)", 'INFO');
            finalTweet = await generateTweetContent('LIFE');
        }

        if (!finalTweet) {
            if (mode !== 'TIP') logger.log(mode + " failed, falling back to TIP.", 'WARNING');
            mode = 'TIP';
            logger.log("Mode: Coding Tip/Teaching", 'INFO');
            finalTweet = await generateTweetContent('TIP');
        }

        if (finalTweet) {
            logger.log("Generated Tweet:\\n" + finalTweet, 'PREVIEW');

            if (!options.dryRun) {
                const posted = await twitterService.postTweet(finalTweet);
                if (posted) {
                    stateManager.saveState({ lastMode: mode, lastRun: new Date().toISOString() });
                }
            } else {
                logger.log("Dry Run Mode: Tweet NOT posted.", 'INFO');
            }
            return { status: 'success', tweet: finalTweet, mode };
        } else {
            logger.log("Failed to generate content.", 'ERROR');
            return { status: 'error', message: 'Failed to generate content' };
        }

    } catch (err) {
        logger.log("Critical Bot Error: " + err.message, 'ERROR');
        return { status: 'error', message: err.message };
    } finally {
        logger.log("Bot cycle complete.", 'SYSTEM');
    }
}

module.exports = { runBot };
