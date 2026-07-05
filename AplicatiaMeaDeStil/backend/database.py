"""
Database connection module for SQL Server
"""
import os
import sqlite3
try:
    import pyodbc
except ImportError:
    pyodbc = None
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    db_type = os.getenv('DB_TYPE', 'mssql').lower()
    
    if db_type == 'sqlite':
        db_name = os.getenv('DB_NAME', 'stylegen.db')
        conn = sqlite3.connect(db_name)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        
        # Initialize tables if they don't exist
        init_sqlite_tables(conn)
        return conn
    else:
        # SQL Server Connection
        server = os.getenv('DB_SERVER', 'localhost')
        database = os.getenv('DB_NAME', 'StyleGenAI')
        driver = os.getenv('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')
        username = os.getenv('DB_USER', '')
        password = os.getenv('DB_PASSWORD', '')
        
        # Connection string construction
        if username and password:
            conn_str = f'DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        else:
            conn_str = f'DRIVER={driver};SERVER={server};DATABASE={database};Trusted_Connection=yes;'
            
        return pyodbc.connect(conn_str)

def init_sqlite_tables(conn):
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
    CREATE TABLE IF NOT exists users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Outfits table
    cursor.execute('''
    CREATE TABLE IF NOT exists outfits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image_url TEXT,
        style_data TEXT,
        liked BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')
    
    # Create AI Metrics table
    cursor.execute('''
    CREATE TABLE IF NOT exists ai_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        style TEXT,
        season TEXT,
        gender TEXT,
        processing_time REAL,
        success BOOLEAN,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
    ''')

    # Create Outfit Feedback table
    cursor.execute('''
    CREATE TABLE IF NOT exists outfit_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        is_liked BOOLEAN NOT NULL,
        style TEXT,
        season TEXT,
        gender TEXT,
        top_category TEXT,
        bottom_category TEXT,
        shoes_category TEXT,
        top_color TEXT,
        bottom_color TEXT,
        shoes_color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')
    cursor.execute('CREATE INDEX IF NOT exists idx_outfit_feedback_user_created ON outfit_feedback(user_id, created_at DESC)')
    
    conn.commit()

# End of module

def execute_query(query, params=None, fetch=False):
    """
    Execute a SQL query with optional parameters
    
    Args:
        query (str): SQL query to execute
        params (tuple): Parameters for the query
        fetch (bool): Whether to fetch results
        
    Returns:
        list or None: Query results if fetch=True, None otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    

    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        # Auto-fetch for SELECT queries or if explicitly requested
        if fetch or query.strip().upper().startswith('SELECT') or query.strip().upper().startswith('WITH'):
            # Convert rows to dicts if using pyodbc (sqlite uses Row factory)
            columns = [column[0] for column in cursor.description]
            results = cursor.fetchall()
            
            # If pyodbc (which returns tuples), convert to dicts manually to match sqlite Row behavior
            # Check if first result is tuple
            if results and isinstance(results[0], tuple) and not hasattr(results[0], 'keys'):
                 results = [dict(zip(columns, row)) for row in results]
                 
            return results
        else:
            conn.commit()
            return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def execute_query_one(query, params=None):
    """
    Execute a SQL query and fetch one result
    
    Args:
        query (str): SQL query to execute
        params (tuple): Parameters for the query
        
    Returns:
        Row or None: First result or None
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Detect if this is a modification query
        is_modification = query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE'))
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        # For modification queries, commit BEFORE potentially continuing
        # (Though usually we don't fetch anything unless we use RETURNING)
        if is_modification:
            conn.commit()
            
        result = cursor.fetchone()
        
        # Handle the case where result is a sqlite3.Row or similar but we need dictionary-like access
        # If it's a tuple (pyodbc), make it accessible by index (which it is already)
        return result
    except Exception as e:
        if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
            conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
