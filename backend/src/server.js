require("dotenv").config();
const app = require("./app");
const supportRoutes = require("./modules/support/support.routes");

// Register Support Routes
app.use("/api/support", supportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
