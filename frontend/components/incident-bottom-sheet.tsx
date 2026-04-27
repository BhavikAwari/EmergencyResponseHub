'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Phone, CheckCircle2, X, MapPin } from 'lucide-react'
import { Incident } from './incident-feed'

interface IncidentBottomSheetProps {
  incident: Incident | null
  isOpen: boolean
  onClose: () => void
  onCallVictim: () => void
  onMarkResolved: () => void
}

export function IncidentBottomSheet({
  incident,
  isOpen,
  onClose,
  onCallVictim,
  onMarkResolved,
}: IncidentBottomSheetProps) {
  if (!incident) return null

  const incidentTypeConfig = {
    fire: {
      label: 'Fire',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/20',
      icon: '🔥',
    },
    medical: {
      label: 'Medical Emergency',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      icon: '🚑',
    },
    accident: {
      label: 'Traffic Accident',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      icon: '🚗',
    },
    other: {
      label: 'Other Emergency',
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/20',
      icon: '⚠️',
    },
  }
  const typeBorderClass = {
    fire: 'border-orange-400/30',
    medical: 'border-blue-400/30',
    accident: 'border-yellow-400/30',
    other: 'border-gray-400/30',
  }

  const config = incidentTypeConfig[incident.type]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 1,
            }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* Frosted Glass Container */}
            <div className="relative mx-auto w-full max-w-2xl rounded-t-3xl bg-gradient-to-b from-card/95 to-card/85 border border-border/40 shadow-2xl overflow-hidden">
              {/* Glassmorphism Effect */}
              <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />

              {/* Content */}
              <div className="relative p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                {/* Handle Bar */}
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-1 rounded-full bg-gradient-to-r from-border via-border/60 to-border" />
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="space-y-4 pt-2">
                  {/* Incident Type Badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor} border ${typeBorderClass[incident.type]}`}>
                    <span className="text-xl">{config.icon}</span>
                    <span className={`font-bold text-sm ${config.color}`}>{config.label}</span>
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-foreground">
                      Incident Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Reported {incident.time} at {incident.location || 'Unknown Location'}
                    </p>
                  </div>
                </div>

                {/* Distance and Status Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-card/40 border border-border/30 backdrop-blur">
                    <p className="text-xs text-muted-foreground mb-1">Distance</p>
                    <p className="text-2xl font-bold text-foreground">{incident.distance} km</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/40 border border-border/30 backdrop-blur">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <p className={`text-lg font-bold capitalize ${incident.status === 'pending' ? 'text-accent' : 'text-green-400'}`}>
                      {incident.status}
                    </p>
                  </div>
                </div>

                {/* Mini Map Placeholder */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Location Map</p>
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10">
                    {/* Mini Map Background */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22grid%22%20width%3D%2210%22%20height%3D%2210%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2010%200L0%200%200%2010%22%20fill%3D%22none%22%20stroke%3D%22%234a5568%22%20stroke-width%3D%220.5%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23192238%22/%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22url(%23grid)%22/%3E%3C/svg%3E')] opacity-40" />

                    {/* Incident Marker */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute w-3 h-3 bg-accent rounded-full blur-sm"
                      />
                      <div className="w-3 h-3 bg-accent rounded-full" />
                    </motion.div>

                    {/* Map Info */}
                    <div className="absolute bottom-3 left-3 backdrop-blur-sm bg-card/60 border border-border/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span>{incident.location || 'Live Location'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                  {/* Call Victim Button - 48px min height */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCallVictim}
                    className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-400/40 p-4 font-semibold text-blue-300 hover:from-blue-500/40 hover:to-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Phone className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Call Victim</span>
                  </motion.button>

                  {/* Mark as Resolved Button - 48px min height */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onMarkResolved}
                    className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-600/20 border border-green-400/40 p-4 font-semibold text-green-300 hover:from-green-500/40 hover:to-emerald-600/30 transition-all duration-300 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CheckCircle2 className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Resolved</span>
                  </motion.button>
                </div>

                {/* Priority Badge */}
                {incident.priority && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="pt-2"
                  >
                    <div className={`text-center text-xs font-bold uppercase tracking-wide py-2 px-3 rounded-lg ${
                      incident.priority === 'high'
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : incident.priority === 'medium'
                          ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                          : 'bg-green-400/20 text-green-300 border border-green-400/30'
                    }`}>
                      {incident.priority} priority
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
