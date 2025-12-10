import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let chatSession: Chat | null = null;

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const initializeChat = () => {
  const ai = getAIClient();
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: "You are a friendly and encouraging study companion for a student. Keep your answers concise, helpful, and motivating. If asked about schedules or tasks, give general advice on time management as you don't have access to their real data yet.",
    },
  });
};

export const sendMessageToAI = async (message: string): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  try {
    const result: GenerateContentResponse = await chatSession.sendMessage({ message });
    return result.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
