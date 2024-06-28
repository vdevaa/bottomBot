const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();  // Load environment variables from .env file

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.content === '!ping') {
        await message.channel.send('Pong!');
    }

    if (message.content === '!deaths') {
        try {
            console.log('Sending request to RealmEye...');
            const response = await axios.get('https://www.realmeye.com/recent-deaths-in-guild/Bottom%20Text', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }
            });
            console.log('Status:', response.status);
            console.log('Headers:', response.headers);

            const $ = cheerio.load(response.data);
            const deaths = [];
            $('table.tablesorter tbody tr').each((index, element) => {
                const name = $(element).find('td:nth-child(2)').text().trim();
                const diedOn = $(element).find('td:nth-child(3)').text().trim();
                const totalFame = $(element).find('td:nth-child(5)').text().trim();
                const killedBy = $(element).find('td:nth-child(8)').text().trim();
                const maxStat = $(element).find('td:nth-child(7)').text().trim();

                if (name && diedOn && totalFame && killedBy) {
                    deaths.push({ name, diedOn, totalFame, killedBy, maxStat });
                }
            });

            if (deaths.length === 0) {
                await message.channel.send('No recent deaths found.');
                return;
            }

            const recentDeaths = deaths.slice(0, 5);
            const deathMessages = recentDeaths.map((death, index) => {
                return `**${index + 1}. ${death.name} (${death.maxStat})\n**Died On:** ${death.diedOn.replace('T', ' ').replace('Z', '')}\n**Total Fame:** ${death.totalFame}\n**Killed By:** ${death.killedBy}`;
            });

            await message.channel.send(deathMessages.join('\n\n'));
        } catch (error) {
            console.error('Error fetching or sending data:', error);
            await message.channel.send('An error occurred while fetching recent deaths.');
        }
    }
});

const token = process.env.DISCORD_TOKEN;  // Read token from .env file
client.login(token);
