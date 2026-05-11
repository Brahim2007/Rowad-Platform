-- CreateIndex
CREATE INDEX "activities_programId_isActive_sortOrder_idx" ON "activities"("programId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "beneficiaries_firstName_lastName_idx" ON "beneficiaries"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "beneficiaries_status_registeredAt_idx" ON "beneficiaries"("status", "registeredAt");

-- CreateIndex
CREATE INDEX "partners_isActive_sortOrder_idx" ON "partners"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "platforms_isActive_sortOrder_idx" ON "platforms"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "programs_platformId_isActive_sortOrder_idx" ON "programs"("platformId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "projects_status_sortOrder_idx" ON "projects"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "projects_isFeatured_sortOrder_idx" ON "projects"("isFeatured", "sortOrder");
