const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');
const FormData = require('form-data');

const TOKEN = ""; 
const PREFIX = "!"; 

const client = new Client({ checkUpdate: false });

async function uploadToGoFile(url) {
    try {
        const { data: sData } = await axios.get('https://api.gofile.io/servers');
        if (sData.status !== 'ok') return null;
        const server = sData.data.servers[0].name;

        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const fileName = url.split('/').pop().split('?')[0] || 'file.bin';

        const form = new FormData();
        form.append('file', response.data, fileName);

        const { data: uData } = await axios.post(`https://${server}.gofile.io/contents/uploadfile`, form, {
            headers: form.getHeaders()
        });

        return uData.status === 'ok' ? uData.data.downloadPage : null;
    } catch (err) {
        return null;
    }
}

client.on('ready', () => {
    console.log(`✅ Connecté sur : ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.id !== client.user.id) return;

    if (message.content.startsWith(PREFIX + 'gofile')) {
        const args = message.content.split(' ');
        let targetUrl = args[1] || (message.attachments.size > 0 ? message.attachments.first().url : null);

        if (!targetUrl) return;

        const statusMsg = await message.edit('⏳ Upload vers GoFile...');
        const link = await uploadToGoFile(targetUrl);
        await statusMsg.edit(link ? `✅ **Lien :** ${link}` : '❌ Échec de l\'upload.');
    }

    if (message.content.includes('cdn.discordapp.com') && !message.content.startsWith(PREFIX)) {
        const urlMatch = message.content.match(/https?:\/\/cdn\.discordapp\.com\/\S+/);
        if (urlMatch) {
            const link = await uploadToGoFile(urlMatch[0]);
            if (link) {
                await message.reply({ 
                    content: `📦 **Mirror GoFile :** ${link}`, 
                    allowedMentions: { repliedUser: false } 
                });
            }
        }
    }
});

client.login(TOKEN);