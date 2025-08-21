'use server'

import { prisma } from '@/lib/prisma'

export async function getTopChallenges() {
  try {
    const challenges = await prisma.challenge.findMany({
      take: 20, // Increase limit for better performance/UX balance
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        duration: true,
        durationUnit: true,
        status: true,
        startDate: true,
        endDate: true,
        completedTasksCount: true,
        totalTasksCount: true,
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      where: {
        // Only show challenges from last 30 days to improve performance
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: [
        { status: 'asc' }, // ONGOING first
        { createdAt: 'desc' }
      ],
    })

    return challenges
  } catch (error) {
    console.error('Error fetching challenges:', error)
    throw error
  }
}

export async function getOngoingChallenges() {
  try {
    const challenges = await prisma.challenge.findMany({
      take: 50, // Show more ongoing challenges since that's the main focus
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        duration: true,
        durationUnit: true,
        status: true,
        startDate: true,
        endDate: true,
        completedTasksCount: true,
        totalTasksCount: true,
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      where: {
        status: 'ONGOING', // Only show ongoing challenges
        // Optional: Only show challenges from last 60 days for ongoing ones
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: [
        { createdAt: 'desc' } // Most recent ongoing challenges first
      ],
    })

    return challenges
  } catch (error) {
    console.error('Error fetching ongoing challenges:', error)
    throw error
  }
}

// Optimized cache for creator details with intelligent invalidation
const creatorCache = new Map<string, { data: any; timestamp: number; version: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for faster updates
const MAX_CACHE_SIZE = 100 // Prevent memory leaks

export async function getCreatorDetails(creatorId: string) {
  try {
    // Check cache first
    const cached = creatorCache.get(creatorId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    // Clean up cache if it gets too large
    if (creatorCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = creatorCache.keys().next().value
      if (oldestKey) {
        creatorCache.delete(oldestKey)
      }
    }

    const user = await prisma.user.findUnique({
      where: {
        id: creatorId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        profileVisitCount: true,
        createdAt: true,
        challenges: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            status: true,
            startDate: true,
            endDate: true,
            duration: true,
            durationUnit: true,
            completedTasksCount: true,
            totalTasksCount: true,
            tasks: {
              select: {
                id: true,
                title: true,
                description: true,
                isCompleted: true,
                completedAt: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Limit to last 10 challenges for performance
        },
      },
    })

    // Cache the result with version for intelligent invalidation
    if (user) {
      creatorCache.set(creatorId, { 
        data: user, 
        timestamp: Date.now(),
        version: Date.now() // Use timestamp as version
      })
    }

    return user
  } catch (error) {
    console.error('Error fetching creator details:', error)
    throw error
  }
}

// Clear cache when user data is updated
function clearCreatorCache(creatorId: string) {
  creatorCache.delete(creatorId)
}

export async function trackProfileVisit(userId: string, visitorIp: string) {
  try {
    // Check if this IP has already visited this profile
    const existingVisit = await prisma.userProfileVisit.findUnique({
      where: {
        userId_visitorIp: {
          userId,
          visitorIp,
        },
      },
      select: { id: true } // Only select id for performance
    })

    if (!existingVisit) {
      // Use transaction for consistency
      await prisma.$transaction([
        prisma.userProfileVisit.create({
          data: {
            userId,
            visitorIp,
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            profileVisitCount: {
              increment: 1,
            },
          },
        })
      ])

      // Clear cache for updated user
      clearCreatorCache(userId)
    }

    return { success: true }
  } catch (error) {
    console.error('Error tracking profile visit:', error)
    // Don't throw error for visit tracking to avoid breaking user experience
    return { success: false }
  }
}

export async function markTaskCompleted(taskId: string, userId: string) {
  try {
    // First, get the task and verify ownership with minimal data
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        isCompleted: true,
        challenge: {
          select: {
            id: true,
            creatorId: true,
            totalTasksCount: true,
            completedTasksCount: true,
          },
        },
      },
    })

    if (!task) {
      throw new Error('Task not found')
    }

    if (task.challenge.creatorId !== userId) {
      throw new Error('Unauthorized: You can only complete your own tasks')
    }

    if (task.isCompleted) {
      throw new Error('Task is already completed')
    }

    const newCompletedCount = task.challenge.completedTasksCount + 1
    const allTasksCompleted = newCompletedCount >= task.challenge.totalTasksCount

    // Optimized transaction with parallel updates where possible
    const results = await prisma.$transaction(async (tx) => {
      // Mark task as completed
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
        select: {
          id: true,
          isCompleted: true,
          completedAt: true,
        }
      })

      // Update challenge completion metrics
      const updatedChallenge = await tx.challenge.update({
        where: { id: task.challenge.id },
        data: {
          completedTasksCount: newCompletedCount,
          ...(allTasksCompleted && {
            status: 'COMPLETED',
            endDate: new Date(),
          }),
        },
        select: {
          id: true,
          status: true,
          completedTasksCount: true,
          totalTasksCount: true,
        }
      })

      // Update user's ongoing challenge status if completed (in parallel if possible)
      const userUpdate = allTasksCompleted 
        ? tx.user.update({
            where: { id: userId },
            data: { hasOngoingChallenge: false },
            select: { id: true }
          })
        : Promise.resolve(null)

      return {
        task: updatedTask,
        challenge: updatedChallenge,
        user: await userUpdate
      }
    })

    // Clear cache for updated user (non-blocking)
    setImmediate(() => clearCreatorCache(userId))

    return { 
      success: true, 
      allCompleted: allTasksCompleted,
      task: results.task,
      challenge: results.challenge
    }
  } catch (error) {
    console.error('Error marking task completed:', error)
    throw error
  }
}

