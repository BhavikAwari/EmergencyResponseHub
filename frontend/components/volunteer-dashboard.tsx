'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  PhoneOff,
  Radio,
  Shield,
  ShieldCheck,
  Siren,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import { patchIncident } from '@/lib/api'
import type { FireIncident, UserRole } from '@/types/incidents'

interface VolunteerDashboardProps {
  incidents: FireIncident[]
  userRole: UserRole
  onAccept?: (alertId: string) => void
}

const responderId = 'web-volunteer'

const ALERT_ICONS = {
  medical: Activity,
  fire: AlertCircle,
  accident: Car,
  security: Shield,
  SOS: Siren,
}

const ALERT_COLORS = {
  medical: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    icon: 'text-red-400',
    badge: 'bg-red-500/30 text-red-200',
  },
  fire: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    icon: 'text-orange-400',
    badge: 'bg-orange-500/30 text-orange-200',
  },
  accident: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/40',
    icon: 'text-yellow-400',
    badge: 'bg-yellow-500/30 text-yellow-200',
  },
  security: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/30 text-blue-200',
  },
  SOS: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    icon: 'text-red-400',
    badge: 'bg-red-500/30 text-red-200',
  },
}

const PRIORITY_LABELS = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
}

const VOLUNTEER_NAMES: Record<string, string> = {
  'demo-volunteer': 'Aarav Sharma',
  'web-volunteer': 'Command Dispatcher',
}

const getVolunteerName = (id?: string) => (id ? VOLUNTEER_NAMES[id] ?? id.replace(/[-_]/g, ' ') : '')

const getTimeLabel = (createdAt?: Date) => {
  if (!createdAt) return 'Reported just now'
  const minutes = Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 60000))
  if (minutes < 60) return `Reported ${minutes}m ago`
  return `Reported ${Math.round(minutes / 60)}h ago`
}

const getPriorityBadge = (incident: FireIncident) => {
  if (incident.priority === 'high') return 'CODE RED'
  if (incident.status === 'accepted' || incident.status === 'verified') return 'VERIFIED'
  if (incident.priority === 'medium') return 'CODE AMBER'
  return 'WATCH'
}

