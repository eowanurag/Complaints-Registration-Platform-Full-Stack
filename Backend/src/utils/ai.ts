import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateFollowUpQuestion(complaintText: string): Promise<string> {
  try {
    const prompt = `You are an AI assistant helping a user formulate a detailed complaint. Based on the following complaint text, ask exactly ONE short follow-up question to gather more relevant information. 
    
Complaint: "${complaintText}"

Return ONLY the question, without any other text or formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    
    return response.text || "Could you provide more details about this issue?";
  } catch (error) {
    console.error("Error generating AI question:", error);
    return "Could you provide more details about this issue?";
  }
}
