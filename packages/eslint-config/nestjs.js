import globals from 'globals';
import base from './base.js';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
    },
  },
  ...base,
];
