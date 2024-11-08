import { SlashCommandBuilder } from 'discord.js';

import { askQuestion } from '../modules/llm.js';
import { getLogger } from '../modules/logging.js';

const log = getLogger('ask');

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask the model a question.')
  .addStringOption((opt) =>
    opt
      .setName('prompt')
      .setDescription('The question to ask')
      .setRequired(true)
  );

export const handler = async (interaction) => {
  try {
    await interaction.deferReply();

    const { options } = interaction;
    const result = await askQuestion(options.getString('prompt', true));

    await interaction.editReply(result);
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
