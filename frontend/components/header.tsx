'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Menu, User, Battery, Volume2, Languages, Moon, Sun, CircleHelp, X } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

export type AppLanguage = 'EN' | 'HI'
export type ThemeMode = 'dark' | 'light'

export interface UserProfile {
  fullName: string
  bloodType: string
  emergencyContactNumber: string
}

export interface AppSettings {
  lowBatteryMode: boolean
  highVolumeAlerts: boolean
  language: AppLanguage
  themeMode: ThemeMode
}

interface HeaderProps {
  onStartDemo?: () => void
  isDemoRunning?: boolean
  showDemoTrigger?: boolean
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function Header({
  onStartDemo,
  isDemoRunning = false,
  showDemoTrigger = false,
  settings,
  onSettingsChange,
}: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    bloodType: '',
    emergencyContactNumber: '',
  })
  const [profileStatus, setProfileStatus] = useState('')

  const updateSetting = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem('crisisconnect:user-profile')
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile) as UserProfile)
      }
    } catch {
      // Ignore malformed demo data and keep the form usable.
    }
  }, [])

  const handleProfileSave = async () => {
    setProfileStatus('Saving...')
    try {
      const currentUser = auth.currentUser
      if (currentUser && !currentUser.isAnonymous) {
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            profile,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      } else {
        window.localStorage.setItem('crisisconnect:user-profile', JSON.stringify(profile))
      }
      setProfileStatus('Profile saved')
      window.setTimeout(() => {
        setProfileStatus('')
        setIsProfileOpen(false)
      }, 650)
    } catch (error) {
      console.error('Profile save failed:', error)
      window.localStorage.setItem('crisisconnect:user-profile', JSON.stringify(profile))
      setProfileStatus('Saved locally for demo')
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-md border-b border-border/50"
    >
      <div className="flex h-16 items-center px-4">
        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-1 items-center justify-start"
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px] rounded-xl border-border/60 bg-slate-900/35 text-foreground hover:bg-slate-800/50"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="border-border/70 bg-gradient-to-b from-[#0a1628]/95 to-[#1a2847]/90 backdrop-blur-md p-0"
            >
              <SheetHeader className="border-b border-white/10 pb-4">
                <SheetTitle className="text-base text-foreground">CrisisConnect Settings</SheetTitle>
                <SheetDescription className="text-slate-300">
                  Configure your emergency experience quickly.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4 overflow-y-auto">
                <section className="rounded-xl border border-white/10 bg-slate-900/35 p-3">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">User Profile</h3>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-slate-300" />
                      <p className="text-sm text-slate-200">Anonymous User</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsProfileOpen(true)}
                      className="h-8 border-white/20 bg-transparent text-xs"
                    >
                      Complete Profile
                    </Button>
                  </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-slate-900/35 p-3">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Emergency Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Battery className="size-4 text-slate-300" />
                        <span className="text-sm text-slate-200">Low Battery Mode</span>
                      </div>
                      <Switch
                        checked={settings.lowBatteryMode}
                        onCheckedChange={(checked) => updateSetting('lowBatteryMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="size-4 text-slate-300" />
                        <span className="text-sm text-slate-200">High Volume Alerts</span>
                      </div>
                      <Switch
                        checked={settings.highVolumeAlerts}
                        onCheckedChange={(checked) => updateSetting('highVolumeAlerts', checked)}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-slate-900/35 p-3">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">App Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Languages className="size-4 text-slate-300" />
                        <span className="text-sm text-slate-200">Language</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-slate-900/40 p-1">
                        <button
                          onClick={() => updateSetting('language', 'EN')}
                          className={`min-h-[32px] rounded-md px-2 text-xs font-semibold ${
                            settings.language === 'EN' ? 'bg-primary text-primary-foreground' : 'text-slate-300'
                          }`}
                        >
                          EN
                        </button>
                        <button
                          onClick={() => updateSetting('language', 'HI')}
                          className={`min-h-[32px] rounded-md px-2 text-xs font-semibold ${
                            settings.language === 'HI' ? 'bg-primary text-primary-foreground' : 'text-slate-300'
                          }`}
                        >
                          HI
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {settings.themeMode === 'dark' ? (
                          <Moon className="size-4 text-slate-300" />
                        ) : (
                          <Sun className="size-4 text-slate-300" />
                        )}
                        <span className="text-sm text-slate-200">Dark/Light Mode</span>
                      </div>
                      <Switch
                        checked={settings.themeMode === 'dark'}
                        onCheckedChange={(checked) => updateSetting('themeMode', checked ? 'dark' : 'light')}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-slate-900/35 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">About</h3>
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="flex min-h-[40px] w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 px-3 text-sm text-slate-200 hover:bg-slate-800/50"
                  >
                    <span className="flex items-center gap-2">
                      <CircleHelp className="size-4" />
                      How it Works
                    </span>
                    <span className="text-xs text-slate-400">For judges</span>
                  </button>
                </section>
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>

        {/* Middle Section */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex flex-1 items-center justify-center"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/70 shadow-lg shadow-accent/40">
              <span className="text-lg font-bold text-white leading-none">C</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-foreground leading-none">CrisisConnect</h1>
          </div>
        </motion.div>

        {/* Right Section */}
        <div className="flex flex-1 items-center justify-end">
          {showDemoTrigger && onStartDemo && (
            <button
              onClick={onStartDemo}
              disabled={isDemoRunning}
              className="h-9 rounded-lg border border-border/60 bg-transparent px-2.5 text-xs font-semibold text-muted-foreground hover:bg-card/60 hover:text-foreground disabled:opacity-50"
            >
              {isDemoRunning ? 'Demo...' : 'Start Demo'}
            </button>
          )}
        </div>
      </div>

      <DialogPrimitive.Root open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/70" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[91] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <DialogPrimitive.Title className="text-base font-bold">Complete Profile</DialogPrimitive.Title>
              <DialogPrimitive.Close className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Full Name
                <input
                  value={profile.fullName}
                  onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-emerald-300/60"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-300">
                Blood Type
                <input
                  value={profile.bloodType}
                  onChange={(event) => setProfile({ ...profile, bloodType: event.target.value })}
                  placeholder="O+, A-, AB+"
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-emerald-300/60"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-300">
                Emergency Contact Number
                <input
                  value={profile.emergencyContactNumber}
                  onChange={(event) =>
                    setProfile({ ...profile, emergencyContactNumber: event.target.value })
                  }
                  type="tel"
                  className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-emerald-300/60"
                />
              </label>
              <Button onClick={() => void handleProfileSave()} className="h-11 w-full">
                Save Profile
              </Button>
              {profileStatus && <p className="text-center text-xs text-emerald-200">{profileStatus}</p>}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/70" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[91] flex max-h-[82dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <DialogPrimitive.Title className="text-base font-bold">How CrisisConnect Works</DialogPrimitive.Title>
              <DialogPrimitive.Close className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="space-y-4 overflow-y-auto pr-1 text-sm leading-6 text-slate-300">
              <p>
                A victim taps the emergency button. CrisisConnect captures location, creates a live incident,
                and keeps the request visible in the command queue.
              </p>
              <p>
                Nearby verified volunteers receive the alert. A responder accepts, creating communication
                ownership so multiple people do not call the victim at the same time.
              </p>
              <p>
                Officials watch the map: red victim pins show active incidents and blue shields show trusted
                volunteers, including proximity to the nearest incident.
              </p>
              <p>
                Once help is confirmed, the incident is marked resolved. The dashboard clears the board for
                the next simulation while preserving the story of response.
              </p>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </motion.header>
  )
}
