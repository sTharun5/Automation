const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        // connection logic

        socket.on("join", (email) => {
            if (email) {
                socket.join(email);
            }
        });

        socket.on("disconnect", () => {
            // disconnect logic
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const notifyUser = (email, title, message, type = "INFO") => {
    try {
        const io = getIO();
        io.to(email).emit("notification", {
            title,
            message,
            type,
            createdAt: new Date()
        });
    } catch (err) {
        console.error("Failed to emit socket event:", err.message);
    }
};

module.exports = { initSocket, getIO, notifyUser };
