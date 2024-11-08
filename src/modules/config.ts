import 'dotenv/config';

export const llm = {
  modelFile: process.env.SS_LLM_MODEL_FILE
};

export const discord = {
  botToken: process.env.SS_DISCORD_BOT_TOKEN,
  clientId: process.env.SS_DISCORD_CLIENT_ID,
  guildIds: (process.env.SS_DISCORD_GUILD_IDS || '').split(/,/),
  storyChannelId: process.env.SS_DISCORD_STORY_CHANNEL_ID
};

export const logging = {
  level: process.env.SS_LOG_LEVEL || 'info',
  timestampFormat: process.env.SS_LOG_TIME_FMT
};
