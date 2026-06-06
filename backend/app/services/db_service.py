import sqlite3
import os
import json
import logging
import hashlib
import secrets
from datetime import datetime, date, timedelta

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "synapraxis.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    logger.info(f"Initializing database at {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Migrate users table if firebase_uid column is missing
    cursor.execute("PRAGMA table_info(users)")
    user_columns = [row["name"] for row in cursor.fetchall()]
    if user_columns and "firebase_uid" not in user_columns:
        logger.info("Migrating users table: adding firebase_uid column...")
        cursor.execute("ALTER TABLE users ADD COLUMN firebase_uid TEXT")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid)")
    
    # Create user sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create user profile table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profile (
            user_id INTEGER PRIMARY KEY,
            xp INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            last_active_date TEXT,
            daily_concepts_completed INTEGER DEFAULT 0,
            active_path_id INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Check if lessons_history needs migration (needs user_id column)
    cursor.execute("PRAGMA table_info(lessons_history)")
    columns = [row["name"] for row in cursor.fetchall()]
    
    if columns and "user_id" not in columns:
        logger.info("Migrating database tables to multi-user schema...")
        cursor.execute("DROP TABLE IF EXISTS lessons_history")
        cursor.execute("DROP TABLE IF EXISTS learning_paths")
        
    # Create lessons history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lessons_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic TEXT,
            title TEXT,
            emoji TEXT,
            subject_tag TEXT,
            level TEXT,
            age_group TEXT,
            duration TEXT,
            completed_concepts TEXT DEFAULT '[]',
            quiz_score INTEGER DEFAULT -1,
            lesson_data TEXT,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, topic)
        )
    """)
    
    # Create learning paths table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_paths (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            query TEXT,
            steps TEXT, -- JSON array of steps
            current_step INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()

# ─── PASSWORD HASHING HACKS ──────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{pwd_hash.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt_hex, hash_hex = hashed_password.split(':')
        salt = bytes.fromhex(salt_hex)
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return pwd_hash.hex() == hash_hex
    except Exception:
        return False

# ─── USER & SESSION MANAGEMENT ──────────────────────────────────────────────

def create_user(email: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    hashed = hash_password(password)
    try:
        cursor.execute("""
            INSERT INTO users (email, hashed_password)
            VALUES (?, ?)
        """, (email.lower().strip(), hashed))
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_or_create_user_by_firebase(firebase_uid: str, email: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user already exists with this firebase_uid
    cursor.execute("SELECT id FROM users WHERE firebase_uid = ?", (firebase_uid,))
    row = cursor.fetchone()
    if row:
        conn.close()
        return row["id"]
        
    # Check if user already exists with this email (maybe created before Firebase migration)
    cursor.execute("SELECT id, firebase_uid FROM users WHERE email = ?", (email.lower().strip(),))
    row = cursor.fetchone()
    if row:
        # Update the existing user with the firebase_uid
        cursor.execute("UPDATE users SET firebase_uid = ? WHERE id = ?", (firebase_uid, row["id"]))
        conn.commit()
        conn.close()
        return row["id"]
        
    # Create new user
    dummy_pass = hash_password(secrets.token_hex(32))
    try:
        cursor.execute("""
            INSERT INTO users (email, hashed_password, firebase_uid)
            VALUES (?, ?, ?)
        """, (email.lower().strip(), dummy_pass, firebase_uid))
        user_id = cursor.lastrowid
        
        # Initialize user profile
        today = date.today().isoformat()
        cursor.execute("""
            INSERT INTO user_profile (user_id, xp, streak, last_active_date, daily_concepts_completed)
            VALUES (?, 0, 0, ?, 0)
        """, (user_id, today))
        
        conn.commit()
        conn.close()
        return user_id
    except sqlite3.IntegrityError as e:
        logger.error(f"Error creating user by firebase: {e}")
        # Fallback query if concurrent insertion happened
        cursor.execute("SELECT id FROM users WHERE firebase_uid = ?", (firebase_uid,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row["id"]
        return None

def authenticate_user(email: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, hashed_password FROM users WHERE email = ?", (email.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    
    if row and verify_password(password, row["hashed_password"]):
        return row["id"]
    return None

def create_session(user_id: int) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    token = secrets.token_hex(32)
    cursor.execute("""
        INSERT INTO user_sessions (token, user_id)
        VALUES (?, ?)
    """, (token, user_id))
    conn.commit()
    conn.close()
    return token

def get_user_id_by_session(token: str) -> int | None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM user_sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return row["user_id"]
    return None

def delete_session(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# ─── USER PROFILE & STATISTICS ────────────────────────────────────────────────

def get_user_profile(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_profile WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    
    if not row:
        # Create default profile with 0 XP and 0 Streak for new users
        today = date.today().isoformat()
        cursor.execute("""
            INSERT INTO user_profile (user_id, xp, streak, last_active_date, daily_concepts_completed)
            VALUES (?, 0, 0, ?, 0)
        """, (user_id, today))
        conn.commit()
        cursor.execute("SELECT * FROM user_profile WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        
    profile = dict(row)
    today = date.today().isoformat()
    last_active = profile.get("last_active_date")
    
    if last_active != today:
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        if last_active == yesterday:
            pass
        else:
            profile["streak"] = 0
            cursor.execute("UPDATE user_profile SET streak = 0 WHERE user_id = ?", (user_id,))
            conn.commit()
            
        profile["daily_concepts_completed"] = 0
        cursor.execute("UPDATE user_profile SET daily_concepts_completed = 0 WHERE user_id = ?", (user_id,))
        conn.commit()
        
    conn.close()
    return profile

def update_user_stats(user_id: int, xp_gain: int, concept_completed: bool = False):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    profile = get_user_profile(user_id)
    
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    
    new_xp = profile["xp"] + xp_gain
    new_streak = profile["streak"]
    new_daily_concepts = profile["daily_concepts_completed"]
    
    if concept_completed:
        new_daily_concepts += 1
        
    last_active = profile["last_active_date"]
    if last_active != today:
        if last_active == yesterday:
            new_streak += 1
        else:
            new_streak = 1
            
    cursor.execute("""
        UPDATE user_profile 
        SET xp = ?, streak = ?, last_active_date = ?, daily_concepts_completed = ?
        WHERE user_id = ?
    """, (new_xp, new_streak, today, new_daily_concepts, user_id))
    
    conn.commit()
    conn.close()
    
    return {
        "xp": new_xp,
        "streak": new_streak,
        "daily_concepts_completed": new_daily_concepts
    }

# ─── LESSON HISTORY & PROGRESS ────────────────────────────────────────────────

def add_lesson_to_history(user_id: int, topic: str, title: str, emoji: str, subject_tag: str, level: str, age_group: str, duration: str, lesson_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    lesson_json = json.dumps(lesson_data)
    now = datetime.now().isoformat()
    
    cursor.execute("SELECT level, age_group FROM lessons_history WHERE user_id = ? AND topic = ?", (user_id, topic))
    row = cursor.fetchone()
    if row:
        if row["level"] != level or row["age_group"] != age_group:
            cursor.execute("""
                UPDATE lessons_history 
                SET level = ?, age_group = ?, completed_concepts = '[]', quiz_score = -1, lesson_data = ?, last_accessed = ?, title = ?, emoji = ?, subject_tag = ?, duration = ?
                WHERE user_id = ? AND topic = ?
            """, (level, age_group, lesson_json, now, title, emoji, subject_tag, duration, user_id, topic))
            conn.commit()
            conn.close()
            return
            
    cursor.execute("""
        INSERT INTO lessons_history (user_id, topic, title, emoji, subject_tag, level, age_group, duration, lesson_data, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, topic) DO UPDATE SET
            last_accessed = excluded.last_accessed,
            level = excluded.level,
            age_group = excluded.age_group,
            lesson_data = excluded.lesson_data
    """, (user_id, topic, title, emoji, subject_tag, level, age_group, duration, lesson_json, now))
    
    conn.commit()
    conn.close()

def get_lessons_history(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, topic, title, emoji, subject_tag, level, duration, completed_concepts, quiz_score, last_accessed 
        FROM lessons_history 
        WHERE user_id = ?
        ORDER BY last_accessed DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        item = dict(r)
        item["completed_concepts"] = json.loads(item["completed_concepts"])
        history.append(item)
    return history

def get_lesson_data(user_id: int, topic: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lesson_data, completed_concepts, quiz_score, level, age_group FROM lessons_history WHERE user_id = ? AND topic = ?", (user_id, topic))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        data = json.loads(row["lesson_data"])
        data["completed_concepts"] = json.loads(row["completed_concepts"])
        data["quiz_score"] = row["quiz_score"]
        data["level"] = row["level"]
        data["age_group"] = row["age_group"]
        return data
    return None

def update_concept_completion(user_id: int, topic: str, concept_name: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT completed_concepts FROM lessons_history WHERE user_id = ? AND topic = ?", (user_id, topic))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return []
        
    completed = json.loads(row["completed_concepts"])
    if concept_name not in completed:
        completed.append(concept_name)
        
        cursor.execute(
            "UPDATE lessons_history SET completed_concepts = ? WHERE user_id = ? AND topic = ?",
            (json.dumps(completed), user_id, topic)
        )
        conn.commit()
        
        update_user_stats(user_id, xp_gain=10, concept_completed=True)
        
    conn.close()
    return completed

def update_quiz_score(user_id: int, topic: str, score: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT quiz_score FROM lessons_history WHERE user_id = ? AND topic = ?", (user_id, topic))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return
        
    prev_score = row["quiz_score"]
    
    cursor.execute(
        "UPDATE lessons_history SET quiz_score = ? WHERE user_id = ? AND topic = ?",
        (score, user_id, topic)
    )
    conn.commit()
    
    if prev_score == -1:
        xp_reward = (score * 10) + (20 if score == 3 else 0)
        update_user_stats(user_id, xp_gain=xp_reward)
        
    conn.close()

# ─── LEARNING PATH ROADMAPS ───────────────────────────────────────────────────

def create_learning_path(user_id: int, title: str, query: str, steps: list):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    steps_json = json.dumps(steps)
    cursor.execute("""
        INSERT INTO learning_paths (user_id, title, query, steps)
        VALUES (?, ?, ?, ?)
    """, (user_id, title, query, steps_json))
    
    path_id = cursor.lastrowid
    
    cursor.execute("UPDATE user_profile SET active_path_id = ? WHERE user_id = ?", (path_id, user_id))
    
    conn.commit()
    conn.close()
    
    return path_id

def get_learning_paths(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM learning_paths WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    paths = []
    for r in rows:
        item = dict(r)
        item["steps"] = json.loads(item["steps"])
        paths.append(item)
    return paths

def get_learning_path_by_id(user_id: int, path_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM learning_paths WHERE user_id = ? AND id = ?", (user_id, path_id))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        item = dict(row)
        item["steps"] = json.loads(item["steps"])
        return item
    return None

def update_path_step_status(user_id: int, path_id: int, step_order: int, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT steps FROM learning_paths WHERE user_id = ? AND id = ?", (user_id, path_id))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return None
        
    steps = json.loads(row["steps"])
    for s in steps:
        if s["order"] == step_order:
            s["status"] = status
            
    cursor.execute(
        "UPDATE learning_paths SET steps = ? WHERE user_id = ? AND id = ?",
        (json.dumps(steps), user_id, path_id)
    )
    conn.commit()
    conn.close()
    
    return steps
