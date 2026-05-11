-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "visitorId" VARCHAR(100),
    "ipAddress" VARCHAR(50),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "region" VARCHAR(100),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deviceType" VARCHAR(50),
    "browser" VARCHAR(100),
    "os" VARCHAR(100),
    "referrer" VARCHAR(1000),
    "userAgent" TEXT,
    "screenSize" VARCHAR(30),
    "language" VARCHAR(20),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visits_timestamp_idx" ON "visits"("timestamp");

-- CreateIndex
CREATE INDEX "visits_path_idx" ON "visits"("path");

-- CreateIndex
CREATE INDEX "visits_country_idx" ON "visits"("country");

-- CreateIndex
CREATE INDEX "visits_visitorId_idx" ON "visits"("visitorId");
