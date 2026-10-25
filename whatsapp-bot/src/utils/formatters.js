function extractWidString(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    if (typeof val._serialized === 'string' && val._serialized.trim()) {
      return val._serialized.trim();
    }
    if (typeof val.id === 'string' && val.id.trim()) {
      return val.id.trim();
    }
    if (typeof val.id === 'object' && typeof val.id?._serialized === 'string' && val.id._serialized.trim()) {
      return val.id._serialized.trim();
    }
    if (typeof val.user === 'string' && val.user.trim()) {
      const server = typeof val.server === 'string' && val.server.trim() ? val.server.trim() : 'c.us';
      return `${val.user.trim()}@${server}`;
    }
  }
  const str = String(val);
  return (str && str !== '[object Object]') ? str.trim() : null;
}

module.exports = {
  extractWidString
};
