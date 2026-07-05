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

-- Outfit feedback table
CREATE TABLE outfit_feedback (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    is_liked BIT NOT NULL,
    style NVARCHAR(50),
    season NVARCHAR(50),
    gender NVARCHAR(50),
    top_category NVARCHAR(120),
    bottom_category NVARCHAR(120),
    shoes_category NVARCHAR(120),
    top_color NVARCHAR(80),
    bottom_color NVARCHAR(80),
    shoes_color NVARCHAR(80),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_outfit_feedback_user_created_at ON outfit_feedback(user_id, created_at DESC);
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
