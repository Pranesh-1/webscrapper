require('dotenv').config();
const axios = require('axios');
const https = require('https');

const HF_TOKEN = process.env.HF_TOKEN;
const MODEL = "google/flan-t5-base";
const URL = `https://api-inference.huggingface.co/models/${MODEL}`;

async function testConnection() {
    console.log(`Testing API Connection to: ${MODEL}`);
    console.log(`Token Present: ${!!HF_TOKEN}`);

    // Force IPv4
    const agent = new https.Agent({ family: 4 });

    try {
        const response = await axios.post(
            URL,
            { inputs: "Hello, can you hear me?" },
            {
                headers: { "Authorization": `Bearer ${HF_TOKEN}` },
                httpsAgent: agent, // FORCE IPv4
                timeout: 10000
            }
        );

        console.log("\n--- SUCCESS ---");
        console.log("Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));

    } catch (err) {
        console.log("\n--- FAILED ---");
        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.log("Error:", err.message);
            console.log("Code:", err.code);
        }
    }
}

testConnection();
