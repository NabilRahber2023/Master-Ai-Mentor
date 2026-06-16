"""
Entity Resolution Pipeline for AI Mentor Chatbot.
Runs BEFORE intent detection to resolve student references.
This is the authoritative source for student entity resolution.
"""
import re
import logging
from typing import Optional, List
from dataclasses import dataclass
from sqlalchemy import select, text
from app.chatbot.database import async_session_maker
from app.chatbot.models import Student
from app.chatbot.ingest_csv import get_embedding_model

logger = logging.getLogger(__name__)


@dataclass
class ResolvedEntity:
    """Result of entity resolution."""
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    candidates: Optional[List[dict]] = None
    status: str = "not_found"  # "exact", "single", "ambiguous", "not_found"


class StudentResolver:
    """
    Single authoritative source for student entity resolution.
    Runs BEFORE intent detection to resolve student references.
    """
    
    # Pattern to match student IDs like STU001, STU-123, ABC1234
    STUDENT_ID_PATTERN = re.compile(r'\b([A-Z]{2,4}[-_]?\d{3,6})\b', re.IGNORECASE)
    
    # Follow-up query indicators
    FOLLOWUP_INDICATORS = frozenset([
        "his", "her", "their", "the student", "this student",
        "same student", "them", "what about", "and also", "also",
        "for them", "for him", "for her", "that student"
    ])
    
    async def resolve(
        self,
        message: str,
        session_student_id: Optional[str] = None,
        last_resolved_student_id: Optional[str] = None
    ) -> ResolvedEntity:
        """
        Resolve student entity from message or session context.
        
        Order of precedence:
        1. Explicit student ID in message (exact match)
        2. Session's selected student (for follow-up queries)
        3. Name search (exact → fuzzy → semantic)
        
        Args:
            message: User's message
            session_student_id: Currently selected student in session
            last_resolved_student_id: Last resolved student for context
            
        Returns:
            ResolvedEntity with resolution result
        """
        message = message.strip()
        
        # 1. Check for explicit student ID in message
        student_id = self._extract_student_id(message)
        if student_id:
            logger.info(f"Found explicit student ID in message: {student_id}")
            return await self._lookup_by_id(student_id)
        
        # 2. Check if this is a follow-up query
        if self._is_followup_query(message):
            # Use session student or last resolved
            context_id = session_student_id or last_resolved_student_id
            if context_id:
                logger.info(f"Follow-up query, using context student: {context_id}")
                return await self._lookup_by_id(context_id)
        
        # 3. Extract and search by name
        name_query = self._extract_name_query(message)
        if name_query and len(name_query) >= 2:
            logger.info(f"Searching by name query: {name_query}")
            return await self._search_by_name(name_query)
        
        # 4. No entity found in message, return session context if available
        if session_student_id:
            logger.info(f"No entity in message, using session student: {session_student_id}")
            return await self._lookup_by_id(session_student_id)
        
        logger.info("No student entity could be resolved")
        return ResolvedEntity(status="not_found")
    
    def _extract_student_id(self, message: str) -> Optional[str]:
        """Extract student ID pattern from message."""
        match = self.STUDENT_ID_PATTERN.search(message)
        if match:
            return match.group(1).upper()
        return None
    
    def _is_followup_query(self, message: str) -> bool:
        """Detect if message is a follow-up question about current student."""
        msg_lower = message.lower()
        return any(indicator in msg_lower for indicator in self.FOLLOWUP_INDICATORS)
    
    def _extract_name_query(self, message: str) -> Optional[str]:
        """Extract potential student name from message."""
        # Remove common stop words and command words
        stop_words = {
            "find", "search", "look", "for", "student", "named", "called",
            "who", "is", "the", "a", "an", "about", "info", "details",
            "what", "predict", "sgpa", "gpa", "career", "grade", "show",
            "tell", "me", "get", "of", "please", "can", "you", "i", "want",
            "to", "and", "or", "with", "from", "their", "his", "her",
            "9box", "9-box", "nine", "box", "subject", "department", "major"
        }
        
        words = message.split()
        filtered = [w for w in words if w.lower() not in stop_words and len(w) > 1]
        
        # Check if any remaining word looks like a name (starts with capital)
        name_parts = [w for w in filtered if w[0].isupper() or w.isalpha()]
        
        return " ".join(name_parts).strip() if name_parts else None
    
    async def _lookup_by_id(self, student_id: str) -> ResolvedEntity:
        """Lookup student by exact ID."""
        async with async_session_maker() as session:
            result = await session.execute(
                select(Student).where(Student.student_id == student_id)
            )
            student = result.scalar_one_or_none()
            
            if student:
                return ResolvedEntity(
                    student_id=student.student_id,
                    student_name=student.name,
                    status="exact"
                )
            
            return ResolvedEntity(status="not_found")
    
    async def _search_by_name(self, query: str) -> ResolvedEntity:
        """
        Search for students by name using multiple strategies:
        1. Exact case-insensitive match
        2. Trigram fuzzy match
        3. Semantic vector search
        """
        async with async_session_maker() as session:
            # Try exact name match first (case-insensitive)
            exact_result = await session.execute(
                select(Student).where(Student.name.ilike(f"%{query}%"))
            )
            students = exact_result.scalars().all()
            
            if len(students) == 1:
                s = students[0]
                return ResolvedEntity(
                    student_id=s.student_id,
                    student_name=s.name,
                    status="single"
                )
            
            if len(students) > 1:
                return ResolvedEntity(
                    candidates=[
                        {
                            "student_id": s.student_id,
                            "name": s.name,
                            "district": s.district,
                            "department": s.preferred_department
                        }
                        for s in students[:5]  # Limit to 5 candidates
                    ],
                    status="ambiguous"
                )
            
            # No exact match, try semantic search with embeddings
            return await self._semantic_search(session, query)
    
    async def _semantic_search(self, session, query: str) -> ResolvedEntity:
        """Search using pgvector semantic similarity."""
        try:
            model = get_embedding_model()
            query_embedding = model.encode([query])[0].tolist()
            
            sql = text("""
                SELECT student_id, name, district, preferred_department,
                       embedding <-> :embedding AS distance
                FROM students
                WHERE embedding IS NOT NULL
                ORDER BY distance
                LIMIT 5
            """)
            
            result = await session.execute(
                sql,
                {"embedding": query_embedding}
            )
            rows = result.fetchall()
            
            if not rows:
                return ResolvedEntity(status="not_found")
            
            # If top result has very low distance (high similarity), treat as single
            if rows[0][4] < 0.3:  # distance threshold
                return ResolvedEntity(
                    student_id=rows[0][0],
                    student_name=rows[0][1],
                    status="single"
                )
            
            # Multiple candidates
            return ResolvedEntity(
                candidates=[
                    {
                        "student_id": row[0],
                        "name": row[1],
                        "district": row[2],
                        "department": row[3]
                    }
                    for row in rows
                ],
                status="ambiguous"
            )
            
        except Exception as e:
            logger.warning(f"Semantic search failed: {e}")
            return ResolvedEntity(status="not_found")


# Global instance
_student_resolver: Optional[StudentResolver] = None


def get_student_resolver() -> StudentResolver:
    """Get the global StudentResolver instance."""
    global _student_resolver
    if _student_resolver is None:
        _student_resolver = StudentResolver()
    return _student_resolver
