import { GoogleGenAI, Type } from "@google/genai";
import { Keypoint } from "../types";

// Schema for the structured output we want from Gemini to simulate MediaPipe
const POSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    pose_name: {
      type: Type.STRING,
      description: "A descriptive name of the detected pose (e.g., 'Standing', 'Yoga Tree Pose', 'Sitting').",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1.",
    },
    keypoints: {
      type: Type.ARRAY,
      description: "A list of 33 3D keypoints representing body landmarks.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          z: { type: Type.NUMBER },
          visibility: { type: Type.NUMBER },
        }
      }
    }
  },
  required: ["pose_name", "confidence", "keypoints"],
};

export const analyzePoseWithGemini = async (base64Image: string): Promise<{ pose_name: string; confidence: number; keypoints: Keypoint[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this image. Identify the human body pose. Generate a JSON response that simulates a MediaPipe Pose extraction. Return exactly 33 keypoints (nose, shoulders, elbows, wrists, hips, knees, ankles, etc.) with normalized coordinates (x,y 0-1) and z-depth.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: POSE_SCHEMA,
        temperature: 0.2, // Low temperature for consistent structural output
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
