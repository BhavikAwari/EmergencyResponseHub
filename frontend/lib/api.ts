import type { FireIncident } from '@/types/incidents'
import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

const jsonHeaders = {
  'Content-Type': 'application/json',
}

const LOCAL_INCIDENTS_KEY = 'crisisconnect:local-incidents'

const getCreatedAt = (value: unknown): Date | undefined => {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeTimestamp = value as { toDate?: () => Date }
    return maybeTimestamp.toDate?.()
  }
  return new Date(String(value))
}

const serializeIncidentInput = (
  input: Partial<FireIncident> & Record<string, unknown>
): Record<string, unknown> => ({
  ...input,
  createdAt:
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : input.createdAt ?? new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const parseIncident = (incident: Record<string, unknown>): FireIncident => ({
  id: String(incident.id ?? ''),
  type: String(incident.type ?? 'SOS'),
  status: (incident.status as FireIncident['status']) ?? 'pending',
  lat: Number(incident.lat ?? 0),
  lng: Number(incident.lng ?? 0),
  priority: incident.priority as FireIncident['priority'] | undefined,
  title: incident.title ? String(incident.title) : undefined,
  description: incident.description ? String(incident.description) : undefined,
  imageUrl: incident.imageUrl ? String(incident.imageUrl) : undefined,
  reporterPhone: incident.reporterPhone ? String(incident.reporterPhone) : undefined,
  responderId: incident.responderId ? String(incident.responderId) : undefined,
  createdAt: getCreatedAt(incident.createdAt),
})

const readLocalIncidents = (): FireIncident[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LOCAL_INCIDENTS_KEY)
    const payload = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []
    return payload.map(parseIncident)
  } catch {
    return []
  }
}

const writeLocalIncidents = (incidents: FireIncident[]) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    LOCAL_INCIDENTS_KEY,
    JSON.stringify(
      incidents.map((incident) => ({
        ...incident,
        createdAt: incident.createdAt?.toISOString(),
      }))
    )
  )
}

const createLocalIncident = (
  input: Partial<FireIncident> & Record<string, unknown>
): FireIncident => {
  const now = new Date()
  const incident = parseIncident({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    type: input.type ?? 'SOS',
    status: input.status ?? 'pending',
    lat: input.lat ?? 0,
    lng: input.lng ?? 0,
    priority: input.priority,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    reporterPhone: input.reporterPhone,
    responderId: input.responderId,
    createdAt: input.createdAt ?? now.toISOString(),
  })
  const incidents = [incident, ...readLocalIncidents()]
  writeLocalIncidents(incidents)
  return incident
}

const fetchFirestoreIncidents = async (): Promise<FireIncident[]> => {
  const snapshot = await getDocs(getIncidentsQuery())
  return snapshot.docs.map((entry) =>
    parseIncident({
      id: entry.id,
      ...(entry.data() as DocumentData),
    })
  )
}

const getIncidentsQuery = () => query(collection(db, 'incidents'), orderBy('createdAt', 'desc'))

const fetchBackendIncidents = async (): Promise<FireIncident[]> => {
  const response = await fetch(`${API_BASE_URL}/api/incidents`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to fetch incidents')
  }

  const payload = (await response.json()) as { data?: Record<string, unknown>[] }
  return (payload.data ?? []).map(parseIncident)
}

export function subscribeToIncidents(
  onNext: (incidents: FireIncident[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    getIncidentsQuery(),
    (snapshot) => {
      const incidents = snapshot.docs.map((entry) =>
        parseIncident({
          id: entry.id,
          ...(entry.data() as DocumentData),
        })
      )
      writeLocalIncidents(incidents)
      onNext(incidents)
    },
    (error) => {
      onError?.(error)
    }
  )
}

export async function fetchIncidents(): Promise<FireIncident[]> {
  try {
    const incidents = await fetchFirestoreIncidents()
    writeLocalIncidents(incidents)
    return incidents
  } catch {
    try {
      const incidents = await fetchBackendIncidents()
      writeLocalIncidents(incidents)
      return incidents
    } catch {
      return readLocalIncidents()
    }
  }
}

export async function createIncident(
  input: Partial<FireIncident> & Record<string, unknown>
): Promise<FireIncident> {
  try {
    const firestoreInput = serializeIncidentInput(input)
    const incidentRef = await addDoc(collection(db, 'incidents'), firestoreInput)
    const incident = parseIncident({
      id: incidentRef.id,
      ...firestoreInput,
    })
    writeLocalIncidents([incident, ...readLocalIncidents().filter((entry) => entry.id !== incident.id)])
    return incident
  } catch {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        throw new Error('Failed to create incident')
      }
      const payload = (await response.json()) as { data: Record<string, unknown> }
      const incident = parseIncident(payload.data)
      writeLocalIncidents([incident, ...readLocalIncidents().filter((entry) => entry.id !== incident.id)])
      return incident
    } catch {
      return createLocalIncident(input)
    }
  }
}

export async function patchIncident(
  incidentId: string,
  input: Partial<FireIncident> & Record<string, unknown>
): Promise<FireIncident> {
  try {
    const firestoreInput = {
      ...input,
      updatedAt: new Date().toISOString(),
    }
    await updateDoc(doc(db, 'incidents', incidentId), firestoreInput)
    const existing = readLocalIncidents().find((incident) => incident.id === incidentId)
    const incident = parseIncident({
      ...existing,
      id: incidentId,
      ...firestoreInput,
      createdAt: existing?.createdAt,
    })
    writeLocalIncidents(
      readLocalIncidents().map((entry) => (entry.id === incidentId ? incident : entry))
    )
    return incident
  } catch {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        throw new Error('Failed to update incident')
      }
      const payload = (await response.json()) as { data: Record<string, unknown> }
      const incident = parseIncident(payload.data)
      writeLocalIncidents(
        readLocalIncidents().map((entry) => (entry.id === incidentId ? incident : entry))
      )
      return incident
    } catch {
      const incidents = readLocalIncidents()
      const existing = incidents.find((incident) => incident.id === incidentId)
      if (!existing) {
        throw new Error('Incident not found')
      }

      const updated = {
        ...existing,
        ...input,
        createdAt: existing.createdAt,
      } as FireIncident
      writeLocalIncidents(incidents.map((incident) => (incident.id === incidentId ? updated : incident)))
      return updated
    }
  }
}
