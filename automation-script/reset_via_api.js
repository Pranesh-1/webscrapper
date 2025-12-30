const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/articles';

async function resetByApi() {
    try {
        const { data: articles } = await axios.get(API_BASE);
        console.log(`Resetting ${articles.length} articles via API...`);

        for (const art of articles) {
            await axios.put(`${API_BASE}/${art._id}`, {
                isUpdated: false,
                updatedContent: ""
            });
            console.log(`Reset ${art._id}`);
        }
        console.log('Reset complete.');
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

resetByApi();
