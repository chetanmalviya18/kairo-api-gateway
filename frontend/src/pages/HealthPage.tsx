import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

interface HealthResponse {
  status: string
  service: string
  uptime: string
}

export default function HealthPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await apiClient.get<HealthResponse>('/health')
      return res.data
    },
    refetchInterval: 30_000,
  })

  return (
    <div className="min-h-screen p-8 bg-muted">
      <h1 className="text-2xl font-bold mb-6">Service Health</h1>

      <div className="bg-card border border-border rounded-lg p-6 max-w-md shadow-sm">
        <h2 className="text-lg font-semibold mb-4">API Management Service</h2>
        {isLoading && <p className="text-muted-foreground text-sm">Checking…</p>}
        {error && <p className="text-destructive text-sm">Service unreachable</p>}
        {data && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={
                  data.status === 'UP'
                    ? 'text-green-600 font-semibold'
                    : 'text-destructive font-semibold'
                }
              >
                {data.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span>{data.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span>{data.uptime}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

