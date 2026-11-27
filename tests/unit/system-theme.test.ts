import { afterEach, describe, expect, it, vi } from 'vitest'
import { initializeSystemTheme } from '@/core/platform/system-theme'

describe('system theme adapter', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('applies the dark class when the system prefers dark mode', () => {
    const removeEventListener = vi.fn()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener,
        dispatchEvent: vi.fn()
      })
    )

    const cleanup = initializeSystemTheme()

    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    cleanup()
    expect(removeEventListener).toHaveBeenCalledOnce()
  })
})
