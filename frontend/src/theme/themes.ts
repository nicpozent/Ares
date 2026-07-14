import type { ThemeId } from '../types'

// Lifted verbatim from the prototype `themes` object.
export const themes: Record<ThemeId, Record<string, string>> = {
  command: {
    '--app-bg': 'linear-gradient(165deg,#0b1330 0%,#0a1024 60%,#080d1e 100%)',
    '--shell': '#0c1430', '--panel': '#111c42', '--panel2': '#0e1738',
    '--line': 'rgba(150,175,255,.13)', '--text': '#eef2ff', '--muted': '#9fb0d8', '--faint': '#6c7fb0',
    '--chip': 'rgba(150,175,255,.10)', '--nav-on': 'rgba(120,160,255,.16)',
    '--brandA': '#2E93E6', '--brandB': '#3358d4', '--accent': '#ff3d6e', '--ok': '#37d39b', '--warn': '#ffb020',
    '--grad': 'linear-gradient(135deg,#3358d4,#2E93E6)', '--grad-hot': 'linear-gradient(135deg,#ff3d6e,#ff7a45)',
    '--shadow': '0 24px 60px -26px rgba(0,0,0,.75)', '--lk-dark': 'flex', '--lk-light': 'none',
  },
  daylight: {
    '--app-bg': 'linear-gradient(165deg,#eef2fb,#e4ebf7)',
    '--shell': '#ffffff', '--panel': '#ffffff', '--panel2': '#f4f7fd',
    '--line': 'rgba(20,40,90,.11)', '--text': '#111a3a', '--muted': '#57678f', '--faint': '#8a97b8',
    '--chip': 'rgba(17,80,170,.06)', '--nav-on': 'rgba(17,122,192,.10)',
    '--brandA': '#117AC0', '--brandB': '#1B3B9B', '--accent': '#DE0A45', '--ok': '#0f9d68', '--warn': '#c77700',
    '--grad': 'linear-gradient(135deg,#1B3B9B,#117AC0)', '--grad-hot': 'linear-gradient(135deg,#DE0A45,#ff6a3d)',
    '--shadow': '0 20px 44px -24px rgba(20,40,90,.34)', '--lk-dark': 'none', '--lk-light': 'flex',
  },
  carbon: {
    '--app-bg': 'linear-gradient(165deg,#0a0c12,#060709)',
    '--shell': '#0b0d14', '--panel': '#101319', '--panel2': '#0c0f15',
    '--line': 'rgba(255,255,255,.09)', '--text': '#f2f4f8', '--muted': '#9aa3b4', '--faint': '#5e6676',
    '--chip': 'rgba(255,255,255,.06)', '--nav-on': 'rgba(255,255,255,.08)',
    '--brandA': '#3aa0ff', '--brandB': '#4b6bff', '--accent': '#ff2d5e', '--ok': '#2fd98a', '--warn': '#ffb020',
    '--grad': 'linear-gradient(135deg,#4b6bff,#3aa0ff)', '--grad-hot': 'linear-gradient(135deg,#ff2d5e,#ff7a45)',
    '--shadow': '0 24px 56px -20px rgba(0,0,0,.85)', '--lk-dark': 'flex', '--lk-light': 'none',
  },
}

export function applyTheme(el: HTMLElement, id: ThemeId) {
  const t = themes[id] ?? themes.command
  for (const k in t) el.style.setProperty(k, t[k])
}
