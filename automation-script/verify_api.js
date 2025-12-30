require('dotenv').config();
const axios = require('axios');
const https = require('https');

// Using the large model as primary, as configured in the main app
const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
const TOKEN = process.env.HF_TOKEN;

async function test() {
    console.log(`Testing Connection to: ${API_URL}`);
    console.log(`Token Present: ${!!TOKEN}`);

    try {
        // The Critical Fix: Force IPv4
        const agent = new https.Agent({ family: 4 });

        const response = await axios.post(
            API_URL,
            { inputs: "Summarize this: Artificial Intelligence is transforming the world by automating tasks and generating creative content." },
            {
                headers: { Authorization: `Bearer ${TOKEN}` },
                httpsAgent: agent, // This excludes IPv6 usage which was causing ENOTFOUND
                timeout: 30000
            }
        );

        console.log("\n--- RESULT: SUCCESS ---");
        console.log("API Status Code:", response.status);
        console.log("Generated Output:", JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log("\n--- RESULT: FAILED ---");
        console.log("Error Message:", error.message);
        if (error.code) console.log("Error Code:", error.code);
        if (error.response) {
            console.log("API Error Status:", error.response.status);
            console.log("API Error Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

test();
