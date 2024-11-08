import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const generateRandomHexColor = () =>
  Math.floor(Math.random() * Math.pow(255, 3));

export const getRootDirectory = () => {
  return dirname(fileURLToPath(import.meta.url));
};
