import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface HouseData {
  propertyType: string;
  location: string;
  condition: string;
}

export interface ImageAnalysisResult {
  propertyType: 'apartment' | 'house' | 'villa';
  location: 'tier1' | 'tier2' | 'tier3' | 'rural';
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
}

export async function getAIHouseAnalysis(data: HouseData, predictedPrice: number) {
  try {
    const prompt = `
      As a real estate expert in the Indian market, analyze this property and provide market insight.
      
      Property Details:
      - Type: ${data.propertyType}
      - Location Category: ${data.location}
      - Condition: ${data.condition}
      
      Our heuristic model predicts a price of ₹${predictedPrice.toLocaleString('en-IN')}.
      
      Please provide:
      1. A brief market sentiment for this type of property in India.
      2. 3 Pros and 3 Cons of this specific configuration.
      3. A "Confidence Score" (0-100) for the heuristic prediction.
      4. Suggestions to increase the property value in the Indian context.
      
      Format the response as a clean JSON object with keys: "sentiment", "pros", "cons", "confidence", "suggestions".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}

export async function analyzeHouseImage(base64Image: string, mimeType: string): Promise<ImageAnalysisResult | null> {
  try {
    const prompt = `
      Analyze this image of a house in India and estimate its key features for a real estate valuation model.
      
      Please estimate:
      1. Property Type: choose from [apartment, house, villa].
      2. Location type: choose from [tier1, tier2, tier3, rural].
      3. Condition: choose from [new, excellent, good, fair, poor].
      4. A brief visual description of the house.

      Return the result as a JSON object.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image.split(',')[1] || base64Image,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            propertyType: { type: Type.STRING, enum: ['apartment', 'house', 'villa'] },
            location: { type: Type.STRING, enum: ['tier1', 'tier2', 'tier3', 'rural'] },
            condition: { type: Type.STRING, enum: ['new', 'excellent', 'good', 'fair', 'poor'] },
            description: { type: Type.STRING }
          },
          required: ["propertyType", "location", "condition", "description"]
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as ImageAnalysisResult;
  } catch (error) {
    console.error("Image analysis failed:", error);
    return null;
  }
}
