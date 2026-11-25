export const getErrorMessage = (error: any, defaultMessage = 'An unexpected error occurred'): string => {
  if (!error) return defaultMessage
  if (typeof error === 'string') return error
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  }
  if (error.response?.data?.message) return error.response.data.message
  if (error.message) return error.message
  return defaultMessage
}

export const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  const str = query.toString()
  return str ? `?${str}` : ''
}
