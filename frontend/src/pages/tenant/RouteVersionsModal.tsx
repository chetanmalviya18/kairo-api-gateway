import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { getRouteVersions } from '@/features/routes/routeApi'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  routeId: string
  routeName?: string
}

export default function RouteVersionsModal({ isOpen, onClose, routeId, routeName }: Props) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['route-versions', routeId],
    queryFn: () => getRouteVersions(routeId),
    enabled: isOpen && !!routeId,
  })

  if (!isOpen) return null

  const formatSnapshot = (snapshot: string) => {
    try {
      return JSON.stringify(JSON.parse(snapshot), null, 2)
    } catch {
      return snapshot
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">CONFIGURATION HISTORY</p>
            <h2>Route versions</h2>
            <p className="muted text-xs font-mono">{routeId} {routeName ? `• ${routeName}` : ''}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted text-xs animate-pulse">
            Loading route versions…
          </div>
        ) : versions.length === 0 ? (
          <div className="empty-state">
            <strong>No previous versions</strong>
            <span>Initial version is currently active.</span>
          </div>
        ) : (
          <div className="timeline">
            {versions.map((ver) => (
              <div key={ver.id} className="timeline-item">
                <div>
                  <div className="flex items-center gap-2">
                    <h3>Version {ver.versionNumber}</h3>
                    <span className="status status-active text-[9px] py-0 px-2">
                      {ver.changeType}
                    </span>
                  </div>
                  <p>Configuration updated ({ver.changeType})</p>

                  <details>
                    <summary>View configuration snapshot</summary>
                    <pre>{formatSnapshot(ver.configurationSnapshot)}</pre>
                  </details>
                </div>

                <time>{new Date(ver.createdAt).toLocaleString()}</time>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="button button-primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
