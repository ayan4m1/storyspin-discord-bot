import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { convert, LOWERCASE_TRANSFORMER } from 'url-slug';

export const generateRandomHexColor = () =>
  Math.floor(Math.random() * Math.pow(4096, 2));

export const getRootDirectory = () => dirname(fileURLToPath(import.meta.url));

export const slugify = (input: string) =>
  convert(input, {
    transformer: LOWERCASE_TRANSFORMER
  });

export const getAnswerButtonRow = (id: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder({
      label: 'Extend',
      emoji: '➕',
      style: ButtonStyle.Primary,
      customId: `extend:${id}`
    })
  );

export const getStoryButtonRow = (threadId: string, userId: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder({
      label: 'Queue',
      emoji: '⏲️',
      style: ButtonStyle.Primary,
      customId: `queue:${threadId}:${userId}`
    })
  );
