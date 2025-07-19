const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const FormData = require("form-data");

async function uploadToGofile(filePath) {
    try {
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));

        const response = await axios.post("https://api.gofile.io/uploadFile", form, {
            headers: form.getHeaders(),
        });

        if (response.data.status === "ok") {
            return response.data.data.downloadPage;
        } else {
            return null;
        }
    } catch (err) {
        console.error("Gofile upload error:", err);
        return null;
    }
}

cmd({
    pattern: "ssub",
    alias: ["sinhalasub", "sinmovie"],
    react: '🎥',
    category: "download",
    desc: "Download SinhalaSub movies",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q || !q.includes('sinhalasub.lk')) {
            return await reply('❌ කරුණාකර *sinhalasub.lk* ලින්ක් එකක් ලබාදෙන්න.');
        }

        await reply("🔄 Download link generate වෙමින්...");

        const apiUrl = `https://supun-md-mv.vercel.app/api/sinhalasub/dl?url=${encodeURIComponent(q)}`;
        const apiRes = await fetchJson(apiUrl);

        if (!apiRes || !apiRes.url || !apiRes.name) {
            return await reply("❌ Download link ලබාගැනීම අසාර්ථකයි.");
        }

        const fileUrl = apiRes.url;
        const fileName = apiRes.name.endsWith(".mp4") || apiRes.name.endsWith(".mkv")
            ? apiRes.name
            : apiRes.name + ".mp4";

        const filePath = path.join(os.tmpdir(), fileName);
        await reply(`📥 බාගත කරමින්: *${fileName}*`);

        const writer = fs.createWriteStream(filePath);
        const { data } = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream'
        });

        data.pipe(writer);

        writer.on('finish', async () => {
            const stats = fs.statSync(filePath);
            const fileSizeMB = stats.size / (1024 * 1024);

            if (fileSizeMB > 100) {
                await reply(`⚠️ ගොනුව ${fileSizeMB.toFixed(2)}MB බැරයි, gofile.io වෙත upload වෙමින්...`);

                const gofileLink = await uploadToGofile(filePath);

                if (gofileLink) {
                    await conn.sendMessage(from, {
                        text: `✅ *${fileName}* uploaded successfully!\n📥 Download: ${gofileLink}`,
                        quoted: mek
                    });
                } else {
                    await reply("❌ gofile.io වෙත upload කිරීම අසාර්ථකයි.");
                }

                fs.unlinkSync(filePath);
            } else {
                await conn.sendMessage(from, {
                    document: fs.readFileSync(filePath),
                    mimetype: 'video/mp4',
                    fileName: fileName,
                    caption: `🎬 *${fileName}*\n✅ SinhalaSub Download Complete!`,
                    quoted: mek
                });
                fs.unlinkSync(filePath);
            }
        });

        writer.on('error', async (err) => {
            console.error("Download Error:", err);
            await reply('❌ Movie එක බාගත වෙද්දී දෝෂයක් සිදු විය.');
        });
    } catch (error) {
        console.error("Plugin Error:", error);
        await reply('❌ අභ්‍යන්තර දෝෂයක්. පසුව නැවත උත්සහ කරන්න.');
    }
});
