"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getCreatorDetails, markTaskCompleted, trackProfileVisit } from "@/app/actions/challenges"
import { useState, useEffect, useCallback, useMemo } from "react"

import { Clock, Users, Target, CheckCircle, Circle, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/toast"
import { $Enums } from "@/lib/generated/prisma"



interface Creator {
  id: string
  name: string
  username: string
  avatar: string | null
}

export interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  creator: Creator | null
}

interface Task {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: Date | null
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string | null
  status: $Enums.ChallengeStatus
  startDate: Date
  endDate: Date | null
  duration: number
  durationUnit: string
  completedTasksCount: number
  totalTasksCount: number
  tasks: Task[]
}

interface CreatorDetails {
  id: string
  name: string
  username: string
  avatar: string | null
  profileVisitCount: number
  challenges: Challenge[]
}

// Detailed Countdown Timer Component with HH:MM:SS
const DetailedCountdownTimer = ({ challenge }: { challenge: any }) => {
  const [timeLeft, setTimeLeft] = useState("")
  const [isExpired, setIsExpired] = useState(false)

  const updateTimer = useCallback(() => {
    if (!challenge.endDate) {
      setTimeLeft("No end date")
      return
    }

    const now = new Date().getTime()
    const end = new Date(challenge.endDate).getTime()
    const distance = end - now

    if (distance < 0) {
      setTimeLeft("00:00:00")
      setIsExpired(true)
      return
    }

    setIsExpired(false)
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    // Format with leading zeros
    const formatTime = (time: number) => time.toString().padStart(2, '0')
    
    if (days > 0) {
      setTimeLeft(`${days}d ${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`)
    } else {
      setTimeLeft(`${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`)
    }
  }, [challenge.endDate])

  useEffect(() => {
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [updateTimer])

  const progressPercentage = useMemo(() => {
    if (!challenge.endDate || !challenge.startDate) return 0
    
    const now = new Date().getTime()
    const start = new Date(challenge.startDate).getTime()
    const end = new Date(challenge.endDate).getTime()
    const total = end - start
    const elapsed = now - start
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }, [challenge.startDate, challenge.endDate])

  return (
    <div className="text-center p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl border-2 border-blue-100">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Clock className="h-6 w-6 text-blue-600" />
        <span className="text-sm font-medium text-blue-600">
          {isExpired ? "Challenge Ended" : "Time Remaining"}
        </span>
      </div>
      
      <div className={`text-4xl font-bold font-mono tracking-wider mb-2 ${
        isExpired ? "text-red-500" : "text-blue-700"
      }`}>
        {timeLeft}
      </div>
      
      {!isExpired && (
        <div className="space-y-2">
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-blue-600">
            {Math.round(progressPercentage)}% of challenge time elapsed
          </div>
        </div>
      )}
      
      {isExpired && (
        <div className="text-xs text-red-500 mt-1">
          Challenge deadline has passed
        </div>
      )}
    </div>
  )
}

export function ProfileDrawer({ isOpen, onClose, creator }: ProfileDrawerProps) {
  const [creatorDetails, setCreatorDetails] = useState<CreatorDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch user once when component mounts
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setCurrentUser(data.user)
    }
    getUser()
  }, [])

  // Memoize the fetch function to prevent unnecessary re-fetching
  const fetchCreatorDetails = useCallback(async (creatorId: string) => {
    setLoading(true)
    try {
      const details = await getCreatorDetails(creatorId)
      setCreatorDetails(details)
    } catch (error) {
      console.error('Error fetching creator details:', error)
      setCreatorDetails(null)
    } finally {
      setLoading(false)
    }
    
    // Track profile visit completely asynchronously after loading is done
    setTimeout(() => {
      trackProfileVisit(creatorId, Math.random().toString(36).substring(7))
        .catch(error => console.error('Error tracking visit:', error))
    }, 0)
  }, [])

  // Fetch data when drawer opens with a creator
  useEffect(() => {
    if (isOpen && creator?.id) {
      fetchCreatorDetails(creator.id)
    } else if (!isOpen) {
      // Clear data when drawer closes to free memory
      setCreatorDetails(null)
    }
  }, [isOpen, creator?.id, fetchCreatorDetails])

  const handleTaskComplete = useCallback(async (taskId: string) => {
    if (!currentUser || !creatorDetails || creatorDetails.id !== currentUser.id) {
      toast({
        type: "warning",
        title: "Permission Denied",
        description: "You can only complete your own tasks"
      })
      return
    }

    setCompletingTask(taskId)
    
    // Optimistic update - update UI immediately
    const optimisticUpdate = () => {
      if (!creatorDetails) return
      
      const updatedChallenges = creatorDetails.challenges.map(challenge => {
        const updatedTasks = challenge.tasks.map(task => 
          task.id === taskId 
            ? { ...task, isCompleted: true, completedAt: new Date() }
            : task
        )
        
        const newCompletedCount = updatedTasks.filter(t => t.isCompleted).length
        const isAllCompleted = newCompletedCount >= challenge.totalTasksCount
        
        return {
          ...challenge,
          tasks: updatedTasks,
          completedTasksCount: newCompletedCount,
          status: isAllCompleted ? 'COMPLETED' as const : challenge.status
        }
      })
      
      setCreatorDetails({
        ...creatorDetails,
        challenges: updatedChallenges as Challenge[]
      })
    }

    try {
      // Apply optimistic update immediately
      optimisticUpdate()
      
      // Make the actual API call
      const result = await markTaskCompleted(taskId, currentUser.id)
      
      // If successful, the optimistic update was correct
      // If challenge was completed, we might want to refresh to get updated status
      if (result.allCompleted) {
        // Only refresh if challenge was completed to get final state
        const updated = await getCreatorDetails(creator!.id)
        setCreatorDetails(updated)
      }
    } catch (error) {
      console.error('Error completing task:', error)
      toast({
        type: "error",
        title: "Task Completion Failed",
        description: "Failed to complete task. Please try again."
      })
      
      // Revert optimistic update on error
      if (creator?.id) {
        const reverted = await getCreatorDetails(creator.id)
        setCreatorDetails(reverted)
      }
    } finally {
      setCompletingTask(null)
    }
  }, [currentUser, creatorDetails, creator?.id])

  // Memoize challenge categorization to avoid recalculation on every render
  const { ongoingChallenge, completedChallenges, failedChallenges } = useMemo(() => {
    if (!creatorDetails?.challenges) {
      return { ongoingChallenge: null, completedChallenges: [], failedChallenges: [] }
    }
    
    return {
      ongoingChallenge: creatorDetails.challenges.find(c => c.status === 'ONGOING') || null,
      completedChallenges: creatorDetails.challenges.filter(c => c.status === 'COMPLETED'),
      failedChallenges: creatorDetails.challenges.filter(c => c.status === 'FAILED'),
    }
  }, [creatorDetails?.challenges])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] sm:max-w-[50vw]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Profile
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="mt-6 space-y-6 animate-pulse">
            {/* Profile skeleton */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            
            {/* Challenge skeleton */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-40"></div>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : creatorDetails ? (
          <div className="mt-6 space-y-6 max-h-[calc(100vh-100px)] overflow-y-auto">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={creatorDetails.avatar || undefined} />
                <AvatarFallback>{creatorDetails.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{creatorDetails.name}</h3>
                <p className="text-sm text-muted-foreground">@{creatorDetails.username}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {creatorDetails.profileVisitCount} profile visitors
                  </span>
                </div>
              </div>
            </div>

            {/* Ongoing Challenge */}
            {ongoingChallenge && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Current Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{ongoingChallenge.title}</h4>
                    <p className="text-sm text-muted-foreground">{ongoingChallenge.description}</p>
                  </div>
                  
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {ongoingChallenge.completedTasksCount}/{ongoingChallenge.totalTasksCount} completed
                      </span>
                    </div>
                    <Progress 
                      value={(ongoingChallenge.completedTasksCount / ongoingChallenge.totalTasksCount) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Detailed Countdown Timer */}
                  <DetailedCountdownTimer challenge={ongoingChallenge} />

                  {/* Tasks */}
                  <div>
                    <h5 className="font-medium mb-3">Tasks</h5>
                    <div className="space-y-2">
                      {ongoingChallenge.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {task.isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className={task.isCompleted ? "line-through text-muted-foreground" : ""}>
                                {task.title}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 ml-7">{task.description}</p>
                            )}
                          </div>
                          {!task.isCompleted && currentUser && creatorDetails.id === currentUser.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTaskComplete(task.id)}
                              disabled={completingTask === task.id}
                            >
                              {completingTask === task.id ? "..." : "Complete"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Challenge History */}
            <div>
              <h4 className="text-sm font-medium mb-4">Challenge History</h4>
              <div className="space-y-3">
                {completedChallenges.map((challenge) => (
                  <Card key={challenge.id} className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{challenge.title}</h5>
                        <Badge className="bg-green-100 text-green-800">
                          COMPLETED
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Started {new Date(challenge.startDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{challenge.completedTasksCount}/{challenge.totalTasksCount} tasks completed</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {failedChallenges.map((challenge) => (
                  <Card key={challenge.id} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{challenge.title}</h5>
                        <Badge variant="destructive">
                          FAILED
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Started {new Date(challenge.startDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{challenge.completedTasksCount}/{challenge.totalTasksCount} tasks completed</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
