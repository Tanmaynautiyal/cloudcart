/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_IS_PRODUCTION?: string
  readonly VITE_API_BASE_URL_LOCAL?: string
  readonly VITE_API_BASE_URL_SERVER?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_MAINTENANCE_MODE?: string
  readonly VITE_HIDE_CONSOLE?: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
