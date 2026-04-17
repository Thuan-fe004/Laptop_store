// src/constants/config.js
const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') 
  : 'http://localhost:5000';

export const API_BASE_URL = API_BASE + '/api';
export const IMG_BASE_URL = API_BASE + '/static/uploads';

console.log('🔧 Config loaded - API:', API_BASE_URL);
console.log('🔧 Config loaded - Image:', IMG_BASE_URL);