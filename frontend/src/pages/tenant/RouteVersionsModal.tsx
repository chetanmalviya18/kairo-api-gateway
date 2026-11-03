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
  CREATED: 'bg-kairo-green/10 text-kairo-green border-kairo-green/20',
  UPDATED: 'bg-kairo-navy/10 text-kairo-navy border-kairo-navy/20',
  STATUS_CHANGED: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  DELETED: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
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
    <div className="fixed inset-0 z-50 bg-kairo-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-kairo-cream-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-kairo-cream-border bg-kairo-cream/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-kairo-navy text-white flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-kairo-navy">Route Version History</h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {routeId} {routeName ? `• ${routeName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-kairo-navy p-1.5 rounded-lg hover:bg-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
              Loading configuration versions…
            </div>
          ) : !versions || versions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No configuration history recorded for this route.
            </div>
          ) : (
            versions.map((ver: RouteVersionResponse) => {
              const isExpanded = expandedId === ver.id
              const prettyJson = formatSnapshot(ver.configurationSnapshot)
              return (
                <div
                  key={ver.id}
                  className="border border-kairo-cream-border rounded-xl overflow-hidden bg-white shadow-xs"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : ver.id)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-kairo-cream/40 transition select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-kairo-navy text-white rounded-md">
                        v{ver.versionNumber}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
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
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-kairo-navy" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-kairo-cream-border bg-kairo-cream/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-kairo-navy uppercase tracking-wider">
                          Configuration Snapshot JSON
                        </span>
                        <button
                          onClick={() => handleCopy(ver.id, prettyJson)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-kairo-navy hover:bg-white px-2.5 py-1 rounded-md bg-kairo-cream border border-kairo-cream-border transition"
                        >
                          {copiedId === ver.id ? (
                            <>
                              <Check size={12} className="text-kairo-green" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy JSON
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono bg-white p-3.5 rounded-lg border border-kairo-cream-border overflow-x-auto text-kairo-navy max-h-60 overflow-y-auto">
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
        <div className="px-6 py-3 border-t border-kairo-cream-border bg-kairo-cream/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-kairo-cream-border text-xs font-semibold rounded-lg hover:bg-white transition text-kairo-navy"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