export function VolunteerDashboard({ incidents, userRole, onAccept }: VolunteerDashboardProps) {
  const isOfficial = userRole === 'authority'
  const [isOnline, setIsOnline] = useState(true)
  const [acceptingAlertId, setAcceptingAlertId] = useState<string | null>(null)
  const [moderatingAlertId, setModeratingAlertId] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [detailsIncident, setDetailsIncident] = useState<FireIncident | null>(null)

  const visibleAlerts = useMemo(
    () =>
      incidents.filter((incident) =>
        userRole === 'volunteer' ? incident.status === 'pending' : incident.status !== 'resolved'
      ),
    [incidents, userRole]
  )

  const acceptedByMe = useMemo(() => {
    return incidents.filter(
      (incident) => incident.status === 'accepted' && incident.responderId === responderId
    )
  }, [incidents])

  const activeEmergencyCount = useMemo(
    () => incidents.filter((incident) => incident.status !== 'resolved').length,
    [incidents]
  )

  const onlineVolunteerCount = useMemo(() => {
    const assigned = new Set(incidents.map((incident) => incident.responderId).filter(Boolean))
    return Math.max(42, 41 + assigned.size)
  }, [incidents])

  const threatLevel = useMemo(() => {
    if (incidents.some((incident) => incident.status !== 'resolved' && incident.priority === 'high')) {
      return { label: 'Crisis', className: 'border-red-400/50 bg-red-500/20 text-red-100' }
    }
    if (activeEmergencyCount > 0) {
      return { label: 'Elevated', className: 'border-amber-300/50 bg-amber-400/15 text-amber-100' }
    }
    return { label: 'Normal', className: 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100' }
  }, [activeEmergencyCount, incidents])

  const handleAccept = async (alertId: string) => {
    setAcceptingAlertId(alertId)
    try {
      await patchIncident(alertId, {
        status: 'accepted',
        responderId,
      })
      onAccept?.(alertId)
    } catch (error) {
      console.error('Failed to accept incident:', error)
    } finally {
      setAcceptingAlertId(null)
    }
  }

  const handleVerify = async (alertId: string) => {
    setModeratingAlertId(alertId)
    try {
      await patchIncident(alertId, {
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: responderId,
      })
    } catch (error) {
      console.error('Failed to verify incident:', error)
    } finally {
      setModeratingAlertId(null)
    }
  }

  const handleDispatch = async (incident: FireIncident) => {
    setAcceptingAlertId(incident.id)
    try {
      await patchIncident(incident.id, {
        status: 'accepted',
        responderId: incident.responderId ?? 'demo-volunteer',
        dispatchedAt: new Date().toISOString(),
      })
      alert(`Dispatch sent to nearby verified volunteers for ${incident.title || incident.type}.`)
    } catch (error) {
      console.error('Failed to dispatch incident:', error)
    } finally {
      setAcceptingAlertId(null)
    }
  }

  const handleForceResolve = async (alertId: string) => {
    setModeratingAlertId(alertId)
    try {
      await patchIncident(alertId, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: responderId,
      })
    } catch (error) {
      console.error('Failed to force resolve incident:', error)
    } finally {
      setModeratingAlertId(null)
    }
  }

  const handleMarkAllResolved = async () => {
    const openIncidents = incidents.filter((incident) => incident.status !== 'resolved')
    if (openIncidents.length === 0) return
    const confirmed = window.confirm(
      `Mark all ${openIncidents.length} active incident${openIncidents.length === 1 ? '' : 's'} as resolved? This clears the simulation board.`
    )
    if (!confirmed) return

    setModeratingAlertId('global-clear')
    try {
      await Promise.all(
        openIncidents.map((incident) =>
          patchIncident(incident.id, {
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolvedBy: responderId,
          })
        )
      )
    } catch (error) {
      console.error('Failed to mark all incidents resolved:', error)
    } finally {
      setModeratingAlertId(null)
    }
  }

  if (isOfficial) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full space-y-4 rounded-2xl border border-white/10 bg-slate-950 p-3 text-slate-100 shadow-2xl shadow-black/30"
      >
        <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                Regional Command
              </p>
              <h2 className="truncate text-base font-bold text-white">Dispatch Center</h2>
            </div>
            <ShieldCheck className="h-6 w-6 shrink-0 text-amber-300" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex min-h-[68px] flex-col justify-center rounded-xl border border-white/10 bg-slate-900/70 px-2.5">
              <span className="text-[10px] uppercase text-slate-400">Threat</span>
              <span className={`mt-1 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${threatLevel.className}`}>
                {threatLevel.label}
              </span>
            </div>
            <div className="flex min-h-[68px] flex-col justify-center rounded-xl border border-white/10 bg-slate-900/70 px-2.5">
              <span className="flex items-center gap-1 text-[10px] uppercase text-slate-400">
                <Users className="h-3 w-3 text-sky-300" />
                Mesh
              </span>
              <span className="mt-1 text-lg font-bold text-white">{onlineVolunteerCount}</span>
              <span className="text-[10px] text-emerald-200">online</span>
            </div>
            <div className="flex min-h-[68px] flex-col justify-center rounded-xl border border-white/10 bg-slate-900/70 px-2.5">
              <span className="flex items-center gap-1 text-[10px] uppercase text-slate-400">
                <Activity className="h-3 w-3 text-emerald-300" />
                Pulse
              </span>
              <span className="mt-1 flex items-center gap-2 text-xs font-bold text-emerald-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </span>
                Live
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="h-4 w-4 text-amber-300" />
                Triage Feed
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">{activeEmergencyCount} active dossier{activeEmergencyCount === 1 ? '' : 's'}</p>
            </div>
            <button
              onClick={() => void handleMarkAllResolved()}
              disabled={moderatingAlertId === 'global-clear' || activeEmergencyCount === 0}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 text-[10px] font-bold text-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {moderatingAlertId === 'global-clear' ? 'Clearing' : 'Clear'}
            </button>
          </div>

          {visibleAlerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-300/50" />
              <p className="text-sm font-semibold text-slate-200">Board clear</p>
              <p className="mt-1 text-xs text-slate-500">No active incidents in command queue</p>
            </div>
          )}

          <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {visibleAlerts.map((alert, index) => {
              const alertType = (alert.type in ALERT_COLORS ? alert.type : 'SOS') as keyof typeof ALERT_COLORS
              const IconComponent = ALERT_ICONS[alertType]
              const isHigh = alert.priority === 'high'
              const hasContactOwner = alert.status === 'accepted' && Boolean(alert.responderId)
              const volunteerName = getVolunteerName(alert.responderId)
              const address = alert.title || `${alert.lat.toFixed(5)}, ${alert.lng.toFixed(5)}`

              return (
                <motion.article
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900">
                        <IconComponent className={`h-5 w-5 ${isHigh ? 'text-red-300' : 'text-emerald-300'}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-white">{alert.type.toUpperCase()} Emergency</h4>
                        <p className="truncate text-xs text-slate-400">{alert.description || 'Live report awaiting official action'}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-black ${isHigh ? 'border-red-300/50 bg-red-500/20 text-red-100' : 'border-amber-300/40 bg-amber-300/15 text-amber-100'}`}>
                      {getPriorityBadge(alert)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-slate-950/55 p-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                      <span className="min-w-0 truncate">{address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                      <span>{getTimeLabel(alert.createdAt)}</span>
                    </div>
                  </div>

                  {hasContactOwner && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 p-2 text-xs font-semibold text-sky-100">
                      <Radio className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 truncate">Volunteer {volunteerName} is in contact</span>
                    </div>
                  )}

                  {alert.imageUrl && (
                    <button onClick={() => setPreviewImageUrl(alert.imageUrl ?? null)} className="mt-3 block">
                      <img
                        src={alert.imageUrl}
                        alt="Incident thumbnail"
                        className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                      />
                    </button>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => void handleVerify(alert.id)}
                      disabled={alert.status !== 'pending' || moderatingAlertId === alert.id}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-3 text-xs font-bold text-emerald-100 disabled:opacity-45"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {alert.status === 'pending' ? 'Verify' : 'Verified'}
                    </button>
                    <button
                      onClick={() => void handleDispatch(alert)}
                      disabled={acceptingAlertId === alert.id || hasContactOwner}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-300 px-3 text-xs font-black text-slate-950 disabled:opacity-45"
                    >
                      <Zap className="h-4 w-4" />
                      {acceptingAlertId === alert.id ? 'Sending' : 'Dispatch'}
                    </button>
                    <button
                      onClick={() => setDetailsIncident(alert)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 px-3 text-xs font-bold text-slate-100"
                    >
                      Dossier
                    </button>
                    {hasContactOwner ? (
                      <button
                        disabled
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 px-3 text-xs font-bold text-slate-500"
                      >
                        <PhoneOff className="h-4 w-4" />
                        Call Locked
                      </button>
                    ) : (
                      <a
                        href={`tel:${alert.reporterPhone ?? ''}`}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 text-xs font-bold text-sky-100"
                      >
                        Call Victim
                      </a>
                    )}
                    <button
                      onClick={() => void handleForceResolve(alert.id)}
                      disabled={moderatingAlertId === alert.id}
                      className="col-span-2 min-h-[40px] rounded-xl border border-red-400/30 bg-red-500/10 px-3 text-xs font-bold text-red-100 disabled:opacity-60"
                    >
                      {moderatingAlertId === alert.id ? 'Resolving' : 'Mark Resolved'}
                    </button>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </section>

        {previewImageUrl && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewImageUrl(null)}
          >
            <img src={previewImageUrl} alt="Incident full preview" className="max-h-full max-w-full rounded-xl" />
          </div>
        )}

        {detailsIncident && (
          <div
            className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 p-4 sm:items-center"
            onClick={() => setDetailsIncident(null)}
          >
            <div
              className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100"
              onClick={(event) => event.stopPropagation()}
            >
              <h4 className="text-base font-bold text-white">Official Dossier</h4>
              <p className="text-sm text-slate-300">{detailsIncident.description || 'No description provided.'}</p>
              <p className="text-sm text-slate-400">
                Reporter: <span className="text-slate-100">{detailsIncident.reporterPhone || 'Unavailable'}</span>
              </p>
              <button
                onClick={() => setDetailsIncident(null)}
                className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  const pendingAlerts = visibleAlerts

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative flex items-center justify-between rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <motion.div animate={{ scale: isOnline ? [1, 1.2, 1] : 1 }} transition={{ duration: 2, repeat: isOnline ? Infinity : 0 }}>
            <Activity className={`h-6 w-6 ${isOnline ? 'text-green-400' : 'text-muted-foreground'}`} />
          </motion.div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold text-foreground">{isOnline ? 'Online & Available' : 'Offline'}</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOnline(!isOnline)}
          className={`relative h-8 w-14 rounded-full transition-colors duration-300 ${
            isOnline ? 'border border-green-500/50 bg-green-500/30' : 'border border-border bg-muted/30'
          }`}
        >
          <motion.div
            layout
            className={`absolute top-1 h-6 w-6 rounded-full transition-colors ${
              isOnline ? 'left-7 bg-green-400' : 'left-1 bg-muted-foreground'
            }`}
          />
        </motion.button>
      </motion.div>

      <div>
        <div className="relative mb-4">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Zap className="h-5 w-5 text-accent" />
            Nearby Alerts
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingAlerts.length} active incident{pendingAlerts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {pendingAlerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center"
          >
            <Heart className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No nearby alerts at this time</p>
            <p className="mt-2 text-xs text-muted-foreground/60">Stay available to help when incidents occur</p>
          </motion.div>
        )}

        <div className="max-h-96 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {pendingAlerts.map((alert, index) => {
            const alertType = (alert.type in ALERT_COLORS ? alert.type : 'SOS') as keyof typeof ALERT_COLORS
            const IconComponent = ALERT_ICONS[alertType]
            const colors = ALERT_COLORS[alertType]

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`${colors.bg} group relative rounded-2xl border ${colors.border} p-4 backdrop-blur-sm transition-all duration-300`}
              >
                <div className="flex gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${colors.bg} ${colors.border}`}>
                    <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{alert.title || `${alertType.toUpperCase()} Emergency`}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">{alert.description || 'Live incident from nearby users'}</p>
                      </div>
                      <div className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${colors.badge}`}>
                        {PRIORITY_LABELS[alert.priority ?? 'high']}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{alert.lat?.toFixed(3) ?? '--'}, {alert.lng?.toFixed(3) ?? '--'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{getTimeLabel(alert.createdAt).replace('Reported ', '')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => void handleAccept(alert.id)}
                    disabled={acceptingAlertId === alert.id}
                    className="col-span-3 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-foreground transition-all duration-300 hover:bg-accent/80 group-hover:shadow-lg group-hover:shadow-accent/20 sm:col-span-1"
                  >
                    <Heart className="h-5 w-5" />
                    {acceptingAlertId === alert.id ? 'Accepting...' : 'Accept'}
                  </motion.button>
                  <button
                    onClick={() => setDetailsIncident(alert)}
                    className="col-span-3 min-h-[48px] rounded-xl border border-border bg-background/40 px-3 text-xs font-semibold sm:col-span-1"
                  >
                    View Description
                  </button>
                  <a
                    href={`tel:${alert.reporterPhone ?? ''}`}
                    className="col-span-3 flex min-h-[48px] items-center justify-center rounded-xl border border-green-500/40 bg-green-500/15 px-3 text-xs font-semibold text-green-300 sm:col-span-1"
                  >
                    Call Reporter
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {acceptedByMe.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">My Accepted Incidents</h4>
          {acceptedByMe.map((incident) => (
            <div key={incident.id} className="rounded-xl border border-green-500/40 bg-green-500/10 p-3">
              <p className="text-sm font-medium text-foreground">{incident.title || `${incident.type} incident`}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white"
              >
                Directions
              </a>
            </div>
          ))}
        </div>
      )}

      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground"
        >
          You are currently offline. Go online to receive nearby alerts.
        </motion.div>
      )}

      {detailsIncident && (
        <div
          className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setDetailsIncident(null)}
        >
          <div
            className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h4 className="text-base font-bold text-foreground">Incident Details</h4>
            <p className="text-sm text-muted-foreground">{detailsIncident.description || 'No description provided.'}</p>
            <button
              onClick={() => setDetailsIncident(null)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
