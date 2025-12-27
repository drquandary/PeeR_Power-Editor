
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { JournalStyle, AnalysisIssue, PaperStats, ChatMessage, RelatedPaper, CitationPlacement } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

const MODEL_COMPLEX = "gemini-3-pro-preview";
const MODEL_FAST = "gemini-3-flash-preview";

export const suggestCitations = async (text: string): Promise<{ 
  citationMarker: string, 
  references: string[],
  relatedPapers: RelatedPaper[]
}> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Task: Identify supporting academic research for the specific statement provided below.
    
    CRITICAL INSTRUCTION: 
    1. Do NOT return or rewrite the original text.
    2. Return a primary in-text citation marker.
    3. Provide the full bibliographic reference.
    4. SUGGEST 2-3 additional RELATED academic papers. For each, include its appropriate in-text citation marker.

    STATEMENT TO ANALYZE: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          citationMarker: { type: Type.STRING },
          references: { type: Type.ARRAY, items: { type: Type.STRING } },
          relatedPapers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                authors: { type: Type.STRING },
                year: { type: Type.STRING },
                relevance: { type: Type.STRING },
                fullReference: { type: Type.STRING },
                citationMarker: { type: Type.STRING, description: "The (Author, Year) format for this specific paper." }
              },
              required: ["id", "title", "authors", "year", "relevance", "fullReference", "citationMarker"]
            }
          }
        },
        required: ["citationMarker", "references", "relatedPapers"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return {
      citationMarker: data.citationMarker || "",
      references: data.references || [],
      relatedPapers: data.relatedPapers || []
    };
  } catch (e) {
    console.error("Failed to parse citation JSON", e);
    return { citationMarker: "", references: [], relatedPapers: [] };
  }
};

export const findCitationPlacements = async (paper: RelatedPaper, documentText: string): Promise<CitationPlacement[]> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Task: Scan the provided academic document and find 2-3 specific sentences where the following research paper could be cited to strengthen the argument or provide evidence.
    
    RESEARCH PAPER: "${paper.title}" by ${paper.authors} (${paper.year})
    PAPER SUMMARY: ${paper.relevance}

    DOCUMENT:
    ${documentText.substring(0, 20000)}`, // Truncated for safety
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            snippet: { type: Type.STRING, description: "The exact sentence from the document." },
            explanation: { type: Type.STRING, description: "Why citing the research here is beneficial." },
            sectionId: { type: Type.STRING, description: "Internal placeholder (ignore)." }
          },
          required: ["snippet", "explanation"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const microEdit = async (text: string, instruction: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Instruction: ${instruction}\n\nTarget Text: "${text}"\n\nReturn ONLY the revised text.`,
  });
  return response.text || text;
};

export const humanizeText = async (text: string, style: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: `Task: Rewrite the following academic text to sound more human and less like an AI.

    Style Target: ${style}

    Directives:
    1. Vary sentence length significantly. Mix short, punchy sentences with longer, complex ones.
    2. Remove common "AI-isms" and cliché transition words (e.g., "In conclusion," "It is important to note," "delve," "tapestry," "landscape," "foster").
    3. Use active voice where appropriate.
    4. Ensure the academic meaning remains precise but the flow is more natural and engaging.
    5. Do NOT output markdown code blocks. Just return the text.

    TEXT: "${text}"`,
  });
  return response.text || text;
};

export const anonymizeContent = async (text: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Task: Anonymize the following academic paper for double-blind peer review.

    Directives:
    1. Replace all author names with "[BLINDED AUTHOR]".
    2. Replace all institutional affiliations with "[BLINDED INSTITUTION]".
    3. Replace specific self-citations (e.g., "In our previous work [12]...") with "[BLINDED CITATION]".
    4. Remove any Acknowledgments section entirely or replace content with "[BLINDED FOR REVIEW]".
    5. Keep the rest of the text exactly as is.

    TEXT: "${text}"`,
  });
  return response.text || text;
};

export const checkConsistency = async (text: string): Promise<any> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Analyze the provided text for consistency issues. Return a JSON object.

    Checks to perform:
    1. Acronyms: Are any acronyms used without being defined first?
    2. Spelling: Is there a mix of US and UK English? (e.g., 'color' vs 'colour').
    3. Citations: Are there in-text citations missing from the reference list or vice-versa?

    Output Schema:
    {
      "issues": [
        { "id": "string", "type": "warning" | "error", "title": "string", "description": "string", "suggestion": "string" }
      ],
      "generalFeedback": "string"
    }

    TEXT: "${text.substring(0, 25000)}"` ,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const generateCoverLetter = async (text: string, journal: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: `Task: Write a professional cover letter for submitting this paper to ${journal}.

    Include:
    1. Standard cover letter formatting (Dear Editor...).
    2. A compelling "pitch" of why this research is novel and fits the journal.
    3. Confirmation that the work is original and not under review elsewhere.
    4. Suggest 3 potential reviewers (fictional names or [Insert Name]).

    PAPER CONTENT: "${text.substring(0, 10000)}..."`,
  });
  return response.text || "";
};

export const analyzeDeAI = async (text: string): Promise<any> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: `Act as an expert AI Detection System. Analyze the following academic text for "hallmarks of LLM generation".

    Look specifically for:
    1. Uniform sentence length and structure (lack of "burstiness").
    2. Overuse of transition words (e.g., "Moreover," "Furthermore," "In conclusion").
    3. Specific "AI-vocabulary" (e.g., "delve," "tapestry," "paramount," "underscores," "leverage").
    4. Vague generalizations instead of specific evidence.

    Return a JSON object with:
    - stats: { wordCount, aiProbabilityScore (0-100), readabilityScore }
    - issues: Array of { id, type: 'warning'|'error', title, description, suggestion, snippet, replacement }
      (For the issues, identify SPECIFIC sentences or phrases that sound robotic and suggest a "humanized" alternative.)
    - generalFeedback: string (Detailed assessment of the "voice" of the paper.)
    
    TEXT: "${text}"`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const performJournalReview = async (text: string, journal: JournalStyle): Promise<any> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: `Simulate a peer reviewer for ${journal}. Critically evaluate the following text. Return a JSON object with:
    - issues: Array of { id, type: 'error'|'warning', title, description, suggestion }
    - feedback: string
    
    TEXT: "${text}"`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const checkFormatting = async (text: string, journal: JournalStyle): Promise<any> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: `Check compliance with ${journal} style. Return JSON with issues array and generalFeedback.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const reorganizePaper = async (text: string, journal: JournalStyle): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: `Suggest a structural reorganization of this paper for ${journal}. Describe the plan.`,
  });
  return response.text || "No suggestions.";
};

export const agentChat = async (
  message: string, 
  history: ChatMessage[], 
  documentText: string,
  journal: JournalStyle
): Promise<{ content: string, proposals: AnalysisIssue[] }> => {
  const ai = getClient();
  const context = documentText.substring(0, 30000); 
  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: `Document Context: ${context}\n\nUser Question: ${message}`,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING },
                proposals: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            snippet: { type: Type.STRING },
                            replacement: { type: Type.STRING }
                        }
                    }
                }
            }
        }
    }
  });
  return JSON.parse(response.text || "{}");
};
