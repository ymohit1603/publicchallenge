"use client"

import dynamic from 'next/dynamic'
import { ProfileDrawerProps } from './profile-drawer'

// Lazy load the ProfileDrawer component
const ProfileDrawer = dynamic(() => import('./profile-drawer').then(mod => ({ default: mod.ProfileDrawer })), {
  loading: () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
      </div>
    </div>
  ),
  ssr: false // Disable SSR for this component to improve initial page load
})

export function LazyProfileDrawer(props: ProfileDrawerProps) {
  if (!props.isOpen) {
    return null // Don't load the component until it's actually needed
  }
  
  return <ProfileDrawer {...props} />
}
