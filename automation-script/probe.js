require('dotenv').config();
const axios = require('axios');
const https = require('https');

const TOKEN = process.env.HF_TOKEN;
const agent = new https.Agent({ family: 4 });

async function run() {
    console.log("--- PROBE: OpenAI Compatibility ---");
    const url = "https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.2/v1/chat/completions";
    // Also try generic router?? No, usually it's per model path or v1

    // Attempt 1: Specific Model Router
    // https://router.huggingface.co/{model_id}/v1/chat/completions

    // Attempt 2: Generic Inference API (Old style but maybe V2?)

    const candidates = [
        {
            name: "Router: Message API (Mistral)",
            url: "https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.2/v1/chat/completions",
            payload: { model: "mistralai/Mistral-7B-Instruct-v0.2", messages: [{ role: "user", content: "Hello" }] }
        }
    ];

    for (const c of candidates) {
        console.log(`\nTesting: ${c.name}`);
        console.log(`URL: ${c.url}`);
        try {
            const res = await axios.post(
                c.url,
                c.payload,
                { headers: { Authorization: `Bearer ${TOKEN}` }, httpsAgent: agent, timeout: 10000 }
            );
            console.log(`RESULT: SUCCESS [${res.status}]`);
            console.log("Response:", JSON.stringify(res.data).substring(0, 100));
        } catch (e) {
            const status = e.response ? e.response.status : e.message;
            console.log(`RESULT: FAILED [${status}]`);
            if (e.response && e.response.data) console.log(JSON.stringify(e.response.data));
        }
    }
}

run();
