import sqlite3
import os
import json
import logging
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
    
    # Create user profile table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY DEFAULT 1,
            xp INTEGER DEFAULT 170,
            streak INTEGER DEFAULT 3,
            last_active_date TEXT,
            daily_concepts_completed INTEGER DEFAULT 0,
            active_path_id INTEGER
        )
    """)
    
    # Create lessons history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lessons_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT UNIQUE,
            title TEXT,
            emoji TEXT,
            subject_tag TEXT,
            level TEXT,
            age_group TEXT,
            duration TEXT,
            completed_concepts TEXT DEFAULT '[]',
            quiz_score INTEGER DEFAULT -1,
            lesson_data TEXT,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create learning paths table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_paths (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            query TEXT,
            steps TEXT, -- JSON array of steps
            current_step INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Seed default user profile if empty
    cursor.execute("SELECT COUNT(*) FROM user_profile")
    if cursor.fetchone()[0] == 0:
        today = date.today().isoformat()
        cursor.execute("""
            INSERT INTO user_profile (id, xp, streak, last_active_date, daily_concepts_completed)
            VALUES (1, 170, 3, ?, 0)
        """, (today,))
        
    conn.commit()
    conn.close()

def get_user_profile():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    row = cursor.fetchone()
    
    # Verify streak logic based on date
    profile = dict(row)
    today = date.today().isoformat()
    last_active = profile.get("last_active_date")
    
    if last_active != today:
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        if last_active == yesterday:
            # Keep streak, just update active date when they gain XP / interact
            pass
        else:
            # Lost streak if not yesterday or today
            profile["streak"] = 0
            cursor.execute("UPDATE user_profile SET streak = 0 WHERE id = 1")
            conn.commit()
            
        # Reset daily concept count for the new day
        profile["daily_concepts_completed"] = 0
        cursor.execute("UPDATE user_profile SET daily_concepts_completed = 0 WHERE id = 1")
        conn.commit()
        
    conn.close()
    return profile

def update_user_stats(xp_gain: int, concept_completed: bool = False):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    profile = dict(cursor.fetchone())
    
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    
    new_xp = profile["xp"] + xp_gain
    new_streak = profile["streak"]
    new_daily_concepts = profile["daily_concepts_completed"]
    
    if concept_completed:
        new_daily_concepts += 1
        
    # Streak calculation
    last_active = profile["last_active_date"]
    if last_active != today:
        if last_active == yesterday:
            new_streak += 1
        else:
            new_streak = 1 # reset streak to 1 day active
            
    cursor.execute("""
        UPDATE user_profile 
        SET xp = ?, streak = ?, last_active_date = ?, daily_concepts_completed = ?
        WHERE id = 1
    """, (new_xp, new_streak, today, new_daily_concepts))
    
    conn.commit()
    conn.close()
    
    return {
        "xp": new_xp,
        "streak": new_streak,
        "daily_concepts_completed": new_daily_concepts
    }

def add_lesson_to_history(topic: str, title: str, emoji: str, subject_tag: str, level: str, age_group: str, duration: str, lesson_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    lesson_json = json.dumps(lesson_data)
    now = datetime.now().isoformat()
    
    # Check if level or age_group has changed to reset completion progress
    cursor.execute("SELECT level, age_group FROM lessons_history WHERE topic = ?", (topic,))
    row = cursor.fetchone()
    if row:
        if row["level"] != level or row["age_group"] != age_group:
            cursor.execute("""
                UPDATE lessons_history 
                SET level = ?, age_group = ?, completed_concepts = '[]', quiz_score = -1, lesson_data = ?, last_accessed = ?, title = ?, emoji = ?, subject_tag = ?, duration = ?
                WHERE topic = ?
            """, (level, age_group, lesson_json, now, title, emoji, subject_tag, duration, topic))
            conn.commit()
            conn.close()
            return
            
    cursor.execute("""
        INSERT INTO lessons_history (topic, title, emoji, subject_tag, level, age_group, duration, lesson_data, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(topic) DO UPDATE SET
            last_accessed = excluded.last_accessed,
            level = excluded.level,
            age_group = excluded.age_group,
            lesson_data = excluded.lesson_data
    """, (topic, title, emoji, subject_tag, level, age_group, duration, lesson_json, now))
    
    conn.commit()
    conn.close()

def get_lessons_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, topic, title, emoji, subject_tag, level, duration, completed_concepts, quiz_score, last_accessed 
        FROM lessons_history 
        ORDER BY last_accessed DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        item = dict(r)
        item["completed_concepts"] = json.loads(item["completed_concepts"])
        history.append(item)
    return history

def get_lesson_data(topic: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT lesson_data, completed_concepts, quiz_score, level, age_group FROM lessons_history WHERE topic = ?", (topic,))
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

def update_concept_completion(topic: str, concept_name: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT completed_concepts FROM lessons_history WHERE topic = ?", (topic,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return []
        
    completed = json.loads(row["completed_concepts"])
    if concept_name not in completed:
        completed.append(concept_name)
        
        cursor.execute(
            "UPDATE lessons_history SET completed_concepts = ? WHERE topic = ?",
            (json.dumps(completed), topic)
        )
        conn.commit()
        
        # Award XP for concept completion (10 XP)
        update_user_stats(xp_gain=10, concept_completed=True)
        
    conn.close()
    return completed

def update_quiz_score(topic: str, score: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT quiz_score FROM lessons_history WHERE topic = ?", (topic,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return
        
    prev_score = row["quiz_score"]
    
    cursor.execute(
        "UPDATE lessons_history SET quiz_score = ? WHERE topic = ?",
        (score, topic)
    )
    conn.commit()
    
    # If first time completing the quiz, award XP
    if prev_score == -1:
        # 10 XP per correct answer + 20 XP bonus for perfect score
        xp_reward = (score * 10) + (20 if score == 3 else 0)
        update_user_stats(xp_gain=xp_reward)
        
    conn.close()

def create_learning_path(title: str, query: str, steps: list):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    steps_json = json.dumps(steps)
    cursor.execute("""
        INSERT INTO learning_paths (title, query, steps)
        VALUES (?, ?, ?)
    """, (title, query, steps_json))
    
    path_id = cursor.lastrowid
    
    # Set active path ID for user
    cursor.execute("UPDATE user_profile SET active_path_id = ? WHERE id = 1", (path_id,))
    
    conn.commit()
    conn.close()
    
    return path_id

def get_learning_paths():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM learning_paths ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    paths = []
    for r in rows:
        item = dict(r)
        item["steps"] = json.loads(item["steps"])
        paths.append(item)
    return paths

def get_learning_path_by_id(path_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM learning_paths WHERE id = ?", (path_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        item = dict(row)
        item["steps"] = json.loads(item["steps"])
        return item
    return None

def update_path_step_status(path_id: int, step_order: int, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT steps FROM learning_paths WHERE id = ?", (path_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return None
        
    steps = json.loads(row["steps"])
    for s in steps:
        if s["order"] == step_order:
            s["status"] = status
            
    cursor.execute(
        "UPDATE learning_paths SET steps = ? WHERE id = ?",
        (json.dumps(steps), path_id)
    )
    conn.commit()
    conn.close()
    
    return steps
