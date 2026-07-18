import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './styles/theme.css'
import { App } from './App'
import { BrandContext, applyBrand, getBrand } from './lib/brand'

// Resolve the white-label brand once and apply it (the inline script in
// index.html already set data-theme/data-brand pre-paint; this re-affirms).
const brand = getBrand()
applyBrand(brand)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandContext.Provider value={brand}>
      <App />
    </BrandContext.Provider>
  </StrictMode>,
)
