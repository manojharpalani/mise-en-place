-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PLANNER';

-- CreateTable
CREATE TABLE "PlannerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "cuisinePrefs" TEXT[],
    "householdSize" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerMenuItem" (
    "id" SERIAL NOT NULL,
    "plannerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "photoUrl" TEXT,
    "cuisineTags" TEXT[],
    "dietaryTags" TEXT[],
    "ingredients" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerWeeklyMenu" (
    "id" TEXT NOT NULL,
    "plannerId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "flyerImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerWeeklyMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerWeeklyMenuDay" (
    "id" TEXT NOT NULL,
    "weeklyMenuId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,

    CONSTRAINT "PlannerWeeklyMenuDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerWeeklyMenuDayItem" (
    "id" TEXT NOT NULL,
    "weeklyMenuDayId" TEXT NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PlannerWeeklyMenuDayItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerSubscriber" (
    "id" TEXT NOT NULL,
    "plannerId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "PlannerSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlannerProfile_userId_key" ON "PlannerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerProfile_slug_key" ON "PlannerProfile"("slug");

-- AddForeignKey
ALTER TABLE "PlannerProfile" ADD CONSTRAINT "PlannerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerMenuItem" ADD CONSTRAINT "PlannerMenuItem_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "PlannerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerWeeklyMenu" ADD CONSTRAINT "PlannerWeeklyMenu_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "PlannerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerWeeklyMenuDay" ADD CONSTRAINT "PlannerWeeklyMenuDay_weeklyMenuId_fkey" FOREIGN KEY ("weeklyMenuId") REFERENCES "PlannerWeeklyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerWeeklyMenuDayItem" ADD CONSTRAINT "PlannerWeeklyMenuDayItem_weeklyMenuDayId_fkey" FOREIGN KEY ("weeklyMenuDayId") REFERENCES "PlannerWeeklyMenuDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerWeeklyMenuDayItem" ADD CONSTRAINT "PlannerWeeklyMenuDayItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "PlannerMenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerSubscriber" ADD CONSTRAINT "PlannerSubscriber_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "PlannerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerSubscriber" ADD CONSTRAINT "PlannerSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
