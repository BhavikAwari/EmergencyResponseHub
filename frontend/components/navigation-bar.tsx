'use client'

import { motion } from 'framer-motion'
import { Home, AlertCircle, Map, History } from 'lucide-react'

type NavTab = 'home' | 'report' | 'map' | 'history'

interface NavigationBarProps {
  currentTab?: NavTab
  onTabChange?: (tab: NavTab) => void
  labels?: Partial<Record<NavTab, string>>
}

export function NavigationBar({ currentTab = 'home', onTabChange, labels = {} }: NavigationBarProps) {
  const navItems: Array<{ id: NavTab; icon: React.ReactNode; label: string }> = [
    { id: 'home', icon: <Home size={24} />, label: labels.home ?? 'Home' },
    { id: 'report', icon: <AlertCircle size={24} />, label: labels.report ?? 'Report' },
    { id: 'map', icon: <Map size={24} />, label: labels.map ?? 'Map' },
    { id: 'history', icon: <History size={24} />, label: labels.history ?? 'History' },
  ]

  const handleTabClick = (tab: NavTab) => {
    onTabChange?.(tab)
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl shadow-black/50"
    >
      <div className="w-full max-w-[480px] mx-auto px-0">
        <nav className="flex items-center justify-around pb-safe">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleTabClick(item.id)}
              className="relative flex flex-col items-center justify-center h-20 px-4 flex-1 group transition-all"
            >
              {/* Active indicator */}
              {currentTab === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent/50"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon with color transition */}
              <motion.div
                animate={{
                  color: currentTab === item.id ? 'rgb(239, 68, 68)' : 'rgb(156, 163, 175)',
                }}
                transition={{ duration: 0.2 }}
                className={currentTab === item.id ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}
              >
                {item.icon}
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{
                  scale: currentTab === item.id ? 1 : 0.9,
                  opacity: currentTab === item.id ? 1 : 0.6,
                }}
                transition={{ duration: 0.2 }}
                className="text-xs mt-1 font-medium"
              >
                {item.label}
              </motion.span>

              {/* Glow effect on active */}
              {currentTab === item.id && (
                <motion.div
                  layoutId="navGlow"
                  className="absolute inset-0 bg-accent/5 rounded-lg blur-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>
      </div>
    </motion.div>
  )
}
