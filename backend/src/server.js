require("dotenv").config();
const app = require("./app");
const supportRoutes = require("./modules/support/support.routes");

// Register Support Routes
app.use("/api/support", supportRoutes);

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
