import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder
} from 'discord.js';

import { askQuestion } from '../modules/llm.js';
import { getLogger } from '../modules/logging.js';
import { createUserEmbed } from '../modules/discord.js';
import { queueTask } from '../modules/queue.js';

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

export const handler = async (interaction: ChatInputCommandInteraction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const { options, user } = interaction;
    const member = interaction.member as GuildMember;
    const prompt = options.getString('prompt', true);
    const result = await queueTask(askQuestion(prompt));

    await interaction.editReply('Answered!');
    await interaction.channel.send({
      embeds: [createUserEmbed(member, user, `**${prompt}**\n\n${result}`)]
    });
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Failed to ask question...');
    } else {
      await interaction.reply('Failed to ask question...');
    }
  }
};
