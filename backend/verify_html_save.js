const axios = require('axios');
const cheerio = require('cheerio');

async function testScrape() {
    const url = "https://beyondchats.com/choosing-the-right-ai-chatbot-a-guide/";
    console.log(`Fetching article: ${url}`);

    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $art = cheerio.load(data);
        const $ = cheerio.load(data); // alias

        // Simulate "Forced Fallback"
        console.log("--- SIMULATING FALLBACK ---");
        const container = $art('main').length ? $art('main') : ($art('article').length ? $art('article') : $art('body'));
        console.log("Container Type:", container.get(0).tagName);

        // CLEAN CONTAINER
        container.find('header, footer, nav, .sidebar, .comments, .related-posts, #comments, .menu, .skip-link, .widget-area').remove();
        container.find('script, style, iframe, form').remove();

        const paragraphs = [];
        container.find('p').each((i, el) => {
            const t = $art(el).text().trim();
            // console.log(`Para ${i}:`, t.substring(0, 20));
            if (t.length > 30) paragraphs.push(`<p>${t}</p>`);
        });

        console.log(`Found ${paragraphs.length} paragraphs.`);

        let content = "";
        if (paragraphs.length > 0) {
            content = paragraphs.join('\n');
        } else {
            console.log("No paragraphs! Using container.html()");
            content = container.html();
        }

        const $content = cheerio.load(content || '');
        const finalContent = $content('body').html() || '';

        console.log("\n--- FINAL CONTENT START ---");
        console.log(finalContent.substring(0, 200));

    } catch (e) {
        console.error(e);
    }
}

testScrape();
