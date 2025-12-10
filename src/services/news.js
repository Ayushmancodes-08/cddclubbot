const axios = require('axios');
const logger = require('../utils/logger');

async function getTechNews() {
    try {
        logger.log("Fetching top rising articles from Dev.to...", 'INFO');
        const response = await axios.get('https://dev.to/api/articles?top=1&per_page=30');

        if (!response.data || response.data.length === 0) {
            logger.log('No articles found.', 'WARNING');
            return null;
        }

        const article = response.data[Math.floor(Math.random() * response.data.length)];

        logger.log("Found article: " + article.title, 'SUCCESS');
        return {
            title: article.title,
            url: article.url,
            tags: article.tag_list.join(', ')
        };
    } catch (error) {
        logger.log("News Fetch Error: " + error.message, 'ERROR');
        return null;
    }
}

module.exports = { getTechNews };
