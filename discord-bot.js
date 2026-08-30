import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API_URL = process.env.API_URL;
const API_SECRET = process.env.API_SECRET;

// Validate environment variables on startup
if (!API_URL) {
  console.error('❌ ERROR: API_URL environment variable is not set!');
  console.error('   Set it to: https://town-tiers-vu3e.vercel.app/api/players');
  process.exit(1);
}

if (!API_SECRET) {
  console.error('❌ WARNING: API_SECRET environment variable is not set!');
  console.error('   API mutations will fail. Set a secure random string.');
}

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📡 API URL: ${API_URL}`);
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
      const avatar = interaction.options.getString('avatar') || undefined;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET}`
        },
        body: JSON.stringify({
          username,
          longRangeTier: longrange,
          cqcTier: cqc,
          region,
          faction,
          avatar
        })
      });

      const data = await response.json();

      if (response.ok) {
        await interaction.editReply(`✅ Player **${username}** added to the leaderboard! (ID: ${data.id})`);
      } else {
        await interaction.editReply(`❌ Error: ${data.error || 'Failed to add player'}`);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      await interaction.editReply(`❌ Error: ${error.message}`);
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

      const data = await response.json();

      if (response.ok) {
        await interaction.editReply(`✅ Player **${data.username}** updated! (${data.longRangeTier}/${data.cqcTier})`);
      } else {
        await interaction.editReply(`❌ Error: ${data.error || 'Failed to update player'}`);
      }
    } catch (error) {
      console.error('Error editing player:', error);
      await interaction.editReply(`❌ Error: ${error.message}`);
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

      const data = await response.json();

      if (response.ok) {
        await interaction.editReply(`✅ Player **${data.username}** deleted from the leaderboard.`);
      } else {
        await interaction.editReply(`❌ Error: ${data.error || 'Failed to delete player'}`);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      await interaction.editReply(`❌ Error: ${error.message}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
