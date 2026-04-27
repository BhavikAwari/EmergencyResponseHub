'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { AlertTriangle, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react'

export interface Incident {
  id: string
  type: 'fire' | 'medical' | 'accident' | 'other'
  status: 'pending' | 'accepted' | 'resolved'
  distance: number
  time: string
  location?: string
  priority?: 'high' | 'medium' | 'low'
  description?: string
  reporterPhone?: string
  imageUrl?: string
}

interface IncidentFeedProps {
  incidents?: Incident[]
  onIncidentSelect?: (incident: Incident) => void
}

const incidentTypeConfig = {
  fire: {
    icon: AlertTriangle,
    label: 'Fire',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
  medical: {
    icon: AlertCircle,
    label: 'Medical',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  accident: {
    icon: AlertTriangle,
    label: 'Accident',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  other: {
    icon: AlertCircle,
    label: 'Other',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  resolved: {
    icon: CheckCircle,
    label: 'Resolved',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  accepted: {
    icon: CheckCircle,
    label: 'Accepted',
    color: 'text-green-300',
    bgColor: 'bg-green-500/10',
  },
}

const statusBorderClass = {
  pending: 'border-accent/20',
  accepted: 'border-green-400/20',
  resolved: 'border-green-400/20',
}

// Default mock incidents for demonstration
const mockIncidents: Incident[] = [
  {
    id: '1',
    type: 'fire',
    status: 'pending',
    distance: 2.3,
    time: '5 min ago',
    location: 'Oak Street',
    priority: 'high',
  },
  {
    id: '2',
    type: 'medical',
    status: 'resolved',
    distance: 1.8,
    time: '12 min ago',
    location: 'Central Park',
    priority: 'medium',
  },
  {
    id: '3',
    type: 'accident',
    status: 'pending',
    distance: 4.1,
    time: '23 min ago',
    location: 'Highway 101',
    priority: 'high',
  },
  {
    id: '4',
    type: 'medical',
    status: 'resolved',
    distance: 3.5,
    time: '45 min ago',
    location: 'Downtown',
    priority: 'low',
  },
  {
    id: '5',
    type: 'other',
    status: 'resolved',
    distance: 5.2,
    time: '1 hour ago',
    location: 'Riverside',
    priority: 'low',
  },
]

export function IncidentFeed({ incidents = mockIncidents, onIncidentSelect }: IncidentFeedProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [detailsIncident, setDetailsIncident] = useState<Incident | null>(null)
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, x: -20 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-2"
    >
      {incidents.map((incident, index) => {
        const typeConfig = incidentTypeConfig[incident.type]
        const statusIcon = statusConfig[incident.status].icon
        const TypeIcon = typeConfig.icon

        return (
          <motion.div
            key={incident.id}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onIncidentSelect?.(incident)}
            className="group cursor-pointer"
          >
            {/* Dark Glass Card - Card Stack with rounded-2xl */}
            <div
              className={`relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl 
              shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300
              hover:border-border/80 p-5 min-h-[120px] flex flex-col justify-between`}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative z-10 flex items-start justify-between gap-3">
                {/* Left section: Incident info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon container */}
                  <div
                    className={`flex-shrink-0 rounded-lg p-2.5 ${typeConfig.bgColor}`}
                  >
                    <TypeIcon className={`${typeConfig.color} w-5 h-5`} />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {typeConfig.label}
                      </h3>
                      {incident.priority === 'high' && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>

                    {/* Location and distance */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{incident.location}</span>
                      <span className="text-accent font-medium">
                        {incident.distance} km
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{incident.time}</span>
                    </div>
                    {incident.imageUrl && (
                      <button onClick={() => setPreviewImageUrl(incident.imageUrl ?? null)} className="mt-2 block">
                        <img
                          src={incident.imageUrl}
                          alt="Incident thumbnail"
                          className="h-16 w-16 rounded-lg border border-border object-cover"
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right section: Status */}
                <div className="flex-shrink-0">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                    ${statusConfig[incident.status].bgColor} border ${statusBorderClass[incident.status]}`}
                  >
                    <motion.div
                      animate={{
                        scale: incident.status === 'pending' ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: incident.status === 'pending' ? 2 : 0,
                        repeat: incident.status === 'pending' ? Infinity : 0,
                      }}
                    >
                      {(() => {
                        const IconComponent = statusConfig[incident.status].icon
                        return (
                          <IconComponent
                            className={`${statusConfig[incident.status].color} w-4 h-4`}
                          />
                        )
                      })()}
                    </motion.div>
                    <span
                      className={`text-xs font-medium ${statusConfig[incident.status].color}`}
                    >
                      {statusConfig[incident.status].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom accent line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/50 to-transparent origin-left"
              />
              <div className="relative z-10 mt-3 flex gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    setDetailsIncident(incident)
                  }}
                  className="min-h-[40px] rounded-lg border border-border px-3 text-xs font-semibold"
                >
                  View Description
                </button>
                <a
                  onClick={(event) => event.stopPropagation()}
                  href={`tel:${incident.reporterPhone ?? ''}`}
                  className="min-h-[40px] rounded-lg border border-green-500/40 bg-green-500/15 px-3 text-xs font-semibold text-green-300 flex items-center justify-center"
                >
                  Call Reporter
                </a>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Empty state */}
      {incidents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="text-4xl mb-3 opacity-50">📋</div>
          <p className="text-muted-foreground">No incidents recorded yet</p>
        </motion.div>
      )}

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 p-4 flex items-center justify-center"
          onClick={() => setPreviewImageUrl(null)}
        >
          <img src={previewImageUrl} alt="Incident full preview" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}

      {detailsIncident && (
        <div
          className="fixed inset-0 z-[85] bg-black/70 p-4 flex items-end sm:items-center justify-center"
          onClick={() => setDetailsIncident(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-4 space-y-3"
            onClick={(event) => event.stopPropagation()}
          >
            <h4 className="text-base font-bold text-foreground">Incident Details</h4>
            <p className="text-sm text-muted-foreground">{detailsIncident.description || 'No description provided.'}</p>
            <p className="text-sm">
              <span className="text-muted-foreground">Reporter:</span>{' '}
              {detailsIncident.reporterPhone || 'Unavailable'}
            </p>
            <div className="flex gap-2">
              <a
                href={`tel:${detailsIncident.reporterPhone ?? ''}`}
                className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Call Reporter
              </a>
              <button
                onClick={() => setDetailsIncident(null)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
