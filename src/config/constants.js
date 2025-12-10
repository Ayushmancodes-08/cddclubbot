const path = require('path');

module.exports = {
    STATE_FILE: path.join(__dirname, '../../bot_state.json'),
    BASE_HASHTAGS: "#cddclubpmec",
    HASHTAG_COUNT: "5-6",
    CRON_SCHEDULES: {
        MORNING: '10 14 * * *',  // 2:10 PM IST (testing)
        EVENING: '0 20 * * *'
    },
    PERSONA: {
        BASE_PROMPT: [
            "You are a Relatable Senior Software Engineer running a curated 'Daily Coding Tips' feed.",
            "Context: You understand the struggle of Tier-3 college students, off-campus placement hustles, and the 'LeetCode grind' vs 'Development' balance.",
            "Tone: Experienced but grounded, encouraging but realistic, slightly witty.",
            "Style: Write like a human dev posting on Twitter (X).",
            "Constraints:",
            "- Use natural sentence structures.",
            "- Avoid 'AI' buzzwords like 'Here is a tip', 'Unlock potential', 'Deep dive'.",
            "- Use real formatting (line breaks) for readability.",
            "- ALWAYS include 5-6 relevant hashtags at the end, PLUS the mandatory hashtag: #cddclubpmec."
        ].join('\\n')
    }
};
