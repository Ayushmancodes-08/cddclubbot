const { TwitterApi } = require('twitter-api-v2');
const { TWITTER } = require('../config/env');
const logger = require('../utils/logger');

class TwitterService {
    constructor() {
        this.client = new TwitterApi({
            appKey: TWITTER.appKey,
            appSecret: TWITTER.appSecret,
            accessToken: TWITTER.accessToken,
            accessSecret: TWITTER.accessSecret,
        });
        this.maxRetries = 3;
        this.baseDelayMs = 60000; // 60 seconds base delay for rate limits
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async postTweet(text) {
        if (!text || text.length === 0) {
            logger.log("Cannot post empty content.", 'ERROR');
            return false;
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                logger.log("Posting to Twitter (attempt " + attempt + "/" + this.maxRetries + ")...", 'INFO');

                const tweet = await this.client.v2.tweet(text);
                logger.log("Tweet Posted! ID: " + tweet.data.id, 'SUCCESS');
                return true;

            } catch (error) {
                const errorDetail = error.data || error.message || error;
                const errorStr = JSON.stringify(errorDetail);
                const statusCode = error.code || error.status || (error.data && error.data.status);

                logger.log("Twitter Error: " + errorStr, 'ERROR');

                // Handle rate limit (429)
                if (statusCode === 429 || errorStr.includes('429') || errorStr.includes('Too Many Requests')) {
                    if (attempt < this.maxRetries) {
                        const delayMs = this.baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
                        logger.log("Rate limited. Waiting " + (delayMs / 1000) + "s before retry...", 'WARNING');
                        await this.sleep(delayMs);
                        continue;
                    }
                    logger.log("Rate limit persists after " + this.maxRetries + " attempts.", 'ERROR');
                }

                // Handle forbidden (403) - don't retry, it's a permissions/duplicate issue
                if (statusCode === 403 || errorStr.includes('403')) {
                    logger.log("Hint: 403 Forbidden = Permissions missing or Duplicate Content.", 'WARNING');
                    return false;
                }

                // For other errors, don't retry
                return false;
            }
        }

        return false;
    }
}

module.exports = new TwitterService();
