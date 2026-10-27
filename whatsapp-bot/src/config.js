const path = require('path');

// Si corre empaquetado como .exe usa la carpeta del ejecutable; si corre con node usa la carpeta whatsapp-bot
const baseDir = process.pkg 
  ? path.dirname(process.execPath) 
  : path.join(__dirname, '..');

const PORT = process.env.PORT || 3001;
const SCHEDULE_FILE = path.join(baseDir, 'scheduled_messages.json');
const SESSION_DATA_PATH = path.join(baseDir, 'session');

const MAX_AVATAR_IMAGE_CACHE = 250;
const MAX_RECENT_MESSAGES = 250;

// Función para validar si el origen está permitido (soporta localhost, IPs locales y producción)
function isAllowedOrigin(origin) {
  if (!origin) return true; // Peticiones locales o herramientas como curl/Postman

  // localhost o 127.0.0.1 con cualquier puerto y protocolo (http o https)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;

  // Redes locales privadas (192.168.x.x, 10.x.x.x, 172.16-31.x.x) con cualquier puerto y protocolo
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(origin)) return true;

  // Dominios de producción / Vercel
  if (/^https:\/\/.*\.vercel\.app$/i.test(origin) || origin === 'https://minutas.vercel.app') return true;

  return false;
}

module.exports = {
  PORT,
  SCHEDULE_FILE,
  SESSION_DATA_PATH,
  MAX_AVATAR_IMAGE_CACHE,
  MAX_RECENT_MESSAGES,
  isAllowedOrigin
};
