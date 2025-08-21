"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Target } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { LazyProfileDrawer } from "./lazy-profile-drawer"
import { Progress } from "@/components/ui/progress"
import { getOngoingChallenges } from "@/app/actions/challenges"
import { $Enums } from "@prisma/client"





interface Creator {
  id: string
  name: string
  username: string
  avatar: string | null
}


interface Challenge {
  id: string
  title: string
  description: string
  category: string | null
  duration: number
  durationUnit: string
  status: $Enums.ChallengeStatus
  startDate: Date
  endDate: Date | null
  creator: Creator
}

// Memoized countdown timer component
const CountdownTimer = ({ endDate }: { endDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState("")

  const updateTimer = useCallback(() => {
    const now = new Date().getTime()
    const end = new Date(endDate).getTime()
    const distance = end - now

    if (distance < 0) {
      setTimeLeft("Ended")
      return
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      setTimeLeft(`${days}d ${hours}h`)
    } else if (hours > 0) {
      setTimeLeft(`${hours}h ${minutes}m`)
    } else {
      setTimeLeft(`${minutes}m`)
    }
  }, [endDate])

  useEffect(() => {
    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute instead of 30 seconds
    return () => clearInterval(interval)
  }, [updateTimer])

  return (
    <div className="flex items-center gap-1 text-sm">
      <Clock className="h-4 w-4" />
      <span className="font-medium">{timeLeft}</span>
    </div>
  )
}

export function Leaderboard() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChallenges = useCallback(async () => {
    try {
      setError(null)
      const data = await getOngoingChallenges()
      setChallenges(data)
    } catch (error) {
      console.error('Error fetching ongoing challenges:', error)
      setError('Failed to load ongoing challenges. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  const handleRowClick = useCallback((challenge: Challenge) => {
    setSelectedCreator(challenge.creator)
    setIsDrawerOpen(true)
  }, [])

  // Preload creator details on hover for faster loading
  const handleRowHover = useCallback((challenge: Challenge) => {
    // Preload data on hover to make clicking feel instant
    import("@/app/actions/challenges").then(module => {
      module.getCreatorDetails(challenge.creator.id).catch(() => {
        // Silently fail if preload fails
      })
    })
  }, [])

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedCreator(null)
  }, [])

  // Memoize challenge calculations to avoid re-computing on every render
  const processedChallenges = useMemo(() => {
    return challenges.map((challenge) => {
      const now = new Date().getTime()
      const endTime = challenge.endDate ? new Date(challenge.endDate).getTime() : 0
      const startTime = new Date(challenge.startDate).getTime()
      const totalDuration = endTime - startTime
      const elapsed = now - startTime
      
      const progressPercentage = challenge.status === 'ONGOING' && totalDuration > 0
        ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
        : challenge.status === 'COMPLETED' ? 100 : 0

      return {
        ...challenge,
        progressPercentage
      }
    })
  }, [challenges])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading ongoing challenges...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-red-500">❌ {error}</div>
          <button 
            onClick={fetchChallenges}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (processedChallenges.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground text-lg">No ongoing challenges found</div>
          <p className="text-sm text-muted-foreground">Be the first to start an active challenge!</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with ongoing badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold">Active Challenges</span>
            </div>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              {processedChallenges.length} ongoing
            </Badge>
          </div>
        </div>
        
        {processedChallenges.map((challenge) => {
          return (
          <Card
            key={challenge.id}
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleRowClick(challenge)}
            onMouseEnter={() => handleRowHover(challenge)}
          >
              <div className="flex items-center justify-between">
                {/* Left side - Challenge info */}
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={challenge.creator.avatar || undefined} />
                    <AvatarFallback>
                      {challenge.creator.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{challenge.title}</h3>
                      {challenge.category && (
                        <Badge variant={challenge.status === 'ONGOING' ? "default" : "secondary"}>
                          {challenge.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{challenge.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>by {challenge.creator.username}</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{challenge.duration} {challenge.durationUnit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Progress and timer */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">
                        LIVE
                      </span>
                    </div>
                    <Progress value={challenge.progressPercentage} className="w-24" />
                  </div>

                  <div className="text-right min-w-[80px]">
                    {challenge.endDate && <CountdownTimer endDate={challenge.endDate} />}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <LazyProfileDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        creator={selectedCreator}
      />
    </>
  )
}