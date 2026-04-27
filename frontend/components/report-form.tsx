'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Flame, HeartPulse, ShieldAlert, Camera } from 'lucide-react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { createIncident } from '@/lib/api'
import { storage } from '@/lib/firebase'

type ReportType = 'medical' | 'fire' | 'accident' | 'security' | 'other'

interface ReportFormProps {
  defaultPhone: string
  onSubmitted: () => void
}

interface ReportDraft {
  incidentType: ReportType
  description: string
  isMyself: boolean
  mobileNumber: string
}

interface QueuedReport extends ReportDraft {
  queuedAt: string
  lat: number | null
  lng: number | null
}

const REPORT_DRAFT_STORAGE_KEY = 'crisisconnect-report-draft'
const REPORT_QUEUE_STORAGE_KEY = 'crisisconnect-report-queue'

const reportTypeOptions: Array<{ id: ReportType; label: string; icon: React.ReactNode }> = [
  { id: 'medical', label: 'Medical', icon: <HeartPulse className="h-6 w-6" /> },
  { id: 'fire', label: 'Fire', icon: <Flame className="h-6 w-6" /> },
  { id: 'accident', label: 'Accident', icon: <AlertCircle className="h-6 w-6" /> },
  { id: 'security', label: 'Security', icon: <ShieldAlert className="h-6 w-6" /> },
  { id: 'other', label: 'Other', icon: <AlertCircle className="h-6 w-6" /> },
]

