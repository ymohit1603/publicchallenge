"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/toast"
import { createChallenge } from "@/app/actions/challenges"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Calendar, Target } from "lucide-react"

interface CreateChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string | null
}

interface Task {
  id: string
  title: string
  description: string
}

export function CreateChallengeModal({ isOpen, onClose, userId }: CreateChallengeModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    // category: "",
    duration: "",
    durationUnit: "days",
  })

  const [tasks, setTasks] = useState<Task[]>([{ id: "1", title: "", description: "" }])
  const [user, setUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()
  }, [isOpen])

  const categories = ["Fitness", "Education", "Wellness", "Language", "Productivity", "Creative", "Social", "Health"]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: "",
      description: "",
    }
    setTasks((prev) => [...prev, newTask])
  }

  const removeTask = (taskId: string) => {
    if (tasks.length > 1) {
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    }
  }

  const updateTask = (taskId: string, field: string, value: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        type: "warning",
        title: "Authentication Required",
        description: "Please sign in to create a challenge"
      })
      return
    }

    // Basic validation
    if (!formData.title || !formData.description || !formData.duration) {
      toast({
        type: "error",
        title: "Missing Information",
        description: "Please fill in all required fields"
      })
      return
    }

    // Duration validation
    const durationValue = parseInt(formData.duration)
    if (isNaN(durationValue) || durationValue <= 0) {
      toast({
        type: "error",
        title: "Invalid Duration",
        description: "Please enter a valid positive number for duration"
      })
      return
    }

    // Duration limits based on unit
    const maxLimits = {
      days: 365,    // Maximum 1 year
      weeks: 52,    // Maximum 1 year 
      months: 12    // Maximum 1 year
    }

    const currentMax = maxLimits[formData.durationUnit as keyof typeof maxLimits]
    if (durationValue > currentMax) {
      toast({
        type: "error",
        title: "Duration Too Long",
        description: `Maximum allowed is ${currentMax} ${formData.durationUnit}. Please choose a shorter duration.`
      })
      return
    }

    const validTasks = tasks.filter((task) => task.title.trim() !== "")
    if (validTasks.length === 0) {
      toast({
        type: "error",
        title: "No Tasks Added",
        description: "Please add at least one task to your challenge"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const challengeData = {
        ...formData,
        tasks: validTasks.map(({ title, description }) => ({ title, description })),
        username: user.user_metadata?.user_name || user.email?.split('@')[0] || "user",
      }

      await createChallenge(challengeData)
      toast({
        type: "success",
        title: "Challenge Created!",
        description: "Your challenge has been created successfully and is now live."
      })

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        duration: "",
        durationUnit: "days",
      })
      setTasks([{ id: "1", title: "", description: "" }])
      onClose()
    } catch (error) {
      console.error("Error creating challenge:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create challenge. Please try again."
      toast({
        type: "error",
        title: "Creation Failed",
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: "",
      description: "",
      // category: "",
      duration: "",
      durationUnit: "days",
    })
    setTasks([{ id: "1", title: "", description: "" }])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Challenge
          </DialogTitle>
          <DialogDescription>
            Create a public challenge that others can join and track their progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title *</Label>
              <Input
                id="title"
                placeholder="e.g., 30-Day Fitness Challenge"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what visitors will achieve..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {/* <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger> */}
                {/* <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent> */}
                {/* </Select> */}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Enter number (e.g., 7 for 7 days)"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    min="1"
                    max={
                      formData.durationUnit === 'days' ? 365 :
                      formData.durationUnit === 'weeks' ? 52 : 12
                    }
                    required
                    className="flex-1"
                  />
                  <Select
                    value={formData.durationUnit}
                    onValueChange={(value) => handleInputChange("durationUnit", value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum: 365 days, 52 weeks, or 12 months (1 year limit)
                </p>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Challenge Tasks
                </span>
                <Button type="button" variant="outline" size="sm" onClick={addTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task, index) => (
                <div key={task.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Task {index + 1}</Label>
                    {tasks.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeTask(task.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Task title (e.g., Day 1: Morning workout)"
                      value={task.title}
                      onChange={(e) => updateTask(task.id, "title", e.target.value)}
                    />
                    <Input
                      placeholder="Task description (optional)"
                      value={task.description}
                      onChange={(e) => updateTask(task.id, "description", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <p className="text-sm text-muted-foreground">
                Add daily or milestone tasks that you need to complete. Duration will be calculated based on the number and unit you choose above.
              </p>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Challenge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
