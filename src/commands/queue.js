import { SlashCommandBuilder } from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { enqueue } from '../modules/queue.js';

const log = getLogger('queue');

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Add yourself to the story queue');

export const handler = async (interaction) => {
  try {
    await interaction.deferReply();

    const position = enqueue(interaction.user.id);

    if (position === -1) {
      await interaction.editReply(`You are already in the queue!`);
    } else {
      await interaction.editReply(`You are #${position} in the queue!`);
    }
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Failed to queue...');
    } else {
      await interaction.reply('Failed to queue...');
    }
  }
};
