import { Navbar } from "@/components/navbar"
import { Leaderboard } from "@/components/leaderboard"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Public Challenges</h1>
            <p className="text-muted-foreground text-lg">Join challenges, track progress, and compete with others</p>
          </div>
          <Leaderboard />
        </div>
      </main>
    </div>
  )
}
