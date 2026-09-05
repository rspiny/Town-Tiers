import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Environment variables (server-side only, never exposed to browser)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const TOWN_TIERS_API_URL = process.env.TOWN_TIERS_API_URL;
const API_SECRET = process.env.API_SECRET;

// Validate required environment variables on startup
if (!DISCORD_TOKEN) {
  console.error('❌ ERROR: DISCORD_TOKEN environment variable is not set!');
  process.exit(1);
}

if (!DISCORD_GUILD_ID) {
  console.error('❌ ERROR: DISCORD_GUILD_ID environment variable is not set!');
  process.exit(1);
}

if (!TOWN_TIERS_API_URL) {
  console.error('❌ ERROR: TOWN_TIERS_API_URL environment variable is not set!');
  console.error('   Example: https://your-deployment.vercel.app/api/players');
  process.exit(1);
}

if (!API_SECRET) {
  console.error('❌ ERROR: API_SECRET environment variable is not set!');
  console.error('   API mutations will fail. Set this to the same secret as your Vercel deployment.');
  process.exit(1);
}

// Valid tier values
const VALID_TIERS = ['LT5', 'HT5', 'LT4', 'HT4', 'LT3', 'HT3', 'LT2', 'HT2', 'LT1', 'HT1', 'N/A'];

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📡 API URL: ${TOWN_TIERS_API_URL}`);
  registerCommands();
});

async function registerCommands() {
  const guild = await client.guilds.fetch(DISCORD_GUILD_ID);

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
        .addChoices(
          { name: 'LT5', value: 'LT5' },
          { name: 'HT5', value: 'HT5' },
          { name: 'LT4', value: 'LT4' },
          { name: 'HT4', value: 'HT4' },
          { name: 'LT3', value: 'LT3' },
          { name: 'HT3', value: 'HT3' },
          { name: 'LT2', value: 'LT2' },
          { name: 'HT2', value: 'HT2' },
          { name: 'LT1', value: 'LT1' },
          { name: 'HT1', value: 'HT1' }
        )
    )
    .addStringOption(option =>
      option.setName('cqc')
        .setDescription('CQC tier (LT5, HT5, LT4, HT4, LT3, HT3, LT2, HT2, LT1, HT1, or N/A)')
        .setRequired(true)
        .addChoices(
          { name: 'LT5', value: 'LT5' },
          { name: 'HT5', value: 'HT5' },
          { name: 'LT4', value: 'LT4' },
          { name: 'HT4', value: 'HT4' },
          { name: 'LT3', value: 'LT3' },
          { name: 'HT3', value: 'HT3' },
          { name: 'LT2', value: 'LT2' },
          { name: 'HT2', value: 'HT2' },
          { name: 'LT1', value: 'LT1' },
          { name: 'HT1', value: 'HT1' },
          { name: 'N/A', value: 'N/A' }
        )
    )
    .addStringOption(option =>
      option.setName('region')
        .setDescription('Region')
        .setRequired(true)
        .addChoices(
          { name: 'Europe', value: 'Europe' },
          { name: 'North America', value: 'North America' },
          { name: 'South America', value: 'South America' },
          { name: 'Asia', value: 'Asia' },
          { name: 'Middle East', value: 'Middle East' },
          { name: 'Africa', value: 'Africa' },
          { name: 'Oceania', value: 'Oceania' }
        )
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
        .addChoices(
          { name: 'LT5', value: 'LT5' },
          { name: 'HT5', value: 'HT5' },
          { name: 'LT4', value: 'LT4' },
          { name: 'HT4', value: 'HT4' },
          { name: 'LT3', value: 'LT3' },
          { name: 'HT3', value: 'HT3' },
          { name: 'LT2', value: 'LT2' },
          { name: 'HT2', value: 'HT2' },
          { name: 'LT1', value: 'LT1' },
          { name: 'HT1', value: 'HT1' }
        )
    )
    .addStringOption(option =>
      option.setName('cqc')
        .setDescription('New CQC tier')
        .setRequired(true)
        .addChoices(
          { name: 'LT5', value: 'LT5' },
          { name: 'HT5', value: 'HT5' },
          { name: 'LT4', value: 'LT4' },
          { name: 'HT4', value: 'HT4' },
          { name: 'LT3', value: 'LT3' },
          { name: 'HT3', value: 'HT3' },
          { name: 'LT2', value: 'LT2' },
          { name: 'HT2', value: 'HT2' },
          { name: 'LT1', value: 'LT1' },
          { name: 'HT1', value: 'HT1' },
          { name: 'N/A', value: 'N/A' }
        )
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

      // Validate tier values
      if (!VALID_TIERS.includes(longrange)) {
        return await interaction.editReply(`❌ Error: Invalid long range tier "${longrange}"`);
      }
      if (!VALID_TIERS.includes(cqc)) {
        return await interaction.editReply(`❌ Error: Invalid CQC tier "${cqc}"`);
      }

      const response = await fetch(TOWN_TIERS_API_URL, {
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

      const data = await response.json();

      if (response.ok) {
        await interaction.editReply(
          `✅ Player **${data.username}** added successfully! (ID: ${data.id})`
        );
      } else {
        await interaction.editReply(
          `❌ Error: ${data.error || 'Failed to add player'}`
        );
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

      // Validate tier values
      if (!VALID_TIERS.includes(longrange)) {
        return await interaction.editReply(`❌ Error: Invalid long range tier "${longrange}"`);
      }
      if (!VALID_TIERS.includes(cqc)) {
        return await interaction.editReply(`❌ Error: Invalid CQC tier "${cqc}"`);
      }

      const response = await fetch(TOWN_TIERS_API_URL, {
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
        await interaction.editReply(
          `✅ Player **${data.username}** updated! (${data.longRangeTier}/${data.cqcTier})`
        );
      } else {
        await interaction.editReply(
          `❌ Error: ${data.error || 'Failed to update player'}`
        );
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

      const response = await fetch(TOWN_TIERS_API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET}`
        },
        body: JSON.stringify({ id: playerId })
      });

      const data = await response.json();

      if (response.ok) {
        await interaction.editReply(
          `✅ Player **${data.username}** deleted from the leaderboard.`
        );
      } else {
        await interaction.editReply(
          `❌ Error: ${data.error || 'Failed to delete player'}`
        );
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      await interaction.editReply(`❌ Error: ${error.message}`);
    }
  }
});

client.login(DISCORD_TOKEN);
