const { Server } = require("socket.io");

class Logger {
    constructor() {
        this.io = null;
    }

    init(server) {
        this.io = new Server(server);
        console.log("Logger initialized with Socket.IO");
    }

    log(message, type) {
        if (!type) type = 'INFO';
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };

        // Console output
        console.log("[" + type + "] " + message);

        // Socket emission
        if (this.io) {
            this.io.emit('log', logEntry);
        }
    }
}

module.exports = new Logger();
