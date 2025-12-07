-- Migration: Add role column to users table
-- Run this in SQL Server Management Studio 20 after database_setup.sql

USE StyleGenAI;
GO

-- Add role column (default 'user')
ALTER TABLE users ADD role NVARCHAR(20) DEFAULT 'user' NOT NULL;
GO

-- Optional: Set first user as admin (run this after creating your first account)
-- UPDATE users SET role = 'admin' WHERE id = 1;

PRINT 'Role column added successfully!';
PRINT 'To make a user admin, run: UPDATE users SET role = ''admin'' WHERE email = ''your-email@example.com'';';
