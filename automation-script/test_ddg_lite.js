const axios = require('axios');

(async () => {
    try {
        const query = "AI in Healthcare";
        console.log(`Testing DDG API for: "${query}"`);

        const { data } = await axios.get(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
            { timeout: 10000 }
        );

        console.log('Abstract:', data.Abstract);
        console.log('RelatedTopics Count:', data.RelatedTopics ? data.RelatedTopics.length : 0);

        if (data.RelatedTopics) {
            data.RelatedTopics.slice(0, 3).forEach(t => {
                if (t.Text && t.FirstURL) {
                    console.log(`- ${t.Text.substring(0, 50)}... -> ${t.FirstURL}`);
                }
            });
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
})();
