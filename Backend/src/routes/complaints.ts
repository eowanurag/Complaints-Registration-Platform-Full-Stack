import { Router, Response } from 'express';
import { db } from '../db';
import { complaints, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateFollowUpQuestion } from '../utils/ai';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// /api/ai/question
router.post('/ai/question', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { complaint_text } = req.body;
    if (!complaint_text) {
      return res.status(400).json({ error: 'Complaint text is required' });
    }

    const question = await generateFollowUpQuestion(complaint_text);
    res.json({ question });
  } catch (error) {
    console.error('AI Question Error:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// /api/complaints
router.post('/complaints', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { complaint_text, ai_question, user_answer } = req.body;
    if (!complaint_text || !ai_question || !user_answer) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newComplaint = await db.insert(complaints).values({
      user_id: req.user!.id,
      complaint_text,
      ai_question,
      user_answer
    }).returning();

    res.json(newComplaint[0]);
  } catch (error) {
    console.error('Submit Complaint Error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// /api/complaints/my
router.get('/complaints/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const myComplaints = await db
      .select()
      .from(complaints)
      .where(eq(complaints.user_id, req.user!.id))
      .orderBy(desc(complaints.created_at));

    res.json(myComplaints);
  } catch (error) {
    console.error('Fetch My Complaints Error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// /api/admin/complaints
router.get('/admin/complaints', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const allComplaints = await db
      .select({
        id: complaints.id,
        complaint_text: complaints.complaint_text,
        ai_question: complaints.ai_question,
        user_answer: complaints.user_answer,
        created_at: complaints.created_at,
        user_name: users.name,
        user_email: users.email
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.user_id, users.id))
      .orderBy(desc(complaints.created_at));

    res.json(allComplaints);
  } catch (error) {
    console.error('Fetch Admin Complaints Error:', error);
    res.status(500).json({ error: 'Failed to fetch all complaints' });
  }
});

export default router;
