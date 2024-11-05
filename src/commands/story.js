import { SlashCommandBuilder } from 'discord.js';
import { getLogger } from '../modules/logging.js';

const log = getLogger('story');

export const data = new SlashCommandBuilder()
  .setName('story')
  .setDescription('Manage the active story')
  .addSubcommand((subCmd) =>
    subCmd
      .setName('reset')
      .setDescription('Resets the context of the active story')
  );

export const handler = async (interaction) => {
  try {
    await interaction.deferReply();

    const { options } = interaction;
    const subCmd = options.getSubcommand(true);

    console.dir(subCmd);

    await interaction.editReply('OK!');
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Failed to modify story...');
    } else {
      await interaction.reply('Failed to modify story...');
    }
  }
};
