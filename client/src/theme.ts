// Shared design tokens for the admin panel (Layout, AdminLayout, and
// everything rendered inside them). Every value is a CSS custom property
// reference — the actual dark/light values live in index.css under `:root`
// and `:root[data-theme="light"]`, toggled by ThemeModeProvider. That means
// switching theme mode re-themes every consumer of this object without any
// of them re-rendering. Login is a separate, fixed light-theme surface and
// intentionally doesn't use these.
export const theme = {
  bg: 'var(--color-bg)',
  headerBg: 'var(--color-header-bg)',
  sidebarBg: 'var(--color-sidebar-bg)',
  surface: 'var(--color-surface)',
  surfaceHover: 'var(--color-surface-hover)',
  rowHover: 'var(--color-row-hover)',
  border: 'var(--color-border)',
  inputBg: 'var(--color-input-bg)',
  inputBorder: 'var(--color-input-border)',

  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  // Muted text/icon shades between textSecondary and textTertiary — used all
  // over for rest-state icon colors, subtitle labels, and badge/pill text
  // that used to be hardcoded rgba(255,255,255,X) literals (which broke in
  // light mode since they never inverted).
  textMuted: 'var(--color-text-muted)',
  textFaint: 'var(--color-text-faint)',
  textSubtle: 'var(--color-text-subtle)',
  textStrong: 'var(--color-text-strong)',

  hoverBgSubtle: 'var(--color-hover-bg-subtle)',
  subtleBg: 'var(--color-subtle-bg)',
  divider: 'var(--color-divider)',
  overlaySubtle: 'var(--color-overlay-subtle)',

  accent: 'var(--color-accent)',
  accentHover: 'var(--color-accent-hover)',
  accentBg: 'var(--color-accent-bg)',
  accentBgSoft: 'var(--color-accent-bg-soft)',
  accentBorderSoft: 'var(--color-accent-border-soft)',
  accentGradient: 'var(--color-accent-gradient)',
  accentGradientDiag: 'var(--color-accent-gradient-diag)',

  success: 'var(--color-success)',
  successBg: 'var(--color-success-bg)',

  danger: 'var(--color-danger)',
  dangerHover: 'var(--color-danger-hover)',
  dangerBg: 'var(--color-danger-bg)',
  dangerBgHover: 'var(--color-danger-bg-hover)',
  dangerBorder: 'var(--color-danger-border)',
  dangerSolid: 'var(--color-danger-solid)',
} as const
