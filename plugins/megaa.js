const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

let lastSearchResults = {};

cmd({
    pattern: 'ssubsearch',
    desc: 'Search SinhalaSub.lk subtitles',
    category: 'download',
    react: '🔎',
    filename: __filename
}, async (conn, m, mek, { q, reply, from }) => {
    try {
        if (!q) return reply('❌ Please provide a movie name to search.');

        const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        const results = [];

        $('.post-title.entry-title a').each((i, el) => {
            if (i >= 5) return false; // max 5 results
            const title = $(el).text().trim();
            const link = $(el).attr('href');
            if (title && link) results.push({ title, link });
        });

        if (results.length === 0) return reply(`❌ No subtitles found for *${q}*`);

        let msg = `🔎 *Search results for:* ${q}\n\n`;
        results.forEach((item, i) => {
            msg += `*${i+1}.* ${item.title}\n${item.link}\n\n`;
        });
        msg += `*Use* .ssubdl <number> *to download subtitle.*\n\n_Example:_ .ssubdl 1`;

        // Save results by user id
        lastSearchResults[m.sender] = results;

        await reply(msg);

    } catch (error) {
        console.error(error);
        reply('❌ Search failed. Try again later.');
    }
});


cmd({
    pattern: 'ssubdl',
    desc: 'Download subtitle by search result number',
    category: 'download',
    react: '⬇️',
    filename: __filename
}, async (conn, m, mek, { q, reply, from }) => {
    try {
        if (!q) return reply('❌ Please provide the result number to download.');

        const num = parseInt(q);
        if (isNaN(num) || num < 1) return reply('❌ Invalid number.');

        const results = lastSearchResults[m.sender];
        if (!results || results.length < num) return reply('❌ No saved search results found or invalid number.');

        const selected = results[num - 1];
        if (!selected) return reply('❌ Invalid selection.');

        // Fetch subtitle download page
        const response = await axios.get(selected.link);
        const $ = cheerio.load(response.data);

        // Find the download link - usually on anchor with text containing 'Download' or class "download-button"
        let downloadLink = '';

        $('a').each((i, el) => {
            const text = $(el).text().toLowerCase();
            if (text.includes('download') && $(el).attr('href')) {
                downloadLink = $(el).attr('href');
                return false; // break loop
            }
        });

        if (!downloadLink) return reply('❌ Download link not found.');

        const fileName = selected.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.zip';
        const filePath = path.join(os.tmpdir(), fileName);

        // Download subtitle zip
        const writer = fs.createWriteStream(filePath);
        const { data } = await axios({
            url: downloadLink,
            method: 'GET',
            responseType: 'stream'
        });

        data.pipe(writer);

        writer.on('finish', async () => {
            await conn.sendMessage(from, {
                document: fs.readFileSync(filePath),
                mimetype: 'application/zip',
                fileName: fileName,
                caption: `⬇️ *${selected.title}* subtitle downloaded.`,
                quoted: mek
            });
            fs.unlinkSync(filePath);
        });

        writer.on('error', async (err) => {
            console.error('Download error:', err);
            await reply('❌ Subtitle download failed.');
        });

    } catch (error) {
        console.error(error);
        reply('❌ Something went wrong during download.');
    }
});
