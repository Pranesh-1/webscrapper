const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');

const BASE_URL = 'https://beyondchats.com/blogs';

async function scrapeBeyondChats() {
    try {
        console.log('Starting scrape...');

        // Step 1: Get the first page to find the last page number
        const { data: homeHtml } = await axios.get(BASE_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(homeHtml);

        // Find the last page number
        let maxPage = 1;
        const paginationLinks = $('a').filter((i, el) => {
            return !isNaN(parseInt($(el).text()));
        });

        paginationLinks.each((i, el) => {
            const num = parseInt($(el).text());
            if (num > maxPage) maxPage = num;
        });

        console.log(`Detected max page: ${maxPage}. Fetching articles from there...`);

        let articlesToSave = [];
        let currentPage = maxPage;

        while (articlesToSave.length < 5 && currentPage >= 1) {
            const pageUrl = currentPage === 1 ? BASE_URL : `${BASE_URL}/page/${currentPage}/`;
            console.log(`Fetching ${pageUrl}`);
            const { data: pageHtml } = await axios.get(pageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
            });
            const $page = cheerio.load(pageHtml);

            const articlePromises = [];

            const items = [];
            $('h2 a').each((i, el) => {
                items.push($(el)); // Collect all title links
            });

            for (let i = items.length - 1; i >= 0; i--) {
                if (articlesToSave.length >= 5) break;

                const el = items[i];
                const title = el.text().trim();
                const url = el.attr('href');

                // Check if already in list (dedupe)
                if (articlesToSave.find(a => a.sourceUrl === url)) continue;

                // Fetch individual article content
                articlePromises.push(
                    axios.get(url).then(async (response) => {
                        const $art = cheerio.load(response.data);

                        // Optimized content extraction
                        // Try specific semantic tags first, BUT verify they have P tags
                        let rawContent = $art('.entry-content').html() ||
                            $art('.post-content').html() ||
                            $art('article .content').html() ||
                            $art('#main .post').html();

                        let content = rawContent;

                        // Check if content lacks paragraphs (wall of text issue)
                        if (content && (content.match(/<p/g) || []).length < 2) {
                            console.log(`Content missing structure for ${url}, forcing fallback...`);
                            content = null; // Force fallback
                        }

                        if (!content || content.length < 200) {
                            // Fallback Strategy: Accumulate significant paragraphs
                            // This avoids getting just a menu or header string.
                            const container = $art('main').length ? $art('main') : ($art('article').length ? $art('article') : $art('body'));

                            // Clean container first
                            container.find('header, footer, nav, .sidebar, .comments, .related-posts, #comments, .menu, .skip-link, .widget-area, .site-header, .site-footer').remove();
                            container.find('script, style, iframe, form').remove();

                            // Collect paragraphs
                            const paragraphs = [];
                            container.find('p, span, div, li').each((i, el) => {
                                // Add spaces around block elements
                                const t = $art(el).text().replace(/\s+/g, ' ').trim();
                                if (t.length > 30) paragraphs.push(`<p>${t}</p>`);
                            });

                            if (paragraphs.length > 0) {
                                content = paragraphs.join('\n');
                            } else {
                                // Final desperation: Text-to-HTML
                                const rawText = container.prop('innerText') || container.text();
                                // Split by double newlines or punctuation followed by newline
                                const lines = rawText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 50);
                                if (lines.length > 0) {
                                    content = lines.map(l => `<p>${l}</p>`).join('\n');
                                    console.log(`Generated ${lines.length} paragraphs from raw text.`);
                                } else {
                                    content = container.html(); // Give up, save raw html
                                }
                            }
                        }

                        // Clean up content
                        const $content = cheerio.load(content || '');
                        $content('script, style, iframe, nav, footer, header, form, .sharedaddy, .related-posts, .addtoany_share_save_container, .meta, .post-meta').remove();
                        $content('div[class*="share"], div[class*="related"]').remove(); // Regex-like check for share/related divs
                        $content('a[href="#content"]').remove(); // Remove skip links

                        // Use HTML to preserve formatting for "Original" view
                        // CRITICAL FIX: Extract only body content to avoid saving <html><head> wrappers
                        const finalContent = $content('body').html() || '';

                        // Final validation
                        if (finalContent.length < 100) {
                            console.warn(`Content too short for ${url}, skipping.`);
                            return null;
                        }

                        // Date extraction
                        let publishedDate = $art('time').first().text().trim() || $art('.date').first().text().trim() || $art('.posted-on').text().trim() || new Date().toISOString();

                        return {
                            title,
                            slug: url.split('/').filter(Boolean).pop(),
                            sourceUrl: url,
                            content: finalContent, // Store HTML
                            publishedDate
                        };
                    }).catch(err => {
                        console.error(`Failed to fetch ${url}`, err.message);
                        return null;
                    })
                );
            }

            const results = await Promise.all(articlePromises);
            const validResults = results.filter(r => r !== null);

            articlesToSave.push(...validResults);

            currentPage--;
        }

        // Save to DB
        console.log(`Found ${articlesToSave.length} articles. Saving to DB...`);
        for (const art of articlesToSave) {
            await Article.findOneAndUpdate(
                { sourceUrl: art.sourceUrl },
                art,
                { upsert: true, new: true }
            );
        }
        console.log('Scrape complete.');

    } catch (error) {
        console.error('Scraping error:', error);
    }
}

module.exports = { scrapeBeyondChats };
