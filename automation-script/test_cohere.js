require('dotenv').config();
const axios = require('axios');

async function testCohere() {
    console.log("Testing Cohere API (Chat Endpoint)...");
    console.log("Key present:", !!process.env.COHERE_API_KEY);

    try {
        const response = await axios.post('https://api.cohere.ai/v1/chat', {
            model: 'command-nightly',
            message: 'Say "Hello, World!" if you can hear me.',
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            }
        });

        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

testCohere();
