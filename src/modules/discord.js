import {
  REST,
  Routes,
  Client,
  Collection,
  GatewayIntentBits,
  InteractionType
} from 'discord.js';
import { readdirSync } from 'fs';

import { discord as config } from './config.js';
import { getLogger } from './logging.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});
const log = getLogger('discord');

export const loadCommands = async () =>
  await Promise.all(
    readdirSync('./src/commands')
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => await import(`../commands/${file}`))
  );

export const loadHandlers = async () =>
  await Promise.all(
    readdirSync('./src/handlers')
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => [
        file.replace('.js', ''),
        await import(`../handlers/${file}`)
      ])
  );

const registerHandlers = (handlers) => {
  if (!handlers) {
    return;
  }

  for (const [event, handler] of Object.entries(handlers)) {
    log.info(`Registering event handler for ${event}`);
    client.on(event, handler);
  }
};

export const registerCommandsAndHandlers = async () => {
  client.commands = new Collection();

  const commands = await loadCommands();

  for (const command of commands) {
    client.commands.set(command.data.name, command);
    log.info(`Registered command ${command.data.name}`);
  }

  const handlers = await loadHandlers();

  for (const [handler, { eventHandlers }] of handlers) {
    log.info(
      `Registering ${
        Object.values(eventHandlers).length
      } handlers for ${handler}`
    );

    registerHandlers(eventHandlers);
  }
};

export const syncCommands = async () => {
  try {
    const rest = new REST({ version: '9' }).setToken(config.botToken);

    log.info('Syncing slash commands...');

    const commands = (await loadCommands()).map((command) =>
      command.data.toJSON()
    );

    for (const guildId of config.guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        {
          body: commands
        }
      );
    }

    log.info('Synced slash commands!');
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
  }
};

export const postEmbed = async (interaction, embed, elements = []) => {
  if (!interaction || !embed || !Array.isArray(elements)) {
    log.warn('Invalid arguments supplied to postEmbed!');
    return;
  }

  let { description } = embed;

  if (!description) {
    description = '';
  }

  for (const element of elements) {
    if (element.length + description.length >= 2048) {
      embed.setDescription(description);
      await interaction.followUp({ embeds: [embed] });
      description = '';
    }

    description += element;
  }

  if (description !== '') {
    embed.setDescription(description);
    await interaction.followUp({ embeds: [embed] });
  }
};

export const connectBot = async () =>
  new Promise((resolve, reject) => {
    try {
      if (!config.botToken) {
        throw new Error('No bot token, cannot connect to Discord!');
      }

      client.login(config.botToken);
      client.once('ready', resolve);
    } catch (error) {
      log.error(error);
      reject(error);
    }
  });

export const disconnectBot = client.destroy;

const findUserInGuilds = async (discordUserId) => {
  for (const guildId of config.guildIds) {
    const guild = client.guilds.resolve(guildId);
    const user = await guild.members.fetch(discordUserId);

    if (user) {
      return user;
    }
  }

  return null;
};

export const getDirectMessageChannel = async (discordUserId) => {
  const user = await findUserInGuilds(discordUserId);

  if (!user) {
    return null;
  }

  return user.createDM();
};

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.type !== InteractionType.ApplicationCommand) {
      return;
    }

    const { commandName } = interaction;
    const command = client.commands.get(commandName);

    if (!command) {
      return log.warn(`Did not find a handler for ${commandName}`);
    }

    await command.handler(interaction);
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);

    const message = {
      content: 'There was an error executing this command!',
      ephemeral: true
    };

    if (interaction.deferred) {
      await interaction.editReply(message);
    } else if (!interaction.replied) {
      await interaction.reply(message);
    } else {
      await interaction.followUp(message);
    }
  }
});
