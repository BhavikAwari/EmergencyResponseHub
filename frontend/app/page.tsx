'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, type AppSettings } from '@/components/header'
import { RoleSwitcher } from '@/components/role-switcher'
import { SOSTrigger } from '@/components/sos-trigger'
import { NavigationBar } from '@/components/navigation-bar'
import { IncidentFeed, type Incident } from '@/components/incident-feed'
import { VolunteerDashboard } from '@/components/volunteer-dashboard'
import { IncidentBottomSheet } from '@/components/incident-bottom-sheet'
import { ReportForm } from '@/components/report-form'
import { createIncident, fetchIncidents, patchIncident, subscribeToIncidents } from '@/lib/api'
import type { FireIncident } from '@/types/incidents'

type Role = 'user' | 'volunteer' | 'authority'
type NavTab = 'home' | 'report' | 'map' | 'history'
const IncidentMap = dynamic(
  () => import('@/components/incident-map').then((mod) => mod.IncidentMap),
  { ssr: false, loading: () => <div className="h-96 w-full animate-pulse rounded-lg bg-muted" /> }
)

const SETTINGS_STORAGE_KEY = 'crisisconnect:app-settings'

const defaultSettings: AppSettings = {
  lowBatteryMode: false,
  highVolumeAlerts: true,
  language: 'EN',
  themeMode: 'dark',
}

const i18n = {
  EN: {
    sos: 'SOS',
    tapForEmergency: 'Tap for Emergency',
    home: 'Home',
  },
  HI: {
    sos: '\u0906\u092a\u093e\u0924\u0915\u093e\u0932\u0940\u0928',
    tapForEmergency:
      '\u0906\u092a\u093e\u0924\u0915\u093e\u0932\u0940\u0928 \u0938\u094d\u0925\u093f\u0924\u093f \u0915\u0947 \u0932\u093f\u090f \u091f\u0948\u092a \u0915\u0930\u0947\u0902',
    home: '\u092e\u0941\u0916\u094d\u092f',
  },
}

