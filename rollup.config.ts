import typescript from '@rollup/plugin-typescript';
import autoExternal from 'rollup-plugin-auto-external';
import multiInput from '@ayan4m1/rollup-plugin-multi-input';

export default {
  input: './src/**/*.ts',
  output: {
    dir: './lib',
    format: 'esm'
  },
  plugins: [
    autoExternal({
      builtins: true
    }),
    typescript(),
    multiInput()
  ]
};
