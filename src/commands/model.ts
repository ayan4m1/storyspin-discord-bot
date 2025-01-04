import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { changeModel } from '../modules/llm.js';

export const data = new SlashCommandBuilder()
  .setName('model')
  .setDescription('Changes the current LLM')
  .addStringOption((opt) =>
    opt
      .setName('model')
      .setDescription('The new model to use')
      .setRequired(true)
  );

export const handler = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply({ ephemeral: true });
  await changeModel(interaction.options.getString('model', true));
  await interaction.editReply('New model loaded!');
};
