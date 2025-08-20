"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Clock, Users, Target, Calendar, Trophy } from "lucide-react"

interface Challenge {
  id: number
  title: string
  description: string
  creator: {
    name: string
    avatar: string
    username: string
  }
  visitors: number
  totalTasks: number
  completedTasks: number
  endDate: Date
  category: string
  isActive: boolean
}

interface Task {
  id: number
  title: string
  description: string
  completed: boolean
  completedDate: Date | null
}

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  challenge: Challenge | null
}

function EnhancedCountdownTimer({ endDate, isActive }: { endDate: Date; isActive: boolean }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  })

  useEffect(() => {
    if (!isActive) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = endDate.getTime() - now

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, total: distance })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000) // Update every second

    return () => clearInterval(interval)
  }, [endDate, isActive])

  if (!isActive) {
    return (
      <div className="text-center">
        <div className="text-sm font-medium text-muted-foreground">Challenge Completed</div>
      </div>
    )
  }

  if (timeLeft.total <= 0) {
    return (
      <div className="text-center">
        <div className="text-sm font-medium text-destructive">Time's Up!</div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-2">
      <div className="text-xs text-muted-foreground">Time Remaining</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-muted rounded p-2">
          <div className="text-lg font-bold">{timeLeft.days}</div>
          <div className="text-xs text-muted-foreground">Days</div>
        </div>
        <div className="bg-muted rounded p-2">
          <div className="text-lg font-bold">{timeLeft.hours}</div>
          <div className="text-xs text-muted-foreground">Hours</div>
        </div>
        <div className="bg-muted rounded p-2">
          <div className="text-lg font-bold">{timeLeft.minutes}</div>
          <div className="text-xs text-muted-foreground">Min</div>
        </div>
        <div className="bg-muted rounded p-2">
          <div className="text-lg font-bold">{timeLeft.seconds}</div>
          <div className="text-xs text-muted-foreground">Sec</div>
        </div>
      </div>
    </div>
  )
}

// Mock task data for the selected challenge
const getMockTasks = (challengeId: number, totalTasks: number, completedTasks: number): Task[] => {
  const tasks: Task[] = []

  for (let i = 1; i <= totalTasks; i++) {
    tasks.push({
      id: i,
      title: `Day ${i} Task`,
      description: getTaskDescription(challengeId, i),
      completed: i <= completedTasks,
      completedDate: i <= completedTasks ? new Date(Date.now() - (totalTasks - i) * 24 * 60 * 60 * 1000) : null,
    })
  }

  return tasks
}

const getTaskDescription = (challengeId: number, day: number) => {
  const descriptions = {
    1: [
      // Fitness Challenge
      "20 push-ups and 30-second plank",
      "15-minute morning jog",
      "Full body stretching routine",
      "30 squats and 20 lunges",
      "Core workout - 3 sets",
    ],
    2: [
      // Reading Challenge
      "Read Chapter 1-3 of current book",
      "Complete book summary notes",
      "Read for 45 minutes",
      "Finish current book",
      "Start new book selection",
    ],
    3: [
      // Meditation Challenge
      "10-minute morning meditation",
      "Breathing exercises",
      "Mindfulness practice",
      "Evening reflection",
      "Gratitude meditation",
    ],
    4: [
      // Spanish Challenge
      "Learn 10 new vocabulary words",
      "Practice verb conjugations",
      "Complete grammar exercises",
      "Listen to Spanish podcast",
      "Practice conversation",
    ],
  }

  const taskList = descriptions[challengeId as keyof typeof descriptions] || descriptions[1]
  return taskList[(day - 1) % taskList.length]
}

export function ProfileDrawer({ isOpen, onClose, challenge }: ProfileDrawerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    if (challenge) {
      const initialTasks = getMockTasks(challenge.id, challenge.totalTasks, challenge.completedTasks)
      setTasks(initialTasks)
      setCompletedCount(challenge.completedTasks)
    }
  }, [challenge])

  const handleTaskToggle = (taskId: number) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) => {
        if (task.id === taskId) {
          const newCompleted = !task.completed
          return {
            ...task,
            completed: newCompleted,
            completedDate: newCompleted ? new Date() : null,
          }
        }
        return task
      })

      // Update completed count
      const newCompletedCount = updatedTasks.filter((task) => task.completed).length
      setCompletedCount(newCompletedCount)

      console.log(
        `[v0] Task ${taskId} ${updatedTasks.find((t) => t.id === taskId)?.completed ? "completed" : "uncompleted"}`,
      )

      return updatedTasks
    })
  }

  if (!challenge) return null

  const progressPercentage = (completedCount / challenge.totalTasks) * 100
  const daysLeft = Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={challenge.creator.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {challenge.creator.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left">{challenge.creator.name}</SheetTitle>
              <SheetDescription className="text-left">{challenge.creator.username}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Challenge Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {challenge.title}
                </CardTitle>
                <Badge variant={challenge.isActive ? "default" : "secondary"}>{challenge.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{challenge.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{challenge.visitors} visitors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{challenge.isActive ? `${daysLeft} days left` : "Completed"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Progress
                  </span>
                  <span className="font-medium">
                    {completedCount}/{challenge.totalTasks} tasks
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">{progressPercentage.toFixed(0)}% complete</p>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Challenge Timer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedCountdownTimer endDate={challenge.endDate} isActive={challenge.isActive} />
            </CardContent>
          </Card>

          {/* Interactive Task List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Task Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${task.completed
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                      : "bg-background border-border hover:bg-muted/50"
                      }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto hover:bg-transparent"
                      onClick={() => handleTaskToggle(task.id)}
                    >
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-green-600 transition-colors" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-medium text-sm transition-all duration-200 ${task.completed ? "text-muted-foreground line-through" : "text-foreground"
                          }`}
                      >
                        {task.title}
                      </h4>
                      <p
                        className={`text-xs mt-1 ${task.completed ? "text-muted-foreground" : "text-muted-foreground"}`}
                      >
                        {task.description}
                      </p>
                      {task.completed && task.completedDate && (
                        <p className="text-xs text-green-600 mt-1 animate-in fade-in duration-200">
                          Completed {task.completedDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Challenge Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600">{challenge.totalTasks - completedCount}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-purple-600">{progressPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