export async function checkAndUpdateChallengeStatus(challengeId: string) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        tasks: true,
      },
    })

    if (!challenge || challenge.status !== 'ONGOING') {
      return { success: true }
    }

    const now = new Date()
    const endDate = new Date(challenge.startDate.getTime() + (challenge.duration * 24 * 60 * 60 * 1000))

    // Check if challenge time has expired
    if (now > endDate) {
      const allTasksCompleted = challenge.completedTasksCount >= challenge.totalTasksCount

      await prisma.challenge.update({
        where: { id: challengeId },
        data: {
          status: allTasksCompleted ? 'COMPLETED' : 'FAILED',
          endDate: endDate,
        },
      })

      // Update user's ongoing challenge status
      await prisma.user.update({
        where: { id: challenge.creatorId },
        data: {
          hasOngoingChallenge: false,
        },
      })

      return { success: true, statusChanged: true, newStatus: allTasksCompleted ? 'COMPLETED' : 'FAILED' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error checking challenge status:', error)
    throw error
  }
}

interface CreateChallengeInput {
  title: string;
  description: string;
  duration: string;
  durationUnit: string;
  tasks: {
    title: string;
    description: string;
  }[];
  username: string;
}

export async function createChallenge(data: CreateChallengeInput) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: data.username,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has an ongoing challenge
    if (user.hasOngoingChallenge) {
      throw new Error('You already have an ongoing challenge. Complete or wait for it to finish before starting a new one.');
    }

    // Server-side validation for duration
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Invalid duration value');
    }

    // Validate duration limits (server-side security check)
    const maxLimits = {
      days: 365,    // Maximum 1 year
      weeks: 52,    // Maximum 1 year 
      months: 12    // Maximum 1 year
    };

    const maxAllowed = maxLimits[data.durationUnit as keyof typeof maxLimits];
    if (!maxAllowed || duration > maxAllowed) {
      throw new Error(`Duration exceeds maximum allowed limit of ${maxAllowed} ${data.durationUnit}`);
    }

    // Calculate end date based on duration and unit
    const startDate = new Date();
    let endDate: Date;

    switch (data.durationUnit) {
      case 'days':
        endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));
        break;
      case 'weeks':
        endDate = new Date(startDate.getTime() + (duration * 7 * 24 * 60 * 60 * 1000));
        break;
      case 'months':
        // Handle months more precisely
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        break;
      default:
        // Default to days if unit is not recognized
        endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));
    }

    const challenge = await prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        duration: duration,
        durationUnit: data.durationUnit,
        creatorId: user.id,
        startDate: startDate,
        endDate: endDate,
        totalTasksCount: data.tasks.length,
        tasks: {
          create: data.tasks.map(task => ({
            title: task.title,
            description: task.description || null,
          })),
        },
      },
      include: {
        tasks: true,
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    // Update user's ongoing challenge status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hasOngoingChallenge: true,
      },
    });

    // Clear cache for updated user
    clearCreatorCache(user.id)

    return challenge;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
}
