-- Migration: Create AI Metrics Table
-- Description: Stores outfit generation metrics for admin analytics

USE StyleGenAI;
GO

-- Create ai_metrics table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ai_metrics')
BEGIN
    CREATE TABLE ai_metrics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        style NVARCHAR(50),
        season NVARCHAR(50),
        gender NVARCHAR(20),
        processing_time FLOAT NULL,
        success BIT NOT NULL DEFAULT 1,
        error_message NVARCHAR(500) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    PRINT 'ai_metrics table created successfully';
END
ELSE
BEGIN
    PRINT 'ai_metrics table already exists';
END
GO

-- Create index for faster queries
CREATE INDEX idx_ai_metrics_created_at ON ai_metrics(created_at);
CREATE INDEX idx_ai_metrics_style ON ai_metrics(style);
CREATE INDEX idx_ai_metrics_success ON ai_metrics(success);
GO

PRINT 'Migration completed successfully';
