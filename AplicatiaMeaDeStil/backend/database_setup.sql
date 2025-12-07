-- StyleGenAI Database Setup Script
-- Run this in SQL Server Management Studio 20

-- Create database
CREATE DATABASE StyleGenAI;
GO

USE StyleGenAI;
GO

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Outfits table (istoric)
CREATE TABLE outfits (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    image_url NVARCHAR(500),
    style_data NVARCHAR(MAX), -- JSON cu detalii outfit
    liked BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- Index pentru performanță
CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfits_liked ON outfits(liked);
CREATE INDEX idx_outfits_created_at ON outfits(created_at DESC);
GO

-- Trigger pentru update timestamp
CREATE TRIGGER trg_users_update
ON users
AFTER UPDATE
AS
BEGIN
    UPDATE users
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

PRINT 'Database StyleGenAI created successfully!';
