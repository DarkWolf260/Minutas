function extractLocation(msgOrData) {
  if (!msgOrData) return null;

  // 1. Extraer desde msg.location (instancia Location de whatsapp-web.js) o datos raw
  const locObj = msgOrData.location;
  let lat = locObj?.latitude ?? msgOrData._data?.lat ?? msgOrData.lat;
  let lng = locObj?.longitude ?? msgOrData._data?.lng ?? msgOrData.lng;

  if (lat !== undefined && lng !== undefined && lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const description = locObj?.description || msgOrData._data?.loc || msgOrData._data?.comment || msgOrData.loc || null;
    const name = msgOrData._data?.name || locObj?.name || null;
    const isLive = Boolean(
      msgOrData.type === 'live_location' ||
      msgOrData._data?.type === 'live_location' ||
      msgOrData._data?.isLive ||
      locObj?.isLive
    );
    const url = locObj?.url || msgOrData._data?.clientUrl || `https://www.google.com/maps?q=${latitude},${longitude}`;

    return {
      latitude,
      longitude,
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      name: typeof name === 'string' && name.trim() ? name.trim() : null,
      url,
      isLive
    };
  }

  // 2. Extraer si type es location pero las coordenadas vinieron formateadas en el body (ej: "10.4806,-66.9036")
  if ((msgOrData.type === 'location' || msgOrData.type === 'live_location') && typeof msgOrData.body === 'string') {
    const coordMatch = msgOrData.body.trim().match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const latitude = Number(coordMatch[1]);
      const longitude = Number(coordMatch[3]);
      return {
        latitude,
        longitude,
        description: null,
        name: null,
        url: `https://www.google.com/maps?q=${latitude},${longitude}`,
        isLive: Boolean(msgOrData.type === 'live_location')
      };
    }
  }

  return null;
}

module.exports = {
  extractLocation
};
