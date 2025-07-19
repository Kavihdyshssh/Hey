const { cmd } = require('../command');

cmd({
    pattern: 'ka',
    desc: 'Forward quoted message to a number or group',
    category: 'owner',
    use: '.fwd <number or group jid>',
    react: '➡️',
    filename: __filename
}, async (conn, m, msg, { args, quoted, isOwner }) => {
    if (!isOwner) return msg.reply('Only owner can use this command.');

    if (!quoted) return msg.reply('Please reply to a message to forward.');

    if (!args[0]) return msg.reply('Please provide the number or group ID to forward to.\nExample: .fwd 9477xxxxxxx');

    let jid = args[0];
    if (!jid.includes('@')) {
        // Assume it's a phone number, add WhatsApp suffix
        if (jid.length > 0 && !jid.endsWith('@s.whatsapp.net')) {
            jid = jid + '@s.whatsapp.net';
        }
    }

    try {
        await conn.forwardMessage(jid, m.quoted, false, { readViewOnce: true });
        msg.reply(`✅ Message forwarded to ${jid}`);
    } catch (err) {
        console.error(err);
        msg.reply('❌ Failed to forward the message.');
    }
});
