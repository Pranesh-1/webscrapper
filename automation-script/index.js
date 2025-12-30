require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

// --- Configuration & Constants ---
const API_BASE = 'http://localhost:5000/api/articles';
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch pending articles from the backend API.
 * @returns {Promise<Array>} List of articles requiring updates.
 */
async function getArticles() {
    try {
        const { data } = await axios.get(API_BASE);
        // Filter only those that haven't been updated yet
        return data.filter(a => !a.isUpdated);
    } catch (err) {
        console.error("❌ API Error: Failed to fetch articles.", err.message);
        return [];
    }
}

/**
 * Search Google News via RSS to avoid CAPTCHA blocks.
 * @param {string} title - The article title to search for.
 * @returns {Promise<Array>} Array of {title, url} objects (max 2).
 */
async function scrapeGoogle(title) {
    try {
        console.log(`🔍 Searching: "${title}"`);
        const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(title)}&hl=en-US&gl=US&ceid=US:en`;

        const { data } = await axios.get(searchUrl, {
            timeout: 15000,
            headers: { 'User-Agent': USER_AGENT }
        });

        const $ = cheerio.load(data, { xmlMode: true });
        const results = [];

        $('item').each((i, el) => {
            const titleText = $(el).find('title').text();
            const url = $(el).find('link').text();
            // Note: Google RSS links redirect to real articles, which axios follows automatically.
            if (titleText && url) {
                results.push({ title: titleText, url });
            }
        });

        if (results.length === 0) console.warn("⚠️ No results found via Google RSS.");
        return results.slice(0, 2);

    } catch (err) {
        console.error('❌ Search failed:', err.message);
        return [];
    }
}

/**
 * Extract main content from a given URL using Cheerio.
 * Removes boilerplate (nav, footer, ads) to clean the text.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} Cleaned text content.
 */
async function scrapeContent(url) {
    try {
        console.log(`📄 Scraping reference: ${url.substring(0, 60)}...`);

        const { data } = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000,
            maxRedirects: 5
        });

        const $ = cheerio.load(data);

        // Remove noise/boilerplate elements
        $('script, style, nav, footer, header, aside, .ad-container, .popup').remove();

        // Target common main content areas
        const content = $('article, main, .content, #content, body').first().text().replace(/\s+/g, ' ').trim();

        return content.slice(0, 2500); // Limit context window
    } catch (err) {
        console.warn(`⚠️ Failed to scrape ${url.substring(0, 30)}...`, err.message);
        return "";
    }
}

/**
 * Call Cohere API to rewrite the content.
 * @param {string} prompt - The full prompt including context.
 * @returns {Promise<string|null>} Rewritten text or null on failure.
 */
async function callCohere(prompt) {
    if (!process.env.COHERE_API_KEY) {
        console.error("❌ Missing COHERE_API_KEY. Skipping LLM.");
        return null;
    }

    try {
        console.log("🤖 Sending request to Cohere...");
        const response = await axios.post(COHERE_API_URL, {
            model: 'command-nightly',
            message: prompt,
            temperature: 0.7,
            prompt_truncation: 'AUTO'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            }
        });

        return response.data.text;

    } catch (error) {
        console.error('❌ Cohere API Error:', error.response?.data?.message || error.message);
        return null;
    }
}

/**
 * Orchestrator: Prepares prompt and calls LLM.
 * @param {string} originalContent 
 * @param {Array} references 
 * @returns {Promise<string>} Final Markdown content.
 */
async function rewriteArticle(originalContent, references) {
    console.log('📝 Preparing context for rewrite...');

    let context = "";
    if (references && references.length > 0) {
        context = "\n\n### Reference Context:\n" + references.map(r => `Source: ${r.title}\nContent Snippet: ${r.content.substring(0, 500)}...`).join('\n\n');
    }

    // Engineering prompt for distinct rewrite
    const prompt = `Task: Rewrite this article for a professional business audience.
Rules:
1. Change the structure (e.g., use different headings).
2. Rephrase sentences completely (avoid plagiarism).
3. Use a professional, authoritative tone.
4. Do NOT start with "Here is a rewrite". Start directly with the Title.

Original Article:
${originalContent.substring(0, 2000)}

${context}

Rewrite ( Markdown ):`;

    try {
        let text = await callCohere(prompt);
        if (!text) throw new Error('Empty response');

        // Cleanup: Strip code blocks if LLM adds them
        text = text.replace(/^```markdown\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

        if (text.length > 100) return text;
        throw new Error('Response too short/invalid');

    } catch (err) {
        console.error(`❌ Rewrite failed: ${err.message}`);
        // Fallback to original with a note
        return `# [Original] ${originalContent.split(' ').slice(0, 10).join(' ')}...\n\n> **System Note**: AI enhancement failed. Displaying original content.\n\n${originalContent}`;
    }
}

// --- Main Execution Flow ---
async function main() {
    console.log('🚀 Starting Automation Agent...');

    // Step 1: Fetch
    const articles = await getArticles();
    console.log(`found ${articles.length} pending articles.`);

    // Step 2: Process Loop
    for (const article of articles) {
        console.log(`\n--------------------------------------------------`);
        console.log(`📌 Processing: "${article.title}"`);

        if (!article.content || article.content.length < 50) {
            console.log("Skipping: Content too short.");
            continue;
        }

        // Search Phase
        const googleResults = await scrapeGoogle(article.title);

        // Context Gathering
        const refContents = [];
        for (const res of googleResults) {
            const content = await scrapeContent(res.url);
            if (content.length > 200) {
                refContents.push({ url: res.url, title: res.title, content });
            }
        }
        console.log(`✅ Gathered ${refContents.length} valid references.`);

        // Rewrite Phase
        const updatedContent = await rewriteArticle(article.content, refContents);

        // Update Database
        if (updatedContent) {
            await axios.put(`${API_BASE}/${article._id}`, {
                updatedContent: updatedContent,
                isUpdated: true,
                enhancedAt: new Date(),
                references: googleResults.map(r => ({ title: r.title, url: r.url }))
            });
            console.log(`✅ SUCCESS: Article updated.`);
        }
    }
    console.log('\n🎉 Automation run complete.');
}

main();
