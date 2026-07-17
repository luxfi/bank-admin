/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BANK_API_URL?: string
  readonly VITE_DATA_SOURCE?: 'sandbox' | 'live'
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
