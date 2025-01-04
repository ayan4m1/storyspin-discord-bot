import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder
} from 'discord.js';

import { changeModel, listModels } from '../modules/llm.js';

export const data = new SlashCommandBuilder()
  .setName('model')
  .setDescription('Inspect or modify the LLM settings')
  .addSubcommand((cmd) =>
    cmd.setName('list').setDescription('List the active and available models')
  )
  .addSubcommand((cmd) =>
    cmd
      .setName('change')
      .setDescription('Changes the active model')
      .addStringOption((opt) =>
        opt
          .setName('model')
          .setDescription('The new model to use')
          .setRequired(true)
      )
  );

export const handler = async (interaction: ChatInputCommandInteraction) => {
  const { options } = interaction;
  const subcommand = options.getSubcommand(true);

  await interaction.deferReply({ ephemeral: true });

  switch (subcommand) {
    case 'list': {
      const models = await listModels();

      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            description: models.map((model) => ` * ${model}`).join('\n')
          })
        ]
      });
      break;
    }
    case 'change':
      await changeModel(options.getString('model', true));
      await interaction.editReply('New model loaded!');
      break;
  }
};
