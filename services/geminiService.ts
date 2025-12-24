import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AppIdea, PainPointResult, Source, BuildPlan } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Step 1: Search for pain points using Grounding (Google Search)
 */
export const searchPainPoints = async (topic: string): Promise<PainPointResult> => {
  try {
    const model = 'gemini-3-pro-preview';

    const prompt = `
      You are an expert market researcher. 
      I want you to search the web (focusing on Reddit, IndieHackers, Twitter, and niche forums) for RECENT complaints, struggles, and "pain points" related to the topic: "${topic}".
      
      Look for statements like "I hate when...", "Why is there no app for...", "I wish I could...", or "It's so hard to...".
      
      Provide a concise summary of the 3-5 most significant problems people are currently facing in this niche. 
      Be specific about the problem, not just general advice.

      FORMATTING RULES (IMPORTANT):
      - Use '###' for the Title of each pain point (e.g. ### 1. The Subscription Fatigue).
      - Use '**The Problem:**', '**The Opportunity:**', and '**What users are saying:**' exactly as headers within the text.
      - Use '>' Blockquotes for direct user quotes.
      - Keep sentences clear and avoid excessive bolding within paragraphs.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No results found.";

    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (groundingChunks) {
      groundingChunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Web Result',
            uri: chunk.web.uri || '#'
          });
        }
      });
    }

    return {
      summary: text,
      rawText: text,
      sources: sources
    };

  } catch (error) {
    console.error("Error searching pain points:", error);
    throw new Error("Failed to search for pain points. Please try again.");
  }
};

/**
 * Step 2: Generate App Ideas
 */
export const generateAppIdeas = async (topic: string, painPointsSummary: string): Promise<AppIdea[]> => {
  try {
    const model = 'gemini-3-pro-preview';

    const prompt = `
      You are a brilliant Product Strategist and Micro-SaaS developer.
      
      The user is interested in the niche: "${topic}".
      Based on the following market research regarding user pain points:
      
      "${painPointsSummary}"
      
      Generate 3 distinct, viable, and profitable App or Micro-SaaS ideas that solve these specific problems.
      Focus on MVP-ready ideas.
    `;

    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Catchy name for the app" },
          oneLiner: { type: Type.STRING, description: "A punchy 5-10 word value proposition" },
          problemSolved: { type: Type.STRING, description: "Specifically which pain point this solves" },
          targetAudience: { type: Type.STRING, description: "Who is the primary customer?" },
          coreFeatures: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3-4 key MVP features"
          },
          monetization: { type: Type.STRING, description: "How it makes money (e.g., Subscription, One-time, Ads)" },
          techComplexity: {
            type: Type.STRING,
            enum: ["Low", "Medium", "High"],
            description: "Estimated coding effort"
          }
        },
        required: ["title", "oneLiner", "problemSolved", "targetAudience", "coreFeatures", "monetization", "techComplexity"]
      }
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 1024 }
      },
    });

    if (!response.text) throw new Error("No ideas generated.");

    const ideas = JSON.parse(response.text) as AppIdea[];
    return ideas;

  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Failed to generate app ideas.");
  }
};

/**
 * Step 3: Generate Build Plan (Roadmap, PRD, Vibe Coding Prompt)
 */
export const generateBuildPlan = async (idea: AppIdea): Promise<BuildPlan> => {
  try {
    const model = 'gemini-3-pro-preview';

    const prompt = `
      You are a Senior Product Manager and Technical Lead.
      I need a comprehensive build plan for the following Micro-SaaS idea:

      Title: ${idea.title}
      One Liner: ${idea.oneLiner}
      Core Features: ${idea.coreFeatures.join(', ')}
      Target Audience: ${idea.targetAudience}

      Please provide:
      1. A 4-phase MVP Roadmap (e.g., Planning, Core Dev, Polish/Testing, Launch).
      2. A detailed Product Requirement Document (PRD) in Markdown format. 
         IMPORTANT: Use strict Markdown structure. 
         - Use '#' for the document title.
         - Use '##' for main sections (e.g., Overview, Problem, Solution, Features).
         - Use '###' for subsections.
         - Use bullet points for lists.
         - Do NOT use numbered lists (1., 2.) for main section headers, use '##' instead.
      3. A "Vibe Coding" Starter Prompt. This should be a single, detailed text prompt that I can paste into an AI Coding Assistant (like Cursor, Windsurf, or Bolt) to generate the initial project structure and base code. It should specify the tech stack (React, Tailwind, Node, etc.) and file structure.

      Return the data in JSON format.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        roadmap: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              duration: { type: Type.STRING, description: "Estimated time, e.g., '1 Week'" },
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["phase", "duration", "tasks"]
          }
        },
        prd: { type: Type.STRING, description: "Full PRD in Markdown format with # and ## headers" },
        vibeCodingPrompt: { type: Type.STRING, description: "The AI coder prompt" }
      },
      required: ["roadmap", "prd", "vibeCodingPrompt"]
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (!response.text) throw new Error("No build plan generated.");

    return JSON.parse(response.text) as BuildPlan;

  } catch (error) {
    console.error("Error generating build plan:", error);
    throw new Error("Failed to generate build plan.");
  }
};