const fs = require('fs');
const cheerio = require('cheerio');

try {
    const html = fs.readFileSync('ddg_lite_debug.html', 'utf8');
    const $ = cheerio.load(html);

    console.log('Title:', $('title').text());
    console.log('Body Text Snippet:', $('body').text().substring(0, 500).replace(/\s+/g, ' '));
    console.log('H1:', $('h1').text());
    console.log('Forms:', $('form').length);
    console.log('Inputs:', $('input').map((i, el) => $(el).attr('name')).get().join(', '));
} catch (e) {
    console.log("Error reading debug file:", e.message);
}
