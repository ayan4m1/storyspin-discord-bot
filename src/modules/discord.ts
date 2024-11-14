import {
  REST,
  Routes,
  Client,
  Collection,
  GatewayIntentBits,
  InteractionType,
  SlashCommandBuilder,
  Interaction,
  GuildMember,
  User,
  EmbedBuilder,
  Events
} from 'discord.js';
import { readdirSync } from 'fs';

import { discord as config } from './config.js';
import { getLogger } from './logging.js';
import { getContributorColor } from './queue.js';

type Command = {
  data: SlashCommandBuilder;
  handler: (interaction: Interaction) => Promise<void>;
};

const commandRegistry = new Collection<string, Command>();
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});
const log = getLogger('discord');

export const loadCommands = async (): Promise<Command[]> =>
  await Promise.all(
    readdirSync('./lib/commands')
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => await import(`../commands/${file}`))
  );

export const loadHandlers = async () => {
  const result = new Map<string, (interaction: Interaction) => Promise<void>>();
  const results = await Promise.all(
    readdirSync('./lib/handlers')
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => [
        file.replace('.js', ''),
        await import(`../handlers/${file}`)
      ])
  );

  for (const [event, handler] of results) {
    result.set(event, handler);
  }

  return result;
};

export const registerCommandsAndHandlers = async () => {
  const commands = await loadCommands();

  for (const command of commands) {
    commandRegistry.set(command.data.name, command);
    log.info(`Registered command ${command.data.name}`);
  }

  const handlers = await loadHandlers();

  for (const [name, eventHandlers] of handlers.entries()) {
    log.info(
      `Registering ${Object.values(eventHandlers).length} handlers for ${name}`
    );

    for (const [event, handler] of Object.entries(eventHandlers)) {
      log.info(`Registering event handler for ${event}`);
      client.on(event, handler);
    }
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

export const connectBot = async (): Promise<Client> =>
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
  for (const guildId of client.guilds.cache.values()) {
    const guild = client.guilds.resolve(guildId);
    const user = await guild.members.fetch(discordUserId);

    if (user) {
      return user;
    }
  }

  return null;
};

export const getStoryChannel = async () => {
  for (const guild of client.guilds.cache.values()) {
    const channel = guild.channels.resolve(config.storyChannelId);

    if (channel) {
      return channel;
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

export const createUserEmbed = (
  member: GuildMember,
  user: User,
  message: string
) =>
  new EmbedBuilder({
    author: {
      name: member?.nickname ?? user.username,
      icon_url: member.avatarURL()
    },
    color: getContributorColor(user.id),
    description: message
  });

export const createSystemEmbed = (message: string) =>
  new EmbedBuilder({
    author: {
      name: 'StorySpin',
      icon_url:
        'https://cdn.discordapp.com/app-icons/1303161150363537508/3cccf7b784a89c14f6e475387cf5e1d1.png?size=512'
    },
    color: 0x2e9fe7,
    description: message
  });

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.type !== InteractionType.ApplicationCommand) {
      return;
    }

    const { commandName } = interaction;
    const command = commandRegistry.get(commandName);

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

    if (!interaction.isCommand()) {
      return;
    }

    if (interaction.deferred) {
      await interaction.editReply(message);
    } else if (!interaction.replied) {
      await interaction.reply(message);
    } else {
      await interaction.followUp(message);
    }
  }
});
