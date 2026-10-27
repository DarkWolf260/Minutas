function extractThumbnail(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const str = raw.trim();
  if (str.startsWith('data:image/')) return str;
  if (/^https?:\/\//i.test(str)) return str;
  let clean = str;
  if (clean.includes('base64,')) {
    clean = clean.split('base64,')[1];
  }
  clean = clean.replace(/\s+/g, '');
  if (clean.length > 20) {
    if (clean.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${clean}`;
    }
    if (clean.startsWith('UklGR')) {
      return `data:image/webp;base64,${clean}`;
    }
    if (clean.startsWith('iVBORw0KGgo')) {
      return `data:image/png;base64,${clean}`;
    }
    if (clean.startsWith('R0lGOD')) {
      return `data:image/gif;base64,${clean}`;
    }
  }
  return null;
}

function isRawBase64Image(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  if (s.startsWith('data:image/')) return true;
  if (s.length > 20) {
    if (s.startsWith('/9j/') || s.startsWith('UklGR') || s.startsWith('iVBORw0KGgo') || s.startsWith('R0lGOD')) {
      return true;
    }
  }
  return false;
}

module.exports = {
  extractThumbnail,
  isRawBase64Image
};
