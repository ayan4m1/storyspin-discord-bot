import 'dotenv/config';

type LlmConfig = {
  modelId: string;
  ollamaUrl: string;
  gpuLayers: number | 'auto';
  sampling: {
    temperature: number;
    topK: number;
    topP: number;
  };
  tokenRepeatPenalty: number;
};

const gpuLayers = parseInt(process.env.SS_LLM_GPU_LAYERS, 10);

export const llm: LlmConfig = {
  modelId: process.env.SS_LLM_MODEL_ID,
  ollamaUrl: process.env.SS_LLM_OLLAMA_URL,
  gpuLayers: isNaN(gpuLayers) ? 'auto' : gpuLayers,
  sampling: {
    temperature: parseFloat(process.env.SS_LLM_SAMPLING_TEMPERATURE || '0'),
    topK: parseFloat(process.env.SS_LLM_SAMPLING_TOP_K || '0'),
    topP: parseFloat(process.env.SS_LLM_SAMPLING_TOP_P || '1')
  },
  tokenRepeatPenalty: parseFloat(process.env.SS_LLM_TOKEN_REPEAT_PENALTY || '0')
};

export const discord = {
  botToken: process.env.SS_DISCORD_BOT_TOKEN,
  clientId: process.env.SS_DISCORD_CLIENT_ID,
  guildIds: (process.env.SS_DISCORD_GUILD_IDS || '').split(/,/),
  storyChannelId: process.env.SS_DISCORD_STORY_CHANNEL_ID,
  allenUserId: process.env.SS_DISCORD_ALLEN_USER_ID
};

export const logging = {
  level: process.env.SS_LOG_LEVEL || 'info',
  timestampFormat: process.env.SS_LOG_TIME_FMT
};
