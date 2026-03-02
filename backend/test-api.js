const axios = require("axios");

async function main() {
  try {
    // Need to login to get a cookie
    const resAuth = await axios.post("http://localhost:3000/api/auth/verify-otp", {
      email: "tharun.ad22@bitsathy.ac.in",
      otp: "123456" // Assuming dummy OTP
    });
    
    // We can't do that easily without a valid OTP, let's just make a script to fetch the db directly
  } catch(e) {
    console.log(e.response?.data || e.message);
  }
}
main();
