'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface SOSTriggerProps {
  onTrigger?: () => void | Promise<void>
  highVolumeAlerts?: boolean
  lowBatteryMode?: boolean
  labels?: {
    sos: string
    tapForEmergency: string
  }
}

export function SOSTrigger({
  onTrigger,
  highVolumeAlerts = true,
  lowBatteryMode = false,
  labels = {
    sos: 'SOS',
    tapForEmergency: 'Tap for Emergency',
  },
}: SOSTriggerProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handlePress = async () => {
    setIsPressed(true)
    try {
      await onTrigger?.()
    } finally {
      // Reset after feedback animation
      setTimeout(() => setIsPressed(false), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col items-center justify-center gap-8 flex-1 py-8"
    >
      {/* SOS Button Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow rings */}
        {!lowBatteryMode && (
          <motion.div
            animate={{
              boxShadow: highVolumeAlerts
                ? [
                    '0 0 24px rgba(239, 68, 68, 0.45), 0 0 52px rgba(239, 68, 68, 0.3)',
                    '0 0 80px rgba(239, 68, 68, 0.9), 0 0 130px rgba(239, 68, 68, 0.58)',
                    '0 0 24px rgba(239, 68, 68, 0.45), 0 0 52px rgba(239, 68, 68, 0.3)',
                  ]
                : [
                    '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.2)',
                    '0 0 60px rgba(239, 68, 68, 0.6), 0 0 100px rgba(239, 68, 68, 0.4)',
                    '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.2)',
                  ],
            }}
            transition={{ duration: highVolumeAlerts ? 0.9 : 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
          />
        )}

        {/* Inner animated pulse */}
        {!lowBatteryMode && (
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="sos-pulse absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-600 opacity-20"
          />
        )}

        {/* Main SOS Button - Extra Large */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handlePress}
          disabled={isPressed}
          className={`relative flex h-[clamp(220px,68vw,320px)] w-[clamp(220px,68vw,320px)] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 transition-all duration-200 hover:from-red-600 hover:to-red-800 disabled:opacity-75 active:scale-95 ${
            highVolumeAlerts && !lowBatteryMode
              ? 'animate-sos-red-glow shadow-2xl shadow-red-500/70'
              : 'shadow-2xl shadow-red-500/50'
          }`}
        >
          {/* Button content */}
          <motion.div
            animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <AlertCircle size={64} className="text-white" strokeWidth={1.5} />
            <span className="px-4 text-center text-2xl font-bold tracking-widest text-white sm:text-3xl">
              {labels.sos}
            </span>
          </motion.div>
        </motion.button>
      </div>

      {/* Status message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-muted-foreground text-sm">
          {isPressed ? 'Emergency alert sent...' : labels.tapForEmergency}
        </p>
      </motion.div>

      {/* Success animation */}
      {isPressed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
            transition={{ duration: 0.6 }}
            className="w-80 h-80 rounded-full border-4 border-accent"
          />
        </motion.div>
      )}
    </motion.div>
  )
}
