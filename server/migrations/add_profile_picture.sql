-- Migration: Add profile picture support
-- Add profile_picture column to users table for signup profile pictures
ALTER TABLE users ADD COLUMN profile_picture TEXT DEFAULT NULL;

-- Add profile_picture column to persons table for family member profile pictures
ALTER TABLE persons ADD COLUMN profile_picture TEXT DEFAULT NULL;