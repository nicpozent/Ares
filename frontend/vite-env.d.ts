/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENTRA_CLIENT_ID: string
  readonly VITE_ENTRA_TENANT_ID: string
  readonly VITE_API_SCOPE: string
  readonly VITE_API_BASE: string
  readonly VITE_ALLOW_DEMO_AUTH: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
