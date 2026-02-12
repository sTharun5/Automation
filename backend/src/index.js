require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSocket } = require("./utils/socket");

const PORT = 3000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
