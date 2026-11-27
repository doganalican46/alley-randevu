export function initializeSystemTheme(): () => void {
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
  const syncTheme = () => {
    document.documentElement.classList.toggle('dark', colorScheme.matches)
    document.documentElement.style.colorScheme = colorScheme.matches ? 'dark' : 'light'
  }

  syncTheme()
  colorScheme.addEventListener('change', syncTheme)

  return () => colorScheme.removeEventListener('change', syncTheme)
}
