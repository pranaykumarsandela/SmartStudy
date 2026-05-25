export const formatDuration = (mins) => {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hrs}h`;
  return `${hrs}h ${remainingMins}m`;
};

// Timezone helpers
export const getZonedDate = (timezone) => {
  if (!timezone) return new Date();
  try {
    const zonedStr = new Date().toLocaleString('en-US', { timeZone: timezone });
    return new Date(zonedStr);
  } catch(e) {
    return new Date();
  }
};

export const getZonedDateString = (timezone) => {
  const d = getZonedDate(timezone);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getZonedTimeString = (timezone) => {
  const d = getZonedDate(timezone);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
