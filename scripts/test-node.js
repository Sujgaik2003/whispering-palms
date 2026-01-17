console.log("Node is working");
try {
    require('dotenv').config({ path: '.env.local' });
    console.log("Dotenv loaded");
    console.log("API KEY exists:", !!process.env.ANYTHINGLLM_API_KEY);
} catch (e) {
    console.error("Dotenv failed:", e.message);
}
