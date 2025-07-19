const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const { File } = require('megajs');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');

async function uploadToGofile(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  // Step 1: Get server
  const serverRes = await axios.get('https://api.gofile.io/getServer');
  const server = serverRes.data.data.server;

  // Step 2: Upload file
  const uploadRes = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  if (uploadRes.data.status === 'ok') {
    return uploadRes.data.data.downloadPage;
  } else {
    throw new Error('Failed to upload to gofile');
  }
}

cmd({
  pattern: "mega",
  alias: ["megadl"],
  desc: "Download MEGA files with auto gofile.io upload if big",
  react: "📥",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.includes('mega.nz')) {
      return reply("❌ කරුණාකර වලංගු MEGA.nz ලින්ක් එකක් ලබාදෙන්න.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const file = File.fromURL(q);
    await file.loadAttributes();

    const fileName = file.name || "mega_file";
    const fileSize = file.size || 0;
    const savePath = path.join(__dirname, '..', 'tmp', fileName);

    // Download MEGA file
    const writeStream = fs.createWriteStream(savePath);
    const downloadStream = file.download();
    downloadStream.pipe(writeStream);

    downloadStream.on('error', (e) => {
      console.error("❌ MEGA Download Error:", e);
      reply("❌ ගොනුව ලබාගැනීමේදී දෝෂයක් සිදු විය.");
    });

    downloadStream.on('end', async () => {
      if (fileSize > 100 * 1024 * 1024) {
        // If file > 100MB upload to gofile.io
        await conn.sendMessage(from, { text: `⚠️ ගොනුව ${ (fileSize / (1024*1024)).toFixed(2) }MB බැරයි, gofile.io වෙත upload වෙමින්...` });
        try {
          const url = await uploadToGofile(savePath);
          await conn.sendMessage(from, { text:
            `📁 *MEGA File:* ${fileName}\n` +
            `📦 *Size:* ${(fileSize / (1024*1024)).toFixed(2)} MB\n` +
            `🔗 *Download Link:* ${url}\n\n${config.FOOTER}`
          }, { quoted: m });
        } catch (e) {
          console.error("❌ Gofile Upload Error:", e);
          reply("❌ gofile.io වෙත upload කිරීම අසාර්ථකයි.");
        }
        fs.unlink(savePath, () => {});
      } else {
        // If file <= 100MB send directly
        await conn.sendMessage(from, {
          document: { url: savePath },
          fileName: fileName,
          mimetype: "application/octet-stream",
          caption: `📁 *MEGA File:* ${fileName}\n📦 *Size:* ${(fileSize / (1024*1024)).toFixed(2)} MB\n\n${config.FOOTER}`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        fs.unlink(savePath, () => {});
      }
    });

  } catch (error) {
    console.error("❌ MEGA Command Error:", error);
    reply("❌ MEGA link එක ක්‍රියාවට නැහැ. කරුණාකර සත්‍ය ලින්ක් එකක් ලබාදෙන්න.");
  }
});
