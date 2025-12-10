try { require('dotenv').config(); } catch (e) { }

const requiredEnvVars = [
    'TWITTER_APP_KEY',
    'TWITTER_APP_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET'
];

const missingKeys = requiredEnvVars.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
    // console.warn('WARNING: Missing critical environment variables: ' + missingKeys.join(', '));
}

const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const geminiKeys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);

if (geminiKeys.length === 0) {
    // console.warn("WARNING: No Gemini API keys found. Content generation will fail.");
}

module.exports = {
    PORT: process.env.PORT || 3000,
    TWITTER: {
        appKey: process.env.TWITTER_APP_KEY,
        appSecret: process.env.TWITTER_APP_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
    },
    GEMINI_KEYS: geminiKeys,
    NODE_ENV: process.env.NODE_ENV || 'development'
};
