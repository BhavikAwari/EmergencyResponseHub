export type UserRole = 'user' | 'volunteer' | 'authority'

export interface FireIncident {
  id: string
  type: string
  status: 'pending' | 'verified' | 'accepted' | 'resolved'
  lat: number
  lng: number
  priority?: 'high' | 'medium' | 'low'
  title?: string
  description?: string
  imageUrl?: string
  reporterPhone?: string
  responderId?: string
  createdAt?: Date
}
