import { basename, join } from 'path';
import { globby } from 'globby';
import {
  AutocompleteInteraction,
  ButtonInteraction,
  Interaction
} from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { getRootDirectory } from '../utils/index.js';

const log = getLogger('handler');

const handleButton = async (interaction: ButtonInteraction) => {
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
};

const handleAutocomplete = async (interaction: AutocompleteInteraction) => {
  try {
    if (interaction.commandName === 'story') {
      const files = await globby(
        join(getRootDirectory(), 'contexts', '*.json')
      );

      await interaction.respond(
        files.map((fileName) => ({
          name: basename(fileName, '.json'),
          value: fileName
        }))
      );
    }
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
  }
};

export const eventHandlers = {
  interactionCreate: async (interaction: Interaction) => {
    if (interaction.isButton()) {
      return handleButton(interaction);
    } else if (interaction.isAutocomplete()) {
      return handleAutocomplete(interaction);
    }
  }
};
