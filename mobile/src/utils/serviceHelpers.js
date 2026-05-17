export const SERVICE_EMOJIS = {
  'AC_REPAIR': '❄️',
  'ELECTRICIAN': '⚡',
  'PLUMBER': '🔧',
  'CARPENTER': '🪚',
  'PAINTER': '🎨',
  'TUTOR': '📚',
  'BEAUTICIAN': '💄',
  'DRIVER': '🚗',
  'CLEANER': '🧹',
  'GARDENER': '🌱'
};

export const SERVICE_LABELS = {
  'AC_REPAIR': 'AC Repair',
  'ELECTRICIAN': 'Electrician',
  'PLUMBER': 'Plumber',
  'CARPENTER': 'Carpenter',
  'PAINTER': 'Painter',
  'TUTOR': 'Tutor',
  'BEAUTICIAN': 'Beautician',
  'DRIVER': 'Driver',
  'CLEANER': 'Cleaner',
  'GARDENER': 'Gardener'
};

export const getServiceEmoji = (type) => SERVICE_EMOJIS[type] || '👤';
export const getServiceLabel = (type) => SERVICE_LABELS[type] || 'Professional';
