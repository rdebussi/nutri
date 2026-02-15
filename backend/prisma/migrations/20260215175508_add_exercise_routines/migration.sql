-- CreateEnum
CREATE TYPE "Intensity" AS ENUM ('LIGHT', 'MODERATE', 'INTENSE');

-- CreateTable
CREATE TABLE "exercise_routines" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "exercise_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "met" DOUBLE PRECISION NOT NULL,
    "days_per_week" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "intensity" "Intensity" NOT NULL DEFAULT 'MODERATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_routines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exercise_routines" ADD CONSTRAINT "exercise_routines_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "nutrition_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
