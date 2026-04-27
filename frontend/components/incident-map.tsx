'use client'

import { useEffect, useState } from 'react'
import { GoogleMap, InfoWindowF, MarkerF, useLoadScript } from '@react-google-maps/api'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type L from 'leaflet'
import type { FireIncident, UserRole } from '@/types/incidents'

interface IncidentMapProps {
  incidents: FireIncident[]
  volunteerLocation?: { lat: number; lng: number } | null
  userRole?: UserRole
}

const defaultCenter: [number, number] = [20.932, 77.7523]
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
const hasGoogleMapsKey = googleMapsApiKey.trim().length > 0

function LeafletAutoLocate() {
  const map = useMap()

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 13 })
  }, [map])

  return null
}

const getDistanceKm = (
  from: { lat: number; lng: number } | null,
  to?: { lat: number; lng: number }
) => {
  if (!from || !to) return null
  const earthRadiusKm = 6371
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function IncidentMap({ incidents, volunteerLocation = null, userRole = 'user' }: IncidentMapProps) {
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const [showVolunteerIntel, setShowVolunteerIntel] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [icons, setIcons] = useState<{
    pendingIcon: L.DivIcon | null
    acceptedIcon: L.DivIcon | null
    victimPinIcon: L.DivIcon | null
    volunteerShieldIcon: L.DivIcon | null
  }>({
    pendingIcon: null,
    acceptedIcon: null,
    victimPinIcon: null,
    volunteerShieldIcon: null,
  })
  const isOfficial = userRole === 'authority'
  const mappable = incidents.filter(
    (incident) => Number.isFinite(incident.lat) && Number.isFinite(incident.lng)
  )
  const activeMappable = mappable.filter((incident) => incident.status !== 'resolved')
  const nearestIncident = volunteerLocation
    ? activeMappable
        .map((incident) => ({
          incident,
          distance: getDistanceKm(volunteerLocation, { lat: incident.lat, lng: incident.lng }) ?? Number.POSITIVE_INFINITY,
        }))
        .sort((first, second) => first.distance - second.distance)[0]
    : null

  const center: [number, number] = mappable.length
    ? [mappable[0].lat, mappable[0].lng]
    : defaultCenter

  const { isLoaded } = useLoadScript({
    googleMapsApiKey,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const L = require('leaflet') as typeof import('leaflet')

    // Fix Leaflet default marker icons in Next.js / Webpack environments
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
      iconUrl: 'leaflet/images/marker-icon.png',
      shadowUrl: 'leaflet/images/marker-shadow.png',
    })

    setIcons({
      pendingIcon: L.divIcon({
        className: 'incident-marker-wrapper',
        html: '<span class="incident-marker incident-marker-pending"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      acceptedIcon: L.divIcon({
        className: 'incident-marker-wrapper',
        html: '<span class="incident-marker incident-marker-accepted"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
      victimPinIcon: L.divIcon({
        className: 'incident-marker-wrapper',
        html: '<span class="official-victim-pin"></span>',
        iconSize: [26, 34],
        iconAnchor: [13, 34],
      }),
      volunteerShieldIcon: L.divIcon({
        className: 'incident-marker-wrapper',
        html: '<span class="official-volunteer-shield">◆</span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    })

    setMounted(true)
  }, [])

  if (hasGoogleMapsKey && isLoaded) {
    return (
      <div className={`h-96 w-full overflow-hidden rounded-lg border ${isOfficial ? 'border-white/10 bg-slate-950' : 'border-primary/30'}`}>
        <GoogleMap
          mapContainerClassName="h-full w-full"
          zoom={13}
          center={{ lat: center[0], lng: center[1] }}
          onLoad={(map) => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(
              (position) => {
                map.panTo({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                })
              },
              () => undefined
            )
          }}
        >
          {mappable.map((incident) => (
            <MarkerF
              key={incident.id}
              position={{ lat: incident.lat, lng: incident.lng }}
              icon={{
                path: isOfficial ? window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW : window.google.maps.SymbolPath.CIRCLE,
                fillColor: isOfficial ? '#ef4444' : incident.status === 'pending' ? '#ef4444' : '#22c55e',
                fillOpacity: 0.95,
                strokeColor: isOfficial ? '#fecaca' : '#ffffff',
                strokeWeight: isOfficial ? 1 : 0,
                scale: isOfficial ? 6 : incident.status === 'pending' ? 9 : 7,
              }}
              onClick={() => setActiveIncidentId(incident.id)}
            />
          ))}
          {mappable
            .filter((incident) => incident.id === activeIncidentId)
            .map((incident) => (
              <InfoWindowF
                key={`info-${incident.id}`}
                position={{ lat: incident.lat, lng: incident.lng }}
                onCloseClick={() => setActiveIncidentId(null)}
              >
                <div className="space-y-1">
                  <p className="font-semibold">{incident.title || `${incident.type} incident`}</p>
                  <p className="text-xs capitalize text-muted-foreground">Status: {incident.status}</p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-500 underline"
                  >
                    Open Directions
                  </a>
                </div>
              </InfoWindowF>
            ))}

          {volunteerLocation && (
            <MarkerF
              position={{ lat: volunteerLocation.lat, lng: volunteerLocation.lng }}
              icon={{
                path: isOfficial ? window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW : window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#3b82f6',
                fillOpacity: 0.95,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: isOfficial ? 7 : 8,
              }}
              onClick={() => setShowVolunteerIntel(true)}
            />
          )}
          {volunteerLocation && showVolunteerIntel && (
            <InfoWindowF
              position={{ lat: volunteerLocation.lat, lng: volunteerLocation.lng }}
              onCloseClick={() => setShowVolunteerIntel(false)}
            >
              <div className="space-y-1">
                <p className="font-semibold">Demo Volunteer</p>
                <p className="text-xs text-muted-foreground">Trust Score: 94 / 100</p>
                <p className="text-xs text-muted-foreground">
                  Nearest incident: {nearestIncident ? `${nearestIncident.distance.toFixed(2)} km` : 'Unavailable'}
                </p>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className={`h-96 w-full overflow-hidden rounded-lg border ${isOfficial ? 'border-white/10 bg-slate-950' : 'border-primary/30'}`}>
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-96 w-full overflow-hidden rounded-lg border ${isOfficial ? 'border-white/10 bg-slate-950' : 'border-primary/30'}`}>
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <LeafletAutoLocate />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.lat, incident.lng]}
            {...(
              isOfficial && icons.victimPinIcon
                ? { icon: icons.victimPinIcon }
                : incident.status === 'pending' && icons.pendingIcon
                  ? { icon: icons.pendingIcon }
                  : icons.acceptedIcon
                    ? { icon: icons.acceptedIcon }
                    : {}
            )}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{incident.title || `${incident.type} incident`}</p>
                <p className="text-xs capitalize text-muted-foreground">Status: {incident.status}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 underline"
                >
                  Open Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        {volunteerLocation && (
          <Marker
            position={[volunteerLocation.lat, volunteerLocation.lng]}
            {...(isOfficial && icons.volunteerShieldIcon ? { icon: icons.volunteerShieldIcon } : {})}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">Demo Volunteer</p>
                {isOfficial ? (
                  <>
                    <p className="text-xs text-muted-foreground">Trust Score: 94 / 100</p>
                    <p className="text-xs text-muted-foreground">
                      Nearest incident: {nearestIncident ? `${nearestIncident.distance.toFixed(2)} km` : 'Unavailable'}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">En route to incident</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

