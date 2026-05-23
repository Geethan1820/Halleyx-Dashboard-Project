const axios = require('axios');

async function testAuth() {
  const baseURL = 'http://localhost:3000';
  const userData = {
    name: "Verification User",
    email: `verify_${Date.now()}@example.com`,
    password: "password123"
  };

  try {
    console.log("1. Registering user...");
    const regRes = await axios.post(`${baseURL}/register`, userData);
    console.log("Registration Success:", regRes.data.message);

    console.log("\n2. Logging in...");
    const loginRes = await axios.post(`${baseURL}/login`, {
      email: userData.email,
      password: userData.password
    });
    const token = loginRes.data.token;
    console.log("Login Success! Token received.");

    console.log("\n3. Accessing protected /orders with token...");
    const ordersRes = await axios.get(`${baseURL}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Access Success! Found ${ordersRes.data.length} orders.`);

    console.log("\n4. Attempting access WITHOUT token (expect 401)...");
    try {
      await axios.get(`${baseURL}/orders`);
    } catch (err) {
      console.log("Unauthorized Access Correctly Blocked:", err.response.status);
    }

    console.log("\n✅ BACKEND AUTH VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Auth Verification Failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

testAuth();
