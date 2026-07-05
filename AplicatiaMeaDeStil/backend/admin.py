"""
Admin module - handles admin dashboard statistics and user management
"""
import os
from datetime import datetime, timedelta
from database import execute_query, execute_query_one


def _to_iso(value):
    if value is None:
        return None
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return str(value)


def get_dashboard_stats() -> dict:
    """
    Get comprehensive dashboard statistics
    
    Returns:
        dict: Dashboard statistics including users, outfits, and AI metrics
    """
    stats = {}
    db_type = os.getenv('DB_TYPE', 'mssql').lower()

    def _pick(sqlite_query: str, mssql_query: str) -> str:
        return sqlite_query if db_type == 'sqlite' else mssql_query

    def _count(query: str, params=None) -> int:
        result = execute_query_one(query, params)
        return result[0] if result else 0

    synthetic_pattern = 'feedback.user.%@example.com'

    stats['total_users'] = _count(
        "SELECT COUNT(*) FROM users WHERE email NOT LIKE ?",
        (synthetic_pattern,),
    )
    stats['new_users_today'] = _count(_pick(
        """
            SELECT COUNT(*) FROM users
            WHERE date(created_at) = date('now')
              AND email NOT LIKE ?
        """,
        """
            SELECT COUNT(*) FROM users
            WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
              AND email NOT LIKE ?
        """
    ), (synthetic_pattern,))
    stats['new_users_week'] = _count(_pick(
        """
            SELECT COUNT(*) FROM users
            WHERE created_at >= datetime('now', '-7 days')
              AND email NOT LIKE ?
        """,
        """
            SELECT COUNT(*) FROM users
            WHERE created_at >= DATEADD(day, -7, GETDATE())
              AND email NOT LIKE ?
        """
    ), (synthetic_pattern,))

    stats['total_outfits'] = _count("SELECT COUNT(*) FROM outfits")
    liked_count_val = _count("SELECT COUNT(*) FROM outfits WHERE liked = 1")
    stats['liked_outfits'] = liked_count_val
    stats['satisfaction_rate'] = round((liked_count_val / stats['total_outfits']) * 100, 2) if stats['total_outfits'] > 0 else 0

    stats['outfits_today'] = _count(_pick(
        """
            SELECT COUNT(*) FROM outfits
            WHERE date(created_at) = date('now')
        """,
        """
            SELECT COUNT(*) FROM outfits
            WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
        """
    ))
    stats['outfits_week'] = _count(_pick(
        """
            SELECT COUNT(*) FROM outfits
            WHERE created_at >= datetime('now', '-7 days')
        """,
        """
            SELECT COUNT(*) FROM outfits
            WHERE created_at >= DATEADD(day, -7, GETDATE())
        """
    ))

    return stats


def get_activity_chart_data(days: int = 7) -> list:
    """
    Get outfit creation activity for the last N days
    
    Args:
        days (int): Number of days to retrieve data for
        
    Returns:
        list: List of dictionaries with date and count
    """
    db_type = os.getenv('DB_TYPE', 'mssql').lower()
    if db_type == 'sqlite':
        query = """
            SELECT date(created_at) as date, COUNT(*) as count
            FROM outfits
            WHERE created_at >= datetime('now', ?)
            GROUP BY date(created_at)
            ORDER BY date
        """
        params = (f"-{days} days",)
    else:
        query = """
            SELECT CAST(created_at AS DATE) as date, COUNT(*) as count
            FROM outfits
            WHERE created_at >= DATEADD(day, ?, GETDATE())
            GROUP BY CAST(created_at AS DATE)
            ORDER BY date
        """
        params = (-days,)
    
    results = execute_query(query, params, fetch=True)
    
    activity_data = []
    for row in results:
        activity_data.append({
            'date': _to_iso(row[0]) if row[0] else None,
            'count': row[1]
        })
    
    return activity_data


def get_style_distribution() -> dict:
    """
    Get distribution of outfit styles from style_data JSON
    
    Returns:
        dict: Style distribution statistics
    """
    # Note: This is a simplified version
    # In reality, you'd parse the JSON style_data field
    query = "SELECT style_data FROM outfits WHERE style_data IS NOT NULL"
    results = execute_query(query, fetch=True)
    
    style_counts = {'casual': 0, 'elegant': 0, 'sport': 0, 'other': 0}
    
    import json
    for row in results:
        try:
            if row[0]:
                data = json.loads(row[0])
                style = data.get('style', '').lower()
                if 'casual' in style:
                    style_counts['casual'] += 1
                elif 'elegant' in style:
                    style_counts['elegant'] += 1
                elif 'sport' in style:
                    style_counts['sport'] += 1
                else:
                    style_counts['other'] += 1
        except (TypeError, ValueError):
            continue
    
    return style_counts


def get_top_users(limit: int = 5) -> list:
    """
    Get top N most active users by outfit count
    
    Args:
        limit (int): Number of top users to return
        
    Returns:
        list: List of user dictionaries with email and outfit count
    """
    synthetic_pattern = 'feedback.user.%@example.com'
    db_type = os.getenv('DB_TYPE', 'mssql').lower()
    if db_type == 'sqlite':
        query = """
            SELECT u.email, COUNT(o.id) as outfit_count
            FROM users u
            LEFT JOIN outfits o ON u.id = o.user_id
            WHERE u.email NOT LIKE ?
            GROUP BY u.email
            ORDER BY outfit_count DESC
            LIMIT ?
        """
        params = (synthetic_pattern, limit)
    else:
        query = """
            SELECT TOP (?) u.email, COUNT(o.id) as outfit_count
            FROM users u
            LEFT JOIN outfits o ON u.id = o.user_id
            WHERE u.email NOT LIKE ?
            GROUP BY u.email
            ORDER BY outfit_count DESC
        """
        params = (limit, synthetic_pattern)

    results = execute_query(query, params, fetch=True)
    
    top_users = []
    for row in results:
        top_users.append({
            'email': row[0],
            'outfit_count': row[1]
        })
    
    return top_users


def get_all_users() -> list:
    """
    Get all users with their basic information
    
    Returns:
        list: List of user dictionaries
    """
    synthetic_pattern = 'feedback.user.%@example.com'
    query = """
        SELECT id, email, role, created_at,
               (SELECT COUNT(*) FROM outfits WHERE user_id = users.id) as outfit_count
        FROM users
        WHERE email NOT LIKE ?
        ORDER BY created_at DESC
    """

    results = execute_query(query, (synthetic_pattern,), fetch=True)
    
    users = []
    for row in results:
        users.append({
            'id': row[0],
            'email': row[1],
            'role': row[2],
            'created_at': _to_iso(row[3]) if row[3] else None,
            'outfit_count': row[4]
        })
    
    return users


def get_recent_outfits(limit: int = 10) -> list:
    """
    Get most recent outfits across all users
    
    Args:
        limit (int): Number of recent outfits to return
        
    Returns:
        list: List of outfit dictionaries
    """
    db_type = os.getenv('DB_TYPE', 'mssql').lower()
    if db_type == 'sqlite':
        query = """
            SELECT o.id, o.user_id, u.email, o.created_at, o.liked
            FROM outfits o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT ?
        """
    else:
        query = """
            SELECT TOP (?) o.id, o.user_id, u.email, o.created_at, o.liked
            FROM outfits o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        """
    
    results = execute_query(query, (limit,), fetch=True)
    
    outfits = []
    for row in results:
        outfits.append({
            'id': row[0],
            'user_id': row[1],
            'user_email': row[2],
            'created_at': _to_iso(row[3]) if row[3] else None,
            'liked': bool(row[4])
        })
    
    return outfits