export default function Home() {
  const [userRole, setUserRole] = useState<Role>('user')
  const [currentTab, setCurrentTab] = useState<NavTab>('home')
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [volunteerLocation, setVolunteerLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [incidents, setIncidents] = useState<FireIncident[]>([])
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [myPhone] = useState('+91 9876543210')
  const simulationTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isHackathonMode =
    process.env.NEXT_PUBLIC_HACKATHON_MODE === 'true' || process.env.NODE_ENV !== 'production'
  const historyIncidents: Incident[] = incidents.map((incident) => ({
    id: incident.id,
    type:
      incident.type === 'fire' ||
      incident.type === 'medical' ||
      incident.type === 'accident'
        ? incident.type
        : 'other',
    status: incident.status === 'accepted' ? 'accepted' : incident.status === 'resolved' ? 'resolved' : 'pending',
    distance: 0,
    time: incident.createdAt
      ? `${Math.max(1, Math.round((Date.now() - incident.createdAt.getTime()) / 60000))} min ago`
      : 'Just now',
    location: `${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)}`,
    priority: incident.priority,
    description: incident.description,
    reporterPhone: incident.reporterPhone,
    imageUrl: incident.imageUrl,
  }))

  useEffect(() => {
    try {
      const savedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...(JSON.parse(savedSettings) as Partial<AppSettings>) })
      }
    } catch {
      setSettings(defaultSettings)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', settings.themeMode === 'dark')
    root.classList.toggle('light', settings.themeMode === 'light')
    root.classList.toggle('low-battery-mode', settings.lowBatteryMode)
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    let isMounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const syncIncidents = async () => {
      try {
        const liveIncidents = await fetchIncidents()
        if (isMounted) {
          setIncidents(liveIncidents)
        }
      } catch (error) {
        console.error('Failed to sync incidents from backend:', error)
      }
    }

    const startFallbackPolling = () => {
      if (intervalId) return
      void syncIncidents()
      intervalId = setInterval(() => {
        void syncIncidents()
      }, 3000)
    }

    const unsubscribe = subscribeToIncidents(
      (liveIncidents) => {
        if (isMounted) {
          setIncidents(liveIncidents)
        }
      },
      (error) => {
        console.error('Firestore realtime incident sync failed:', error)
        startFallbackPolling()
      }
    )

    return () => {
      isMounted = false
      unsubscribe()
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      simulationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      simulationTimeoutsRef.current = []
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
        simulationIntervalRef.current = null
      }
    }
  }, [])

  const getCurrentPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })

  const handleSOSTrigger = async () => {
    try {
      const position = await getCurrentPosition()
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      await createIncident({
        type: 'SOS',
        status: 'pending',
        lat: latitude,
        lng: longitude,
        createdAt: new Date(),
      })

      if ('vibrate' in navigator) {
        navigator.vibrate([120, 60, 120])
      }

      alert('Success: SOS sent and now live in History.')
      setCurrentTab('history')
    } catch (error) {
      console.error('SOS send failed:', error)
      alert('Unable to send SOS. Please enable location permission and try again.')
    }
  }

  const startSimulation = async () => {
    if (isDemoRunning) return

    simulationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    simulationTimeoutsRef.current = []
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }

    setIsDemoRunning(true)
    setCurrentTab('home')

    try {
      const incidentLat = 20.937
      const incidentLng = 77.779

      const incident = await createIncident({
        type: 'medical',
        status: 'pending',
        title: 'Heart Attack',
        description: 'Demo: heart attack emergency generated for judge walkthrough',
        priority: 'high',
        lat: incidentLat,
        lng: incidentLng,
        createdAt: new Date(),
      })

      const volunteerStart = {
        lat: incidentLat + 0.02,
        lng: incidentLng + 0.02,
      }
      setVolunteerLocation(volunteerStart)

      simulationTimeoutsRef.current.push(
        setTimeout(() => {
          setCurrentTab('history')
        }, 1500)
      )

      simulationTimeoutsRef.current.push(
        setTimeout(async () => {
          try {
            await patchIncident(incident.id, {
              status: 'accepted',
              responderId: 'demo-volunteer',
              acceptedAt: new Date().toISOString(),
            })

            setCurrentTab('map')

            let stepCount = 0
            simulationIntervalRef.current = setInterval(() => {
              stepCount += 1
              setVolunteerLocation((current) => {
                if (!current) return current
                const nextLat = current.lat + (incidentLat - current.lat) * 0.25
                const nextLng = current.lng + (incidentLng - current.lng) * 0.25
                const isCloseEnough =
                  Math.abs(nextLat - incidentLat) < 0.00015 && Math.abs(nextLng - incidentLng) < 0.00015

                if (isCloseEnough || stepCount >= 20) {
                  if (simulationIntervalRef.current) {
                    clearInterval(simulationIntervalRef.current)
                    simulationIntervalRef.current = null
                  }
                  setIsDemoRunning(false)
                  return { lat: incidentLat, lng: incidentLng }
                }

                return { lat: nextLat, lng: nextLng }
              })
            }, 1000)
          } catch (innerError) {
            console.error('Demo acceptance/movement simulation failed:', innerError)
            setIsDemoRunning(false)
          }
        }, 5000)
      )
    } catch (error) {
      console.error('Demo simulation failed:', error)
      alert('Demo failed. Check Firebase rules/config and try again.')
      setIsDemoRunning(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      {/* Header */}
      <Header
        onStartDemo={startSimulation}
        isDemoRunning={isDemoRunning}
        showDemoTrigger={isHackathonMode}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Role Selection Bar */}
      <RoleSwitcher onRoleChange={setUserRole} />

      {/* Main Content Container - Mobile-First PWA */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-4 pb-24 overflow-y-auto scrollbar-hide">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {/* Home Tab */}
            {currentTab === 'home' && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-col items-center justify-center h-full w-full gap-6"
              >
                {/* User Role - SOS Button */}
                {userRole === 'user' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="flex flex-col items-center justify-center w-full h-full"
                  >
                    <SOSTrigger
                      onTrigger={handleSOSTrigger}
                      highVolumeAlerts={settings.highVolumeAlerts}
                      lowBatteryMode={settings.lowBatteryMode}
                      labels={i18n[settings.language]}
                    />
                  </motion.div>
                )}

                {/* Volunteer Role - Volunteer Dashboard */}
                {(userRole === 'volunteer' || userRole === 'authority') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="w-full space-y-4"
                  >
                    <VolunteerDashboard
                      incidents={incidents}
                      userRole={userRole}
                      onAccept={(alertId) => {
                        console.log('Volunteer accepted alert:', alertId)
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Report Tab */}
            {currentTab === 'report' && (
              <motion.div
                key="report-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Report Emergency</h2>
                  <p className="text-muted-foreground">Create a new emergency report</p>
                </div>
                <ReportForm defaultPhone={myPhone} onSubmitted={() => setCurrentTab('history')} />
              </motion.div>
            )}

            {/* Map Tab */}
            {currentTab === 'map' && (
              <motion.div
                key="map-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {userRole === 'authority' ? 'Regional Operations Map' : 'Emergency Map'}
                  </h2>
                  <p className="text-muted-foreground">
                    {userRole === 'authority'
                      ? 'Victims, verified volunteers, and dispatch proximity'
                      : 'View incidents in your area'}
                  </p>
                </div>

                <IncidentMap
                  incidents={incidents}
                  volunteerLocation={volunteerLocation}
                  userRole={userRole}
                />
              </motion.div>
            )}

            {/* History Tab */}
            {currentTab === 'history' && (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full space-y-4"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Emergency History</h2>
                  <p className="text-muted-foreground">Your recent incidents</p>
                </div>

                {/* Incident Feed */}
                <IncidentFeed
                  incidents={historyIncidents}
                  onIncidentSelect={(incident) => {
                    setSelectedIncident(incident)
                    setIsBottomSheetOpen(true)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Fixed Bottom Navigation */}
      <NavigationBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        labels={{ home: i18n[settings.language].home }}
      />

      {/* Incident Bottom Sheet Modal */}
      <IncidentBottomSheet
        incident={selectedIncident}
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onCallVictim={() => {
          console.log('Calling victim for incident:', selectedIncident?.id)
        }}
        onMarkResolved={() => {
          console.log('Marking as resolved:', selectedIncident?.id)
          setIsBottomSheetOpen(false)
        }}
      />
    </div>
  )
}
