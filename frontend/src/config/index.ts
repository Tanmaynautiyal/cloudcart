const getDynamicApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    // If accessed over LAN/Wi-Fi IP from another computer or mobile device (e.g. 10.8.23.143 or 192.168.x.x)
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8001/api/v1`
    }
  }
  return (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL_LOCAL ||
    'http://localhost:8001/api/v1'
  )
}

export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'CloudCart',
  isProduction: import.meta.env.VITE_IS_PRODUCTION === 'true',
  apiBaseUrl: getDynamicApiUrl(),
  maintenanceMode: import.meta.env.VITE_MAINTENANCE_MODE === 'true',
  hideConsole: import.meta.env.VITE_HIDE_CONSOLE === 'true',
}
