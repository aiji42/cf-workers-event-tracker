-- CreateTable
CREATE TABLE "Visit" (
    "token" TEXT NOT NULL,
    "visitorToken" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "referrer" TEXT NOT NULL,
    "referringDomain" TEXT NOT NULL,
    "landingPage" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "utm_source" TEXT NOT NULL,
    "utm_medium" TEXT NOT NULL,
    "utm_term" TEXT NOT NULL,
    "utm_content" TEXT NOT NULL,
    "utm_campaign" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "os_version" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "visitToken" TEXT NOT NULL,
    "p1Key" TEXT NOT NULL,
    "p1Value" TEXT NOT NULL,
    "p2Key" TEXT NOT NULL,
    "p2Value" TEXT NOT NULL,
    "p3Key" TEXT NOT NULL,
    "p3Value" TEXT NOT NULL,
    "p4Key" TEXT NOT NULL,
    "p4Value" TEXT NOT NULL,
    "p5Key" TEXT NOT NULL,
    "p5Value" TEXT NOT NULL,
    "time" DATETIME NOT NULL,
    CONSTRAINT "Event_visitToken_fkey" FOREIGN KEY ("visitToken") REFERENCES "Visit" ("token") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Visit_token_key" ON "Visit"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Event_visitToken_key" ON "Event"("visitToken");
