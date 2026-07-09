// Preset avatars — icon + color combos, Netflix-profile-style picker.
// No external images: keeps the app self-contained and avoids asset licensing.
const AVATAR_OPTIONS = [
  { key: 'flame',    icon: 'flame',           color: '#E2B714' },
  { key: 'leaf',      icon: 'leaf',            color: '#2ECC71' },
  { key: 'barbell',   icon: 'barbell',         color: '#E67E22' },
  { key: 'water',     icon: 'water',           color: '#2E86AB' },
  { key: 'moon',      icon: 'moon',            color: '#7B2FBE' },
  { key: 'sunny',     icon: 'sunny',           color: '#F1C40F' },
  { key: 'rocket',    icon: 'rocket',          color: '#E74C3C' },
  { key: 'planet',    icon: 'planet',          color: '#9B59B6' },
  { key: 'paw',       icon: 'paw',             color: '#8E44AD' },
  { key: 'flash',     icon: 'flash',           color: '#F39C12' },
  { key: 'heart',     icon: 'heart',           color: '#E84393' },
  { key: 'diamond',   icon: 'diamond',         color: '#00CEC9' },
  { key: 'trophy',    icon: 'trophy',          color: '#E2B714' },
  { key: 'shield',    icon: 'shield-checkmark', color: '#27AE60' },
];

const DEFAULT_AVATAR_KEY = 'flame';

function getAvatar(key) {
  return AVATAR_OPTIONS.find(a => a.key === key) ?? AVATAR_OPTIONS.find(a => a.key === DEFAULT_AVATAR_KEY);
}

export { AVATAR_OPTIONS, DEFAULT_AVATAR_KEY, getAvatar };
