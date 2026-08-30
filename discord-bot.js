import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API_SECRET = process.env.API_SECRET;
const API_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/players`
  : 'http://localhost:3000/api/players';

// Verify API_SECRET is configured
if (!API_SECRET) {
  console.error('ERROR: API_SECRET environment variable is not set. Discord bot will not be able to modify the leaderboard.');
}

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  registerCommands();
});

async function registerCommands() {
  const guild = await client.guilds.fetch(GUILD_ID);
  
  const addPlayerCommand = new SlashCommandBuilder()
    .setName('addplayer')
    .setDescription('Add a new player to the leaderboard')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Player username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('longrange')
        .setDescription('Long range tier (LT5, HT5, LT4, HT4, LT3, HT3, LT2, HT2, LT1, HT1)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('cqc')
        .setDescription('CQC tier (LT5, HT5, LT4, HT4, LT3, HT3, LT2, HT2, LT1, HT1, or N/A)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('region')
        .setDescription('Region (Europe, North America, South America, Asia, Middle East, Africa, Oceania)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('faction')
        .setDescription('Faction (optional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('avatar')
        .setDescription('Avatar URL (optional)')
        .setRequired(false)
    );

  const editPlayerCommand = new SlashCommandBuilder()
    .setName('editplayer')
    .setDescription('Edit a player\'s tiers')
    .addNumberOption(option =>
      option.setName('playerid')
        .setDescription('Player ID to edit')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('longrange')
        .setDescription('New long range tier')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('cqc')
        .setDescription('New CQC tier')
        .setRequired(true)
    );

  const deletePlayerCommand = new SlashCommandBuilder()
    .setName('deleteplayer')
    .setDescription('Delete a player from the leaderboard')
    .addNumberOption(option =>
      option.setName('playerid')
        .setDescription('Player ID to delete')
        .setRequired(true)
    );

  await guild.commands.set([
    addPlayerCommand,
    editPlayerCommand,
    deletePlayerCommand
  ]);

  console.log('✅ Slash commands registered');
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'addplayer') {
    await interaction.deferReply();
    
    try {
      const username = interaction.options.getString('username');
      const longrange = interaction.options.getString('longrange');
      const cqc = interaction.options.getString('cqc');
      const region = interaction.options.getString('region');
      const faction = interaction.options.getString('faction') || 'N/A';
      const avatar = interaction.options.getString('avatar') || 'https://www.roblox.com/avatar/?userId=0&format=png&size=150x150';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET}`
        },
        body: JSON.stringify({
          username,
          avatar,
          region,
          faction,
          longRangeTier: longrange,
          cqcTier: cqc
        })
      });

      if (response.ok) {
        const player = await response.json();
        await interaction.editReply({
          content: `✅ Player **${player.username}** added successfully!`
        });
      } else {
        const error = await response.json();
        await interaction.editReply({
          content: `❌ Error: ${error.error}`
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await interaction.editReply({
        content: `❌ Error adding player: ${error.message}`
      });
    }
  }

  if (interaction.commandName === 'editplayer') {
    await interaction.deferReply();
    
    try {
      const playerId = interaction.options.getNumber('playerid');
      const longrange = interaction.options.getString('longrange');
      const cqc = interaction.options.getString('cqc');

      const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET}`
        },
        body: JSON.stringify({
          id: playerId,
          longRangeTier: longrange,
          cqcTier: cqc
        })
      });

      if (response.ok) {
        await interaction.editReply({
          content: `✅ Player **${playerId}** updated successfully!`
        });
      } else {
        const error = await response.json();
        await interaction.editReply({
          content: `❌ Error: ${error.error}`
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await interaction.editReply({
        content: `❌ Error editing player: ${error.message}`
      });
    }
  }

  if (interaction.commandName === 'deleteplayer') {
    await interaction.deferReply();
    
    try {
      const playerId = interaction.options.getNumber('playerid');

      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET}`
        },
        body: JSON.stringify({ id: playerId })
      });

      if (response.ok) {
        await interaction.editReply({
          content: `✅ Player **${playerId}** deleted successfully!`
        });
      } else {
        const error = await response.json();
        await interaction.editReply({
          content: `❌ Error: ${error.error}`
        });
      }
    } catch (error) {
      console.error('Error:', error);
      await interaction.editReply({
        content: `❌ Error deleting player: ${error.message}`
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
