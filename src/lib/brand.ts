// Runtime white-label brand system. The active brand is resolved once per load
// from `?brand=<id>` (persisted to localStorage; default `lux`) and drives the
// theme (light/dark), accent, wordmark, legal, and document title via CSS
// variables — a real theme swap, not per-component hacks. An inline script in
// index.html applies data-theme/data-brand/title before first paint (no FOUC);
// this module is the source of truth the React tree reads.
import { createContext, useContext } from 'react'

export type BrandId = 'lux' | 'acm'

export interface Brand {
  id: BrandId
  product: string // product name, e.g. "Lux Financial"
  legal: string // legal entity, e.g. "ACM Global Inc"
  domain: string
  theme: 'dark' | 'light'
  accent: string // brand accent (hex)
  wordmark: { text: string; sub?: string; mark: 'triangle' | 'tile' } // how to render
  tagline: string
}

export const BRANDS: Record<BrandId, Brand> = {
  lux: {
    id: 'lux',
    product: 'Lux Financial',
    legal: 'Lux Financial',
    domain: 'lux.financial',
    theme: 'dark',
    accent: '#f5a623', // amber / neutral
    wordmark: { text: 'Lux', sub: 'Financial', mark: 'triangle' },
    tagline: 'white-label banking-as-a-service',
  },
  acm: {
    id: 'acm',
    product: 'ACM Global Tech',
    legal: 'ACM Global Inc',
    domain: 'acmglobaltech.com',
    theme: 'light',
    accent: '#1F4FFF', // blue
    wordmark: { text: 'acm', mark: 'tile' },
    tagline: 'global banking technology',
  },
}

const STORAGE_KEY = 'lux_admin_brand'

export function resolveBrandId(): BrandId {
  try {
    const q = new URLSearchParams(window.location.search).get('brand')
    if (q === 'lux' || q === 'acm') {
      localStorage.setItem(STORAGE_KEY, q)
      return q
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'lux' || stored === 'acm') return stored
  } catch {
    /* ignore */
  }
  return 'lux'
}

export function getBrand(): Brand {
  return BRANDS[resolveBrandId()]
}

// Apply the brand to the document root (idempotent; the inline script does this
// first, this re-affirms for SPA navigations / safety).
export function applyBrand(brand: Brand): void {
  const root = document.documentElement
  root.setAttribute('data-theme', brand.theme)
  root.setAttribute('data-brand', brand.id)
  document.title = `${brand.product} — Admin`
}

export const BrandContext = createContext<Brand>(BRANDS.lux)
export function useBrand(): Brand {
  return useContext(BrandContext)
}
