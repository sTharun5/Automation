require("dotenv").config();
const app = require("./app");

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
