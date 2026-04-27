'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Building2 } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

type Role = 'user' | 'volunteer' | 'authority'

interface RoleSwitcherProps {
  onRoleChange?: (role: Role) => void
}

export function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const [role, setRole] = useState<Role>('user')
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleToggle = (newRole: Role) => {
    setRole(newRole)
    onRoleChange?.(newRole)
  }

  const handleAuthorityAccess = async () => {
    if (accessCode !== 'CRISIS2026') {
      alert('Invalid Access Code')
      return
    }

    setIsVerifying(true)
    try {
      const userId = auth.currentUser?.uid ?? 'anonymous'
      await setDoc(
        doc(db, 'userRoles', userId),
        {
          role: 'authority',
          updatedAt: new Date(),
        },
        { merge: true }
      )
      handleToggle('authority')
      setIsAccessModalOpen(false)
      setAccessCode('')
    } catch (error) {
      console.error('Failed to save authority role:', error)
      alert('Could not unlock Authority Command Center. Try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 py-3"
      >
        <div className="mx-auto flex w-full max-w-md justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 p-1 backdrop-blur-sm">
          {/* User Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleToggle('user')}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 font-medium transition-all duration-300 min-h-[44px] ${
              role === 'user'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <User size={14} />
            <span className="text-xs">User</span>
          </motion.button>

          {/* Volunteer Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleToggle('volunteer')}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 font-medium transition-all duration-300 min-h-[44px] ${
              role === 'volunteer'
                ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/40'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <Shield size={14} />
            <span className="text-xs">Volunteer</span>
          </motion.button>

          {/* Official Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAccessModalOpen(true)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 font-medium transition-all duration-300 min-h-[44px] ${
              role === 'authority'
                ? 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/40'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <Building2 size={14} />
            <span className="text-xs">Official</span>
          </motion.button>
        </div>
      </motion.div>

      {isAccessModalOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 p-4 flex items-end sm:items-center justify-center"
          onClick={() => setIsAccessModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 space-y-3"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground">Official Access</h3>
            <p className="text-sm text-muted-foreground">Enter Access Code to unlock Authority Command Center.</p>
            <input
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-border bg-background/40 px-3 text-sm"
              placeholder="Access Code"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="min-h-[44px] rounded-xl border border-border text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleAuthorityAccess()}
                disabled={isVerifying}
                className="min-h-[44px] rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60"
              >
                {isVerifying ? 'Verifying...' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
