import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteVersions, type RouteVersionResponse } from '@/features/routes/routeApi'
import { X, History, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  routeId: string
  routeName?: string
}

const CHANGE_TYPE_STYLES: Record<string, string> = {
  CREATED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  STATUS_CHANGED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DELETED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function RouteVersionsModal({ isOpen, onClose, routeId, routeName }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const { data: versions, isLoading } = useQuery({
    queryKey: ['route-versions', routeId],
    queryFn: () => getRouteVersions(routeId),
    enabled: isOpen && !!routeId,
  })

  if (!isOpen) return null

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatSnapshot = (snapshot: string) => {
    try {
      return JSON.stringify(JSON.parse(snapshot), null, 2)
    } catch {
      return snapshot
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History size={18} className="text-primary" />
            <div>
              <h2 className="text-base font-bold">Route Version History</h2>
              <p className="text-xs text-muted-foreground font-mono">
                {routeId} {routeName ? `• ${routeName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading configuration versions…
            </div>
          ) : !versions || versions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No configuration history found for this route.
            </div>
          ) : (
            versions.map((ver: RouteVersionResponse) => {
              const isExpanded = expandedId === ver.id
              const prettyJson = formatSnapshot(ver.configurationSnapshot)
              return (
                <div
                  key={ver.id}
                  className="border border-border rounded-lg overflow-hidden bg-background"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : ver.id)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">
                        v{ver.versionNumber}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          CHANGE_TYPE_STYLES[ver.changeType] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ver.changeType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ver.createdAt).toLocaleString()}
                      </span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Configuration Snapshot
                        </span>
                        <button
                          onClick={() => handleCopy(ver.id, prettyJson)}
                          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-background border border-border transition"
                        >
                          {copiedId === ver.id ? (
                            <>
                              <Check size={12} className="text-green-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy JSON
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono bg-background p-3 rounded border border-border overflow-x-auto text-foreground max-h-60 overflow-y-auto">
                        {prettyJson}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-xs font-medium rounded-md hover:bg-accent transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
