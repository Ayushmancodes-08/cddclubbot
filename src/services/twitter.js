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
    }

    async postTweet(text) {
        try {
            logger.log("Posting to Twitter...", 'INFO');

            if (!text || text.length === 0) {
                throw new Error("Cannot post empty content.");
            }

            const tweet = await this.client.v2.tweet(text);
            logger.log("Tweet Posted! ID: " + tweet.data.id, 'SUCCESS');
            return true;
        } catch (error) {
            const errorDetail = error.data || error.message || error;
            logger.log("Twitter Error: " + JSON.stringify(errorDetail), 'ERROR');

            if (String(error).includes('403')) {
                logger.log("Hint: 403 Forbidden = Permissions missing or Duplicate Content.", 'WARNING');
            }
            return false;
        }
    }
}

module.exports = new TwitterService();
