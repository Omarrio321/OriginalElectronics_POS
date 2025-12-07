
import { GoogleGenAI } from "@google/genai";
import { Sale, Product } from '../types';

// NOTE: In a real production app, never expose API keys on the client side.
// This is for demonstration purposes within the secure sandbox environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDailyReportAnalysis = async (
  sales: Sale[],
  products: Product[],
  date: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not configured. Unable to generate AI insights.";
  }

  const salesToday = sales.filter(s => s.date.startsWith(date));
  const totalRevenue = salesToday.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalItems = salesToday.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0);
  
  // Calculate profit (mock calculation based on current inventory buy prices)
  let estimatedProfit = 0;
  salesToday.forEach(sale => {
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        estimatedProfit += (item.unitPrice - product.buyingPrice) * item.quantity;
      }
    });
  });

  const prompt = `
    You are a financial analyst for a retail store called "Original Electronics".
    Analyze the following daily sales data for date: ${date}.
    
    Data:
    - Total Revenue: $${totalRevenue.toFixed(2)}
    - Total Profit: $${estimatedProfit.toFixed(2)}
    - Total Items Sold: ${totalItems}
    - Transaction Count: ${salesToday.length}
    - Top Selling Item Categories: ${[...new Set(salesToday.flatMap(s => s.items.map(i => products.find(p => p.id === i.productId)?.category || 'Unknown')))].join(', ')}

    Please provide a concise "Xisaab Xer" (Closing Report) summary. 
    Highlight key performance indicators, potential areas of concern (like low margin or low volume if applicable), and a brief enthusiastic summary for the owner.
    Keep it under 150 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while contacting the AI analyst.";
  }
};