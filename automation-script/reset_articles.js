const axios = require('axios');
const API_BASE = 'http://localhost:5000/api/articles';

async function resetArticles() {
    try {
        console.log("Fetching articles...");
        const { data: articles } = await axios.get(API_BASE);
        console.log(`Found ${articles.length} articles. Resetting...`);

        for (const article of articles) {
            if (article.isUpdated) {
                await axios.put(`${API_BASE}/${article._id}`, {
                    isUpdated: false,
                    updatedContent: "",
                    enhancedAt: null
                });
                console.log(`Reset: ${article.title}`);
            }
        }
        console.log("Reset complete.");
    } catch (e) {
        console.error("Error resetting:", e.message);
    }
}

resetArticles();
