import typescript from '@rollup/plugin-typescript';
import autoExternal from 'rollup-plugin-auto-external';

export default {
  input: './src/index.ts',
  output: {
    file: './lib/index.js',
    format: 'esm'
  },
  plugins: [
    autoExternal({
      builtins: true
    }),
    typescript()
  ]
};
