import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import base from './base.js';

export default [...coreWebVitals, ...nextTypescript, ...base];
