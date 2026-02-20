-- Migration: Create password_reset_tokens table
-- This table stores secure password reset tokens with expiration

-- Create table for password reset tokens
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[password_reset_tokens]') AND type in (N'U'))
BEGIN
    CREATE TABLE password_reset_tokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Index for faster token lookup
    CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
    
    -- Index for cleanup of expired tokens
    CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);
    
    PRINT 'Table password_reset_tokens created successfully';
END
ELSE
BEGIN
    PRINT 'Table password_reset_tokens already exists';
END
GO

-- Cleanup procedure for expired tokens (optional - can be scheduled)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cleanup_expired_reset_tokens]') AND type in (N'P'))
    DROP PROCEDURE cleanup_expired_reset_tokens;
GO

CREATE PROCEDURE cleanup_expired_reset_tokens
AS
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < GETDATE() OR used = 1;
END
GO

PRINT 'Cleanup procedure created successfully';
