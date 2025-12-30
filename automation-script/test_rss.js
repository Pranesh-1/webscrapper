const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
    try {
        const query = "AI in Healthcare";
        console.log(`Testing Google News RSS for: "${query}"`);

        const { data } = await axios.get(
            `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,
            { timeout: 10000 }
        );

        const $ = cheerio.load(data, { xmlMode: true });
        console.log('Items found:', $('item').length);

        $('item').slice(0, 3).each((i, el) => {
            console.log(`- ${$(el).find('title').text()} -> ${$(el).find('link').text()}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
})();
