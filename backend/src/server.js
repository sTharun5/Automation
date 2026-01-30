require("dotenv").config();
const app = require("./app");

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
