import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { convert, LOWERCASE_TRANSFORMER } from 'url-slug';

export const generateRandomHexColor = () =>
  Math.floor(Math.random() * Math.pow(255, 3));

export const getRootDirectory = () => dirname(fileURLToPath(import.meta.url));

export const slugify = (input: string) =>
  convert(input, {
    transformer: LOWERCASE_TRANSFORMER
  });
