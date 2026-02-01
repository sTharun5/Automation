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
        console.log("New client connected:", socket.id);

        socket.on("join", (email) => {
            if (email) {
                socket.join(email);
                console.log(`Socket ${socket.id} joined room: ${email}`);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
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
