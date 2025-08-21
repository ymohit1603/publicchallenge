-- CreateIndex
CREATE INDEX "Challenge_createdAt_idx" ON "public"."Challenge"("createdAt");

-- CreateIndex
CREATE INDEX "Challenge_status_createdAt_idx" ON "public"."Challenge"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Challenge_creatorId_status_idx" ON "public"."Challenge"("creatorId", "status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_hasOngoingChallenge_idx" ON "public"."User"("hasOngoingChallenge");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");
