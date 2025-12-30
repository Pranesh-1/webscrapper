const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Article = require('./models/Article');
require('dotenv').config();

async function fixArticle() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/beyondchats');

    // Valid URL
    const url = "https://beyondchats.com/choosing-the-right-ai-chatbot-a-guide/";
    console.log(`Fixing article: ${url}`);

    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $art = cheerio.load(data);

        const container = $art('main').length ? $art('main') : ($art('article').length ? $art('article') : $art('body'));
        container.find('header, footer, nav, .sidebar, .comments, .related-posts, #comments, .menu, .skip-link, .widget-area').remove();
        container.find('script, style, iframe, form').remove();

        // ALWAYS USE FALLBACK FOR THIS FIX to guarantee structure
        const paragraphs = [];
        container.find('p').each((i, el) => {
            const t = $art(el).text().trim();
            if (t.length > 30) paragraphs.push(`<p>${t}</p>`);
        });

        let content = "";
        if (paragraphs.length > 0) {
            content = paragraphs.join('\n');
        } else {
            console.log("No paragraphs found, using text split");
            const rawText = container.text();
            content = rawText.split(/\n+/).map(l => `<p>${l.trim()}</p>`).join('\n');
        }

        console.log(`New Content Start: ${content.substring(0, 50)}...`);

        await Article.findOneAndUpdate(
            { sourceUrl: url },
            { content: content },
            { new: true }
        );
        console.log("DB Updated.");

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

fixArticle();
