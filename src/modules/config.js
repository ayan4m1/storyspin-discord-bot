import 'dotenv/config';

export const diffusion = {
  apiUrl: process.env.SD_DIFFUSION_API_URL
};

export const discord = {
  botToken: process.env.SD_DISCORD_BOT_TOKEN,
  clientId: process.env.SD_DISCORD_CLIENT_ID,
  guildIds: (process.env.SD_DISCORD_GUILD_IDS || '').split(/,/),
  notifyChannelId: process.env.SD_DISCORD_NOTIFY_CHANNEL_ID
};

export const logging = {
  level: process.env.SD_LOG_LEVEL || 'info',
  timestampFormat: process.env.SD_LOG_TIME_FMT
};

export const quota = {
  concurrency: parseInt(process.env.SD_QUOTA_CONCURRENCY || 1, 10),
  requestsPerMinute: parseInt(process.env.SD_QUOTA_REQUESTS_PER_MINUTE || 1, 10)
};
