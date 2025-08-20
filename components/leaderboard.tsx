"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Target } from "lucide-react"
import { useState, useEffect } from "react"
import { ProfileDrawer } from "./profile-drawer"
import { supabase } from "@/lib/supabase"
import { Progress } from "@/components/ui/progress"

interface Creator {
  id: string
  name: string | null
  username: string | null
  avatarUrl: string | null
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  visitorCount: number
  totalTasksCount: number
  completedTasksCount: number
  endDate: string | null
  status: 'ONGOING' | 'COMPLETED' | 'FAILED'
  creator: Creator
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const updateTimer = () => {
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
    }

    updateTimer()
    const interval = setInterval(updateTimer, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [endDate])

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
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      const { data: challengesData, error } = await supabase
        .from('Challenge')
        .select(`
          id,
          title,
          description,
          category,
          visitorCount,
          totalTasksCount,
          completedTasksCount,
          endDate,
          status,
          creator: creatorId (
            id,
            name,
            username,
            avatarUrl
          )
        `)
        .order('visitorCount', { ascending: false })
        .limit(10)

      if (error) throw error
      setChallenges(challengesData as Challenge[])
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setIsDrawerOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {challenges.map((challenge) => {
          const progressPercentage = (challenge.completedTasksCount / challenge.totalTasksCount) * 100

          return (
            <Card
              key={challenge.id}
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRowClick(challenge)}
            >
              <div className="flex items-center justify-between">
                {/* Left side - Challenge info */}
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={challenge.creator.avatarUrl || undefined} />
                    <AvatarFallback>
                      {(challenge.creator.name || challenge.creator.username || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{challenge.title}</h3>
                      <Badge variant={challenge.status === 'ONGOING' ? "default" : "secondary"}>
                        {challenge.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{challenge.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>by {challenge.creator.username || challenge.creator.name}</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{challenge.visitorCount} visitors</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Progress and timer */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {challenge.completedTasksCount}/{challenge.totalTasksCount} tasks
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="w-24" />
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

      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        creator={selectedChallenge?.creator || null}
      />
    </>
  )
}