export function ReportForm({ defaultPhone, onSubmitted }: ReportFormProps) {
  const [incidentType, setIncidentType] = useState<ReportType>('medical')
  const [description, setDescription] = useState('')
  const [isMyself, setIsMyself] = useState(true)
  const [mobileNumber, setMobileNumber] = useState(defaultPhone)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('Report Filed')
  const [isOffline, setIsOffline] = useState(false)
  const [queuedCount, setQueuedCount] = useState(0)

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : ''),
    [photoFile]
  )

  const syncQueuedCount = () => {
    if (typeof window === 'undefined') return

    const storedQueue = window.localStorage.getItem(REPORT_QUEUE_STORAGE_KEY)
    const queue = storedQueue ? (JSON.parse(storedQueue) as QueuedReport[]) : []
    setQueuedCount(queue.length)
  }

  const clearDraft = () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(REPORT_DRAFT_STORAGE_KEY)
  }

  const resetForm = () => {
    setIncidentType('medical')
    setDescription('')
    setIsMyself(true)
    setMobileNumber(defaultPhone)
    setPhotoFile(null)
    clearDraft()
  }

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

  const saveDraft = (draft: ReportDraft) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(REPORT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }

  const queueReport = (report: QueuedReport) => {
    if (typeof window === 'undefined') return

    const storedQueue = window.localStorage.getItem(REPORT_QUEUE_STORAGE_KEY)
    const queue = storedQueue ? (JSON.parse(storedQueue) as QueuedReport[]) : []
    queue.push(report)
    window.localStorage.setItem(REPORT_QUEUE_STORAGE_KEY, JSON.stringify(queue))
    setQueuedCount(queue.length)
  }

  const submitOnlineReport = async (report: QueuedReport, photo?: File | null) => {
    let imageUrl = ''

    if (photo) {
      const imageRef = ref(storage, `incident-images/${Date.now()}-${photo.name}`)
      await uploadBytes(imageRef, photo)
      imageUrl = await getDownloadURL(imageRef)
    }

    await createIncident({
      type: report.incidentType,
      title: `${report.incidentType.toUpperCase()} Report`,
      description: report.description,
      status: 'pending',
      reportFor: report.isMyself ? 'myself' : 'someone-else',
      reporterPhone: report.mobileNumber,
      imageUrl,
      lat: report.lat ?? 0,
      lng: report.lng ?? 0,
      createdAt: new Date(),
    })
  }

  const flushQueuedReports = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return

    const storedQueue = window.localStorage.getItem(REPORT_QUEUE_STORAGE_KEY)
    const queue = storedQueue ? (JSON.parse(storedQueue) as QueuedReport[]) : []

    if (!queue.length) {
      setQueuedCount(0)
      return
    }

    const remaining: QueuedReport[] = []

    for (const report of queue) {
      try {
        await submitOnlineReport(report)
      } catch (error) {
        console.error('Failed to sync queued report:', error)
        remaining.push(report)
      }
    }

    window.localStorage.setItem(REPORT_QUEUE_STORAGE_KEY, JSON.stringify(remaining))
    setQueuedCount(remaining.length)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedDraft = window.localStorage.getItem(REPORT_DRAFT_STORAGE_KEY)
    if (savedDraft) {
      const draft = JSON.parse(savedDraft) as ReportDraft
      setIncidentType(draft.incidentType)
      setDescription(draft.description)
      setIsMyself(draft.isMyself)
      setMobileNumber(draft.mobileNumber)
    }

    setIsOffline(!navigator.onLine)
    syncQueuedCount()
    void flushQueuedReports()

    const handleOnline = () => {
      setIsOffline(false)
      void flushQueuedReports()
    }

    const handleOffline = () => {
      setIsOffline(true)
      syncQueuedCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    saveDraft({
      incidentType,
      description,
      isMyself,
      mobileNumber,
    })
  }, [description, incidentType, isMyself, mobileNumber])

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('Please add incident details before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      let lat: number | null = null
      let lng: number | null = null

      try {
        const position = await getCurrentPosition()
        lat = position.coords.latitude
        lng = position.coords.longitude
      } catch (error) {
        console.warn('Could not resolve current position:', error)
      }

      const reportPayload: QueuedReport = {
        incidentType,
        description: description.trim(),
        isMyself,
        mobileNumber,
        queuedAt: new Date().toISOString(),
        lat,
        lng,
      }

      if (!navigator.onLine) {
        queueReport(reportPayload)
        resetForm()
        setSuccessMessage(
          photoFile
            ? 'Saved Offline (without photo)'
            : 'Saved Offline'
        )
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
        }, 1800)
        return
      }

      await submitOnlineReport(reportPayload, photoFile)
      resetForm()
      setSuccessMessage('Report Filed')
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onSubmitted()
      }, 1400)
    } catch (error) {
      console.error('Failed to submit report:', error)
      alert('Could not submit report. Please check location and network.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/40 p-4">
      {(isOffline || queuedCount > 0) && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          {isOffline
            ? 'Offline mode: reports are saved on this device and synced when the connection returns.'
            : `${queuedCount} offline report${queuedCount === 1 ? '' : 's'} waiting to sync.`}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Incident Type</p>
        <div className="grid grid-cols-2 gap-2">
          {reportTypeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setIncidentType(option.id)}
              className={`min-h-[56px] rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                incidentType === option.id
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border bg-background/40 text-foreground'
              }`}
            >
              <span className="mb-1 flex justify-center">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Who is this report for?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setIsMyself(true)
              setMobileNumber(defaultPhone)
            }}
            className={`min-h-[48px] rounded-xl border text-sm font-medium ${
              isMyself ? 'border-accent bg-accent/15 text-accent' : 'border-border'
            }`}
          >
            Myself
          </button>
          <button
            onClick={() => setIsMyself(false)}
            className={`min-h-[48px] rounded-xl border text-sm font-medium ${
              !isMyself ? 'border-accent bg-accent/15 text-accent' : 'border-border'
            }`}
          >
            Someone Else
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Mobile Number</label>
        <input
          value={mobileNumber}
          onChange={(event) => setMobileNumber(event.target.value)}
          className="min-h-[48px] w-full rounded-xl border border-border bg-background/40 px-3 text-sm"
          placeholder="+91 9XXXXXXXXX"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Details</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[110px] w-full rounded-xl border border-border bg-background/40 p-3 text-sm"
          placeholder="Describe what happened, injuries, landmarks, etc."
        />
      </div>

      <div className="space-y-2">
        <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-3 text-sm font-medium">
          <Camera className="h-5 w-5" />
          Capture Image
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Captured incident"
            className="h-24 w-24 rounded-lg border border-border object-cover"
          />
        )}
      </div>

      <button
        onClick={() => void handleSubmit()}
        disabled={isSubmitting}
        className="min-h-[52px] w-full rounded-xl bg-accent text-base font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="rounded-xl border border-green-400/40 bg-green-500/15 p-3 text-center text-sm font-semibold text-green-300"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
