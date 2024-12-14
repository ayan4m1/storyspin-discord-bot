import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder
} from 'discord.js';

import { askColor } from '../modules/llm.js';
import { queueTask } from '../modules/queue.js';
import { getLogger } from '../modules/logging.js';
import { createUserEmbed } from '../modules/discord.js';

const log = getLogger('color');

export const data = new SlashCommandBuilder()
  .setName('color')
  .setDescription('Generate a color palette.')
  .addStringOption((opt) =>
    opt
      .setName('color')
      .setDescription('The color to use as a base.')
      .setRequired(true)
  );

export const handler = async (interaction: ChatInputCommandInteraction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const { options, user } = interaction;
    const member = interaction.member as GuildMember;
    const prompt = options.getString('color', true);
    const result = await queueTask(askColor(prompt));

    await interaction.editReply('Answered!');
    await interaction.channel.send({
      embeds: [
        createUserEmbed(member, user, `**${prompt}**\n${result.response}`)
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`extend:${result.id}`)
            .setLabel('Extend')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Failed to ask about color...');
    } else {
      await interaction.reply('Failed to ask about color...');
    }
  }
};
