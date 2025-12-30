require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/articles';

async function viewContent() {
    try {
        const { data } = await axios.get(API_BASE);
        const updated = data.filter(a => a.isUpdated);
        if (updated.length > 0) {
            console.log('--- CONTENT SAMPLE ---');
            console.log(updated[0].updatedContent);
        } else {
            console.log('No updated articles found.');
        }
    } catch (err) {
        console.error(err.message);
    }
}

viewContent();
