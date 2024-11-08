import { getLogger } from '../modules/logging.js';

const log = getLogger('buttons');

export const eventHandlers = {
  interactionCreate: async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }

    try {
      // todo: destructure "member, user" here
      const { customId } = interaction;
      const [verb, uuid, parameter] = customId.split(/:/);

      await interaction.deferReply();

      if (!verb || !uuid || !parameter) {
        throw new Error('Invalid verb/uuid/parameter!');
      }

      // todo: handle uuid and parameter
    } catch (error) {
      log.error(error.message);
      log.error(error.stack);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('Failed to respond to button click...');
      } else {
        await interaction.reply('Failed to respond to button click...');
      }
    }
  }
};
