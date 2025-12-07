"""
Database connection module for SQL Server
"""
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """
    Creates and returns a connection to SQL Server database
    Uses Windows Authentication by default
    """
    server = os.getenv('DB_SERVER', 'localhost')
    database = os.getenv('DB_NAME', 'StyleGenAI')
    driver = os.getenv('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')
    username = os.getenv('DB_USER', '')
    password = os.getenv('DB_PASSWORD', '')
    
    # Connection string
    if username and password:
        # SQL Server Authentication
        connection_string = f'DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}'
    else:
        # Windows Authentication
        connection_string = f'DRIVER={driver};SERVER={server};DATABASE={database};Trusted_Connection=yes;'
    
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except pyodbc.Error as e:
        print(f"Database connection error: {e}")
        raise

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
        
        if fetch:
            results = cursor.fetchall()
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
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        result = cursor.fetchone()
        
        # Commit if it's an INSERT/UPDATE/DELETE operation
        if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
            conn.commit()
        
        return result
    except Exception as e:
        if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
            conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
