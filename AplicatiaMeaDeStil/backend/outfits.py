"""
Outfits module - handles saving, retrieving, and managing user outfits
"""
import json
from datetime import datetime
from database import execute_query, execute_query_one


def save_outfit(user_id: int, image_url: str, style_data: dict) -> dict:
    """
    Save a new outfit for a user
    
    Args:
        user_id (int): User ID
        image_url (str): URL/path to outfit image
        style_data (dict): Style information (colors, patterns, etc.)
        
    Returns:
        dict: Success message with outfit info
    """
    print(f"[outfits.save_outfit] Saving outfit for user {user_id}")
    print(f"[outfits.save_outfit] Image URL: {image_url}")
    print(f"[outfits.save_outfit] Style data: {style_data}")
    
    style_json = json.dumps(style_data)
    
    query = """
        INSERT INTO outfits (user_id, image_url, style_data, liked)
        OUTPUT INSERTED.id, INSERTED.created_at
        VALUES (?, ?, ?, 0)
    """
    
    try:
        print(f"[outfits.save_outfit] Executing INSERT query...")
        result = execute_query_one(query, (user_id, image_url, style_json))
        print(f"[outfits.save_outfit] INSERT result: {result}")
        
        outfit_id = result[0]
        created_at = result[1]
        
        print(f"[outfits.save_outfit] Outfit saved successfully - ID: {outfit_id}")
        
        return {
            'success': True,
            'message': 'Outfit saved successfully',
            'outfit': {
                'id': outfit_id,
                'user_id': user_id,
                'image_url': image_url,
                'style_data': style_data,
                'liked': False,
                'created_at': created_at.isoformat() if created_at else None
            }
        }
    except Exception as e:
        print(f"[outfits.save_outfit] ERROR: {str(e)}")
        raise Exception(f"Failed to save outfit: {str(e)}")


def get_user_outfits(user_id: int, liked_only: bool = False) -> list:
    """
    Get all outfits for a user
    
    Args:
        user_id (int): User ID
        liked_only (bool): If True, return only liked outfits
        
    Returns:
        list: List of outfit dictionaries
    """
    if liked_only:
        query = """
            SELECT id, user_id, image_url, style_data, liked, created_at
            FROM outfits
            WHERE user_id = ? AND liked = 1
            ORDER BY created_at DESC
        """
    else:
        query = """
            SELECT id, user_id, image_url, style_data, liked, created_at
            FROM outfits
            WHERE user_id = ?
            ORDER BY created_at DESC
        """
    
    try:
        results = execute_query(query, (user_id,), fetch=True)
        
        outfits = []
        for row in results:
            style_data = json.loads(row[3]) if row[3] else {}
            outfits.append({
                'id': row[0],
                'user_id': row[1],
                'image_url': row[2],
                'style_data': style_data,
                'liked': bool(row[4]),
                'created_at': row[5].isoformat() if row[5] else None
            })
        
        return outfits
    except Exception as e:
        raise Exception(f"Failed to retrieve outfits: {str(e)}")


def toggle_outfit_like(outfit_id: int, user_id: int) -> dict:
    """
    Toggle like status for an outfit
    
    Args:
        outfit_id (int): Outfit ID
        user_id (int): User ID (for verification)
        
    Returns:
        dict: Success message with new like status
    """
    # First verify the outfit belongs to the user
    verify_query = "SELECT liked FROM outfits WHERE id = ? AND user_id = ?"
    outfit = execute_query_one(verify_query, (outfit_id, user_id))
    
    if not outfit:
        raise Exception("Outfit not found or unauthorized")
    
    current_liked = outfit[0]
    new_liked = 0 if current_liked else 1
    
    # Update like status
    update_query = "UPDATE outfits SET liked = ? WHERE id = ?"
    execute_query(update_query, (new_liked, outfit_id))
    
    return {
        'success': True,
        'message': 'Like status updated',
        'liked': bool(new_liked)
    }


def delete_outfit(outfit_id: int, user_id: int) -> dict:
    """
    Delete an outfit
    
    Args:
        outfit_id (int): Outfit ID
        user_id (int): User ID (for verification)
        
    Returns:
        dict: Success message
    """
    # Verify the outfit belongs to the user
    verify_query = "SELECT id FROM outfits WHERE id = ? AND user_id = ?"
    outfit = execute_query_one(verify_query, (outfit_id, user_id))
    
    if not outfit:
        raise Exception("Outfit not found or unauthorized")
    
    # Delete outfit
    delete_query = "DELETE FROM outfits WHERE id = ?"
    execute_query(delete_query, (outfit_id,))
    
    return {
        'status': 'success',
        'message': 'Outfit deleted successfully'
    }


def get_outfit_by_id(outfit_id: int, user_id: int) -> dict:
    """
    Get a specific outfit by ID
    
    Args:
        outfit_id (int): Outfit ID
        user_id (int): User ID (for verification)
        
    Returns:
        dict: Outfit information
    """
    query = """
        SELECT id, user_id, image_url, style_data, liked, created_at
        FROM outfits
        WHERE id = ? AND user_id = ?
    """
    
    result = execute_query_one(query, (outfit_id, user_id))
    
    if not result:
        raise Exception("Outfit not found")
    
    style_data = json.loads(result[3]) if result[3] else {}
    
    return {
        'id': result[0],
        'user_id': result[1],
        'image_url': result[2],
        'style_data': style_data,
        'liked': bool(result[4]),
        'created_at': result[5].isoformat() if result[5] else None
    }
