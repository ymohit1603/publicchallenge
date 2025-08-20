"use client"

import { Button } from "@/components/ui/button"
import { Plus, Trophy, Twitter } from "lucide-react"
import { useState } from "react"
import { CreateChallengeModal } from "./create-challenge-modal"

export function Navbar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleCreateChallenge = () => {
    setIsCreateModalOpen(true)
  }

  const handleSignIn = () => {
    // TODO: Implement Twitter sign-in
    console.log("[v0] Twitter sign-in clicked")
  }

  return (
    <>
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Public Challenge</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button onClick={handleCreateChallenge} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Challenge
              </Button>

              <Button variant="outline" onClick={handleSignIn} className="flex items-center gap-2 bg-transparent">
                <Twitter className="h-4 w-4" />
                Sign in with Twitter
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <CreateChallengeModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} userId={user?.id} />
    </>
  )
}
