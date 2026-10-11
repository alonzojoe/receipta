import '@testing-library/jest-dom/vitest'

import { vi } from 'vitest'

// jsdom does not implement scrollTo, and the router's scroll restoration calls it.
window.scrollTo = vi.fn()
