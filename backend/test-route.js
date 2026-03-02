const axios = require('axios');
axios.get('http://localhost:3000/api/students/dashboard', {
  headers: {
    Cookie: 'token=' + require('jsonwebtoken').sign({ email: "tharun.ad22@bitsathy.ac.in", role: "STUDENT", id: 2 }, require('dotenv').config().parsed.JWT_SECRET)
  }
}).then(r => console.log("OK", r.status)).catch(e => console.log("FAIL", e.response?.status, e.response?.data));
