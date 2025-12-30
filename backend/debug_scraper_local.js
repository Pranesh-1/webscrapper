const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://beyondchats.com/blogs';

async function testScrape() {
    console.log('Testing scraper...');

    // Get URLs first
    const { data: homeHtml } = await axios.get(BASE_URL);
    const $ = cheerio.load(homeHtml);
    const urls = [];
    $('h2 a').each((i, el) => {
        urls.push($(el).attr('href'));
    });

    console.log(`Found ${urls.length} articles on home page.`);

    for (const url of urls) {
        console.log(`\nScraping: ${url}`);
        try {
            const { data } = await axios.get(url);
            const $art = cheerio.load(data);

            // CURRENT LOGIC
            let content = $art('.entry-content').html() ||
                $art('.post-content').html() ||
                $art('article .content').html() ||
                $art('#main .post').html();

            if (!content || content.length < 200) {
                console.log("  [Fallback Triggered]");
                const container = $art('main').length ? $art('main') : ($art('article').length ? $art('article') : $art('body'));

                container.find('header, footer, nav, .sidebar, .comments, .related-posts, #comments, .menu, .skip-link, .widget-area, .site-header, .site-footer').remove();
                container.find('script, style, iframe, form').remove();

                const paragraphs = [];
                container.find('p').each((i, el) => {
                    const t = $art(el).text().trim();
                    if (t.length > 50) paragraphs.push(`<p>${t}</p>`);
                });

                if (paragraphs.length > 0) {
                    content = paragraphs.join('\n');
                } else {
                    content = container.html();
                }
            }

            const $content = cheerio.load(content || '');
            $content('script, style, iframe, nav, footer, header, form, .sharedaddy, .related-posts, .addtoany_share_save_container, .meta, .post-meta').remove();
            $content('div[class*="share"], div[class*="related"]').remove();

            const text = $content.text().replace(/\s+/g, ' ').trim();
            console.log(`  Length: ${text.length}`);
            console.log(`  Preview: ${text.substring(0, 100)}...`);

        } catch (e) {
            console.log(`  Error: ${e.message}`);
        }
    }
}

testScrape();
