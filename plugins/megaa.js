const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const { File } = require('megajs');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');

// 🔁 Gofile uploader function
async function uploadToGofile(filePath) {
  try {
    const { data: serverRes } = await axios.get('https://api.gofile.io/getServer');
    const server = serverRes.data.data.server;

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const { data: uploadRes } = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 2 * 60 * 1000
    });

    if (uploadRes.status === 'ok') {
      return uploadRes.data.downloadPage;
    } else {
      console.error("Gofile Upload Fail:", uploadRes);
      throw new Error('❌ Gofile upload failed.');
    }
  } catch (err) {
    console.error("Gofile Upload Error:", err);
    throw err;
  }
}

// 📥 MEGA downloader command
cmd({
  pattern: "mega",
  alias: ["megadl"],
  desc: "Download MEGA files & auto upload to gofile if large",
  react: "📥",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.includes('mega.nz')) {
      return reply("❌ වලංගු MEGA.nz ලින්ක් එකක් දෙන්න.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const file = File.fromURL(q);
    await file.loadAttributes();

    const fileName = file.name || "mega_file";
    const fileSize = file.size || 0;
    const savePath = path.join(__dirname, '..', 'tmp', fileName);

    const writeStream = fs.createWriteStream(savePath);
    const downloadStream = file.download();
    downloadStream.pipe(writeStream);

    downloadStream.on('error', (e) => {
      console.error("MEGA Download Error:", e);
      reply("❌ MEGA download fail.");
    });

    downloadStream.on('end', async () => {
      if (fileSize > 100 * 1024 * 1024) {
        await conn.sendMessage(from, { text: `⚠️ ගොනුව ${(fileSize / 1024 / 1024).toFixed(2)}MB බැරයි, gofile.io වෙත upload වෙමින්...` });

        try {
          const url = await uploadToGofile(savePath);
          await conn.sendMessage(from, {
            text:
              `📁 *MEGA File:* ${fileName}\n` +
              `📦 *Size:* ${(fileSize / 1024 / 1024).toFixed(2)} MB\n` +
              `🔗 *Download Link:* ${url}\n\n${config.FOOTER}`
          }, { quoted: m });
        } catch {
          reply("❌ gofile.io වෙත upload කිරීම අසාර්ථකයි.");
        }

        fs.unlink(savePath, () => {});
      } else {
        await conn.sendMessage(from, {
          document: { url: savePath },
          fileName: fileName,
          mimetype: "application/octet-stream",
          caption: `📁 *MEGA File:* ${fileName}\n📦 *Size:* ${(fileSize / 1024 / 1024).toFixed(2)} MB\n\n${config.FOOTER}`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        fs.unlink(savePath, () => {});
      }
    });

  } catch (error) {
    console.error("MEGA CMD ERROR:", error);
    reply("❌ ගොනුව ලබාගැනීමේදී දෝෂයක් සිදු විය.");
  }
});
