import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure you have NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const aiModels = {
  knowledgeManager: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),
  contentWriter: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
  superAgent: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),
};

export async function askKnowledgeManager(prompt: string, context: string) {
  try {
    const fullPrompt = `Konteks:\n${context}\n\nPertanyaan: ${prompt}\n\nJawablah berdasarkan konteks proyek.`;
    const result = await aiModels.knowledgeManager.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Knowledge Manager Error:", error);
    return "Maaf, terjadi kesalahan saat memproses permintaan Anda.";
  }
}

export async function summarizeStandup(tasks: any[]) {
  try {
    const tasksString = JSON.stringify(tasks, null, 2);
    const prompt = `Buatkan ringkasan laporan standup harian yang profesional berdasarkan data tugas berikut:\n${tasksString}`;
    const result = await aiModels.contentWriter.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Content Writer Error:", error);
    return "Maaf, gagal membuat ringkasan standup.";
  }
}

export async function extractActionItems(notes: string) {
  try {
    const prompt = `Ekstrak 'action items' (tugas-tugas yang harus dilakukan) dari catatan rapat/diskusi berikut dan format dalam bentuk bullet points:\n\n${notes}`;
    const result = await aiModels.superAgent.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Super Agent Error:", error);
    return "Maaf, gagal mengekstrak action items.";
  }
}
