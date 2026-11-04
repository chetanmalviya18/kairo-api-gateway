/**
 * Backend Error Response structure from Kairo API Management:
 * in.kairo.apigateway.management.exception.ErrorResponse
 */
export interface BackendErrorResponse {
  status: number
  message: string
  errors?: Record<string, string> | null
  timestamp?: string
}

export interface ParsedApiError {
  status: number
  message: string
  fieldErrors: Record<string, string>
  formattedMessage: string
  timestamp?: string
}

/**
 * Extracts and formats the structured ErrorResponse from backend (status, message, field validation errors)
 */
export function parseApiError(err: any, fallback = 'Operation failed'): ParsedApiError {
  const data = err?.response?.data as BackendErrorResponse | undefined
  const status = typeof data?.status === 'number' ? data.status : (err?.response?.status ?? 500)
  const message = data?.message || err?.message || fallback
  const fieldErrors = (data?.errors && typeof data.errors === 'object') ? data.errors : {}

  const fieldEntries = Object.entries(fieldErrors)
  let formattedMessage = message

  if (fieldEntries.length > 0) {
    const errorDetails = fieldEntries
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(', ')
    formattedMessage = `${message} (${errorDetails})`
  }

  return {
    status,
    message,
    fieldErrors,
    formattedMessage,
    timestamp: data?.timestamp,
  }
}

