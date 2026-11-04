import { AlertCircle } from 'lucide-react'
import type { ParsedApiError } from '@/lib/errorHandler'

interface Props {
  error: ParsedApiError | string | null | undefined
  className?: string
}

export default function FormErrorBanner({ error, className = '' }: Props) {
  if (!error) return null

  if (typeof error === 'string') {
    return (
      <div className={`form-error ${className}`} role="alert">
        <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
        <span className="font-medium text-xs text-red-800">{error}</span>
      </div>
    )
  }

  const { message, fieldErrors, status } = error
  const fieldEntries = Object.entries(fieldErrors || {})

  return (
    <div className={`form-error flex flex-col items-start gap-1.5 ${className}`} role="alert">
      <div className="flex items-center gap-2 font-semibold text-xs text-red-900">
        <AlertCircle size={16} className="shrink-0 text-red-600" />
        <span>
          {status && status >= 400 && status < 500 ? '' : ''}
          {message}
        </span>
      </div>

      {fieldEntries.length > 0 && (
        <ul className="pl-6 list-disc text-[11px] space-y-1 mt-0.5 text-red-800">
          {fieldEntries.map(([field, msg]) => (
            <li key={field}>
              <strong className="capitalize">{field}</strong>: {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

