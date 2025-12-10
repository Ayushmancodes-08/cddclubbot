# Coding Club Bot 🤖

A "Relatable Senior Developer" Twitter bot aimed at Tier-3 engineering students. It shares coding tips, viral tech news, and relatable engineering life struggles using AI.

## 🚀 Capabilities

### 1. **Smart Persona**
- **Role**: Relatable Senior Mentor.
- **Context**: Understands "Tier-3" struggles, off-campus placements, "Tutorial Hell", and the LeetCode grind.
- **Tone**: Grounded, witty, encouraging, and anti-buzzword.

### 2. **Diverse Content Strategy**
The bot rotates through three distinct modes to keep the feed fresh (`Smart Rotation` prevents repetition):
- **📰 Tech News (30%)**: Fetches real, viral articles from Dev.to and adds a "Senior Dev" take on them.
- **💡 Coding Tips (35%)**: Specific, high-value technical advice (Clean Code, System Design, Node.js).
- **🎓 Engineering Life (35%)**: Relatable motivation about bugs, imposter syndrome, and the college hustle.

### 3. **Dynamic Formatting**
- **Variable Lengths**: Randomly switches between "Short & Punchy" (<140 chars) and "Medium & Insightful" (<260 chars).
- **Hashtags**: Automatically appends 5-6 relevant tags plus `#cddclubpmec`.

### 4. **Resilience**
- **API Rotation**: Automatically rotates between multiple Gemini API keys to handle rate limits.
- **State Persistence**: Remembers the last mode used (`bot_state.json`) to avoid repetitive posting even after restarts.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **AI Engine**: Google Gemini 2.0 Flash
- **Social**: Twitter API v2
- **Data Source**: Dev.to API
- **Scheduler**: Node-cron (9 AM & 5 PM) / Manual Trigger API

---

## ☁️ How to Make it Autonomous (24/7)

To make this run without you needing to keep your laptop open, you must **Deploy** it to a cloud server.

### Option 1: Render.com (Recommended for Free Tier)
1. **Push code to GitHub**: Upload this folder to a GitHub repository.
2. **Create Web Service on Render**:
   - Connect your GitHub repo.
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
3. **Environment Variables**:
   - Go to the "Environment" tab in Render.
   - Add all values from your `.env` file (`TWITTER_APP_KEY`, `GEMINI_API_KEY`, etc.).
4. **Prevent Sleeping (Critical!)**:
   - Render's free tier sleeps after 15 mins of inactivity.
   - **Solution**: Use **[Cron-Job.org](https://cron-job.org)** or **UptimeRobot**.
   - Create a job to ping `https://your-bot-name.onrender.com/` every 10 minutes.
   - This keeps the bot "awake" so its internal cron scheduler (9 AM / 5 PM) works correctly.

### Option 2: VPS (DigitalOcean/AWS) - ~$5/mo
1. Rent a small Ubuntu server.
2. Install Node.js & PM2: `npm install -g pm2`
3. Clone your repo and run: `pm2 start index.js --name bot`
4. This runs 24/7 natively without sleeping.

---

## 💻 Local Usage
- **Start**: `npm start`
- **Dashboard**: Open `http://localhost:3000` to see status and trigger manual runs.
