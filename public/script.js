const socket = io();
const logContainer = document.getElementById('console-logs');
const runBtn = document.getElementById('run-btn');
const nextRunEl = document.getElementById('next-run');

// --- Tailwind Colors for Logs ---
const LOG_COLORS = {
    'INFO': 'text-blue-400',
    'SUCCESS': 'text-green-400',
    'ERROR': 'text-red-400',
    'WARNING': 'text-yellow-400',
    'SYSTEM': 'text-slate-500',
    'PREVIEW': 'text-purple-400'
};

// --- Socket Listeners ---

socket.on('connect', () => {
    addLog('System connected to backend server.', 'SYSTEM');
    const statusEl = document.getElementById('connection-status');
    statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-400"></span> Connected';
    statusEl.className = "text-xs font-medium text-green-400 flex items-center gap-1.5";
});

socket.on('disconnect', () => {
    addLog('Connection lost. Reconnecting...', 'ERROR');
    const statusEl = document.getElementById('connection-status');
    statusEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> Disconnected';
    statusEl.className = "text-xs font-medium text-red-400 flex items-center gap-1.5";
});

socket.on('log', (data) => {
    addLog(data.message, data.type, data.timestamp);
});

// --- UI Functions ---

function addLog(message, type, timestamp = new Date().toLocaleTimeString()) {
    const entry = document.createElement('div');
    // Base classes for log entry
    entry.className = `flex gap-2 font-mono text-sm border-l-2 pl-2 mb-1 opacity-0 animate-fade-in`;

    // Border color based on type
    const colorClass = LOG_COLORS[type] || 'text-slate-300';
    // Mapping text color to border color roughly or just use slate for border
    entry.classList.add(colorClass.replace('text-', 'border-').replace('400', '500').replace('500', '600') || 'border-slate-700');

    entry.innerHTML = `
        <span class="text-slate-500 min-w-[80px]">[${timestamp}]</span>
        <span class="font-bold ${colorClass} min-w-[60px]">${type}</span>
        <span class="text-slate-300 break-words flex-1">${message}</span>
    `;

    logContainer.appendChild(entry);

    // Auto scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}

// --- Action Handlers ---

runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    const originalContent = runBtn.innerHTML;
    runBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Running...
    `;

    try {
        const response = await fetch('/api/run', { method: 'POST' });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        addLog(`Trigger failed: ${error.message}`, 'ERROR');
    } finally {
        // Re-enable after a short delay
        setTimeout(() => {
            runBtn.disabled = false;
            runBtn.innerHTML = originalContent;
        }, 2000);
    }
});

// --- Init ---
async function fetchStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();

        if (data.nextRun) document.getElementById('next-run').innerText = data.nextRun;

        const botModeEl = document.getElementById('bot-mode');
        if (botModeEl && data.botMode) {
            // Keep the icon if we can, or just update text. For now simple text update + icon re-insertion if needed.
            // Simplified: Just update text content but try to preserve the icon structure if possible in a real app.
            // Since the ID is on the container, we can rebuild the innerHTML or just update the text node if we are careful.
            // Let's just update the text for now to match strict requirements, or rebuild innerHTML to include the icon.
            botModeEl.innerHTML = `
                ${data.botMode}
                <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            `;
        }

        if (data.activeModel) document.getElementById('active-model').innerText = data.activeModel;

    } catch (e) {
        console.error("Status fetch failed", e);
        document.getElementById('next-run').innerText = "Unknown";
    }
}

fetchStatus();
// Poll every 30 seconds
setInterval(fetchStatus, 30000);
