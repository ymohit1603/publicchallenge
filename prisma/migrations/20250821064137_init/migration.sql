-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "profileVisitCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."UserProfileVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitorIp" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfileVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserProfileVisit_userId_idx" ON "public"."UserProfileVisit"("userId");

-- CreateIndex
CREATE INDEX "UserProfileVisit_visitorIp_idx" ON "public"."UserProfileVisit"("visitorIp");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileVisit_userId_visitorIp_key" ON "public"."UserProfileVisit"("userId", "visitorIp");

-- AddForeignKey
ALTER TABLE "public"."UserProfileVisit" ADD CONSTRAINT "UserProfileVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
