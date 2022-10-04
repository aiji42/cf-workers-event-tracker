-- CreateTable
CREATE TABLE "Visit" (
    "visitToken" TEXT NOT NULL,
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
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitToken" TEXT NOT NULL,
    "visitorToken" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "time" DATETIME NOT NULL,
    CONSTRAINT "Event_visitToken_fkey" FOREIGN KEY ("visitToken") REFERENCES "Visit" ("visitToken") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Visit_visitToken_key" ON "Visit"("visitToken");
