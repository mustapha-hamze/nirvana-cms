// Shared dark-theme design tokens for the admin panel (Layout, AdminLayout, and
// everything rendered inside them). Login is a separate light-theme surface and
// intentionally doesn't use these.
export const theme = {
  bg: '#081028',
  headerBg: '#050c1f',
  sidebarBg: '#0a1330',
  surface: '#0d1635',
  surfaceHover: '#112040',
  rowHover: '#112040',
  border: 'rgba(255,255,255,0.06)',
  inputBg: '#081028',
  inputBorder: 'rgba(255,255,255,0.1)',

  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: 'rgba(255,255,255,0.28)',

  accent: '#a78bfa',
  accentHover: '#c4b5fd',
  accentBg: 'rgba(124,58,237,0.15)',
  accentBgSoft: 'rgba(124,58,237,0.1)',
  accentBorderSoft: 'rgba(124,58,237,0.2)',
  accentGradient: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
  accentGradientDiag: 'linear-gradient(135deg, #7c3aed, #4f46e5)',

  success: '#34d399',
  successBg: 'rgba(52,211,153,0.1)',

  danger: '#f87171',
  dangerHover: '#fca5a5',
  dangerBg: 'rgba(239,68,68,0.1)',
  dangerBgHover: 'rgba(239,68,68,0.12)',
  dangerBorder: 'rgba(239,68,68,0.2)',
  dangerSolid: '#dc2626',
} as const
