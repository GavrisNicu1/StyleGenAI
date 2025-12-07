"""
Admin module - handles admin dashboard statistics and user management
"""
from datetime import datetime, timedelta
from database import execute_query, execute_query_one


def get_dashboard_stats() -> dict:
    """
    Get comprehensive dashboard statistics
    
    Returns:
        dict: Dashboard statistics including users, outfits, and AI metrics
    """
    stats = {}
    
    # Total users
    user_count_query = "SELECT COUNT(*) FROM users"
    user_count = execute_query_one(user_count_query)
    stats['total_users'] = user_count[0] if user_count else 0
    
    # New users today
    today_users_query = """
        SELECT COUNT(*) FROM users 
        WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
    """
    today_users = execute_query_one(today_users_query)
    stats['new_users_today'] = today_users[0] if today_users else 0
    
    # New users this week
    week_users_query = """
        SELECT COUNT(*) FROM users 
        WHERE created_at >= DATEADD(day, -7, GETDATE())
    """
    week_users = execute_query_one(week_users_query)
    stats['new_users_week'] = week_users[0] if week_users else 0
    
    # Total outfits
    outfit_count_query = "SELECT COUNT(*) FROM outfits"
    outfit_count = execute_query_one(outfit_count_query)
    stats['total_outfits'] = outfit_count[0] if outfit_count else 0
    
    # Liked outfits (satisfaction rate)
    liked_query = "SELECT COUNT(*) FROM outfits WHERE liked = 1"
    liked_count = execute_query_one(liked_query)
    liked_count_val = liked_count[0] if liked_count else 0
    stats['liked_outfits'] = liked_count_val
    
    # Calculate satisfaction rate
    if stats['total_outfits'] > 0:
        stats['satisfaction_rate'] = round((liked_count_val / stats['total_outfits']) * 100, 2)
    else:
        stats['satisfaction_rate'] = 0
    
    # Outfits today
    today_outfits_query = """
        SELECT COUNT(*) FROM outfits 
        WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
    """
    today_outfits = execute_query_one(today_outfits_query)
    stats['outfits_today'] = today_outfits[0] if today_outfits else 0
    
    # Outfits this week
    week_outfits_query = """
        SELECT COUNT(*) FROM outfits 
        WHERE created_at >= DATEADD(day, -7, GETDATE())
    """
    week_outfits = execute_query_one(week_outfits_query)
    stats['outfits_week'] = week_outfits[0] if week_outfits else 0
    
    return stats


def get_activity_chart_data(days: int = 7) -> list:
    """
    Get outfit creation activity for the last N days
    
    Args:
        days (int): Number of days to retrieve data for
        
    Returns:
        list: List of dictionaries with date and count
    """
    query = """
        SELECT CAST(created_at AS DATE) as date, COUNT(*) as count
        FROM outfits
        WHERE created_at >= DATEADD(day, ?, GETDATE())
        GROUP BY CAST(created_at AS DATE)
        ORDER BY date
    """
    
    results = execute_query(query, (-days,), fetch=True)
    
    activity_data = []
    for row in results:
        activity_data.append({
            'date': row[0].isoformat() if row[0] else None,
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
        except:
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
    query = """
        SELECT TOP (?) u.email, COUNT(o.id) as outfit_count
        FROM users u
        LEFT JOIN outfits o ON u.id = o.user_id
        GROUP BY u.email
        ORDER BY outfit_count DESC
    """
    
    results = execute_query(query, (limit,), fetch=True)
    
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
    query = """
        SELECT id, email, role, created_at,
               (SELECT COUNT(*) FROM outfits WHERE user_id = users.id) as outfit_count
        FROM users
        ORDER BY created_at DESC
    """
    
    results = execute_query(query, fetch=True)
    
    users = []
    for row in results:
        users.append({
            'id': row[0],
            'email': row[1],
            'role': row[2],
            'created_at': row[3].isoformat() if row[3] else None,
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
            'created_at': row[3].isoformat() if row[3] else None,
            'liked': bool(row[4])
        })
    
    return outfits
