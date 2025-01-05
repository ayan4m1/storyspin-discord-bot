import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder
} from 'discord.js';

import { changeModel, getActiveModel, listModels } from '../modules/llm.js';
import { getLogger } from '../modules/logging.js';

const log = getLogger('model');

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
      const activeModel = getActiveModel();
      const models = await listModels();

      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            description: models
              .map(
                (model) =>
                  ` * ${model === activeModel ? `**${model}**` : model}`
              )
              .join('\n')
          })
        ]
      });
      break;
    }
    case 'change':
      try {
        await changeModel(options.getString('model', true));
        await interaction.editReply('New model loaded!');
      } catch (error) {
        log.error(error.message);
        log.error(error.stack);
        await interaction.editReply('Failed to load new model!');
      }
      break;
  }
};
