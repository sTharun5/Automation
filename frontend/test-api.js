const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/od/scan-internal', { studentId: 1, qrPayload: "test" }, { timeout: 3000 });
    console.log(res.status, res.data);
  } catch (err) {
    console.error(err.message, err.response?.data);
  }
}
test();
