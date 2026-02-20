"""
ai_metrics.py - AI Generation Metrics Logging
Tracks outfit generation events for admin analytics
"""
import os
from typing import Optional
from database import execute_query, execute_query_one


def log_generation(
    user_id: Optional[int],
    style: str,
    season: str,
    gender: str,
    processing_time: Optional[float],
    success: bool,
    error_message: Optional[str] = None
) -> bool:
    """
    Log an outfit generation event to the database.
    
    Args:
        user_id: The ID of the user who generated the outfit (None for anonymous)
        style: The style requested (e.g., 'casual', 'elegant', 'sport')
        season: The season selected (e.g., 'summer', 'winter')
        gender: The gender category (e.g., 'men', 'women')
        processing_time: Time taken in seconds (None if error occurred early)
        success: Whether the generation was successful
        error_message: Error details if success is False
    
    Returns:
        bool: True if logging succeeded, False otherwise
    """
    try:
        query = """
            INSERT INTO ai_metrics (user_id, style, season, gender, processing_time, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        execute_query(query, (user_id, style, season, gender, processing_time, success, error_message))
        return True
    except Exception as e:
        print(f"Error logging AI metrics: {e}")
        return False


def get_generation_statistics() -> dict:
    """
    Retrieve aggregated AI generation statistics.
    
    Returns:
        dict: Statistics including total generations, success rate, avg processing time
    """
    try:
        # Total generations and success rate
        stats_query = """
            SELECT 
                COUNT(*) as total_generations,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_generations,
                AVG(CASE WHEN success = 1 THEN processing_time ELSE NULL END) as avg_processing_time
            FROM ai_metrics
        """
        stats = execute_query_one(stats_query)
        
        total = stats['total_generations'] or 0
        successful = stats['successful_generations'] or 0
        success_rate = (successful / total * 100) if total > 0 else 0
        
        return {
            'total_generations': total,
            'successful_generations': successful,
            'failed_generations': total - successful,
            'success_rate': round(success_rate, 2),
            'avg_processing_time': round(stats['avg_processing_time'], 2) if stats['avg_processing_time'] else 0
        }
    except Exception as e:
        print(f"Error getting generation statistics: {e}")
        return {
            'total_generations': 0,
            'successful_generations': 0,
            'failed_generations': 0,
            'success_rate': 0,
            'avg_processing_time': 0
        }


def get_style_popularity() -> list:
    """
    Get style distribution showing which styles are most popular.
    
    Returns:
        list: Array of {style, count, percentage} objects
    """
    try:
        query = """
            SELECT 
                style,
                COUNT(*) as count,
                CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ai_metrics) AS DECIMAL(5,2)) as percentage
            FROM ai_metrics
            WHERE success = 1
            GROUP BY style
            ORDER BY count DESC
        """
        results = execute_query(query)
        return [dict(row) for row in results]
    except Exception as e:
        print(f"Error getting style popularity: {e}")
        return []


def get_generation_timeline(days: int = 7) -> list:
    """
    Get generation activity over time (last N days).
    
    Args:
        days: Number of days to look back
    
    Returns:
        list: Array of {date, total, successful, failed} objects
    """
    try:
        db_type = os.getenv('DB_TYPE', 'mssql').lower()
        
        if db_type == 'sqlite':
            query = """
                SELECT 
                    date(created_at) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
                FROM ai_metrics
                WHERE created_at >= date('now', '-' || ? || ' days')
                GROUP BY date(created_at)
                ORDER BY date ASC
            """
        else:
            query = """
                SELECT 
                    CAST(created_at AS DATE) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
                FROM ai_metrics
                WHERE created_at >= DATEADD(day, -?, GETDATE())
                GROUP BY CAST(created_at AS DATE)
                ORDER BY date ASC
            """
        results = execute_query(query, (days,))
        return [{
            'date': row['date'].strftime('%Y-%m-%d'),
            'total': row['total'],
            'successful': row['successful'],
            'failed': row['failed']
        } for row in results]
    except Exception as e:
        print(f"Error getting generation timeline: {e}")
        return []


import os

def get_common_errors(limit: int = 5) -> list:
    """
    Get most common error messages.
    
    Args:
        limit: Maximum number of errors to return
    
    Returns:
        list: Array of {error_message, count} objects
    """
    try:
        db_type = os.getenv('DB_TYPE', 'mssql').lower()
        if db_type == 'sqlite':
            query = """
                SELECT 
                    error_message,
                    COUNT(*) as count
                FROM ai_metrics
                WHERE success = 0 AND error_message IS NOT NULL
                GROUP BY error_message
                ORDER BY count DESC
                LIMIT ?
            """
        else:
            query = """
                SELECT TOP (?) 
                    error_message,
                    COUNT(*) as count
                FROM ai_metrics
                WHERE success = 0 AND error_message IS NOT NULL
                GROUP BY error_message
                ORDER BY count DESC
            """
        results = execute_query(query, (limit,))
        return [dict(row) for row in results]
    except Exception as e:
        print(f"Error getting common errors: {e}")
        return []
