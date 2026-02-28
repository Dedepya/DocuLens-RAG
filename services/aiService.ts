import { DocumentAnalysis } from "../types";

const API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) {
    throw new Error("OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.");
  }
  return key;
}

async function callOpenAI(messages: object[], jsonMode = false): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode && { response_format: { type: "json_object" } }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response content from AI");
  return content;
}

export async function analyzeDocument(input: {
  base64?: string;
  textContent?: string;
  mimeType: string;
}): Promise<DocumentAnalysis> {
  const systemPrompt = `You are DocuLens, an expert document analysis assistant. 
Analyze the provided document and return a JSON object with these exact fields:
- summary: A clear, concise summary of the document
- documentType: The type of document (e.g. Invoice, Contract, Research Paper, Receipt, Note)
- kvPairs: An array of { key, value } objects for important data points found in the document
- rawText: The main textual content extracted from the document

Always return valid JSON. Be thorough but accurate.`;

  let userContent: object[];

  if (input.base64 && input.mimeType.startsWith("image/")) {
    userContent = [
      {
        type: "image_url",
        image_url: {
          url: `data:${input.mimeType};base64,${input.base64}`,
          detail: "high",
        },
      },
      {
        type: "text",
        text: "Analyze this document image and return the JSON response as instructed.",
      },
    ];
  } else if (input.textContent) {
    userContent = [
      {
        type: "text",
        text: `Here is the content of a document (${input.mimeType}):\n\n${input.textContent}\n\nAnalyze this and return the JSON response as instructed.`,
      },
    ];
  } else if (input.base64) {
    // PDF or other binary — send as text note
    userContent = [
      {
        type: "text",
        text: `A ${input.mimeType} file was uploaded. Based on what you can infer, return a best-effort JSON analysis as instructed. Note that the file is a binary document.`,
      },
    ];
  } else {
    throw new Error("No content provided for analysis.");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  const raw = await callOpenAI(messages, true);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Failed to parse AI response as JSON.");
  }

  // Build keyEntities record from the kvPairs array
  const keyEntities: Record<string, string | number | boolean> = {};
  if (Array.isArray(parsed.kvPairs)) {
    for (const item of parsed.kvPairs) {
      if (item.key) {
        keyEntities[item.key] = item.value ?? "";
      }
    }
  }

  return {
    summary: parsed.summary ?? "No summary available.",
    documentType: parsed.documentType ?? "Unknown",
    keyEntities,
    rawText: parsed.rawText ?? "",
  };
}

export class DocumentChatSession {
  private history: { role: string; content: any }[] = [];
  private documentContext: object;

  constructor(input: { base64?: string; textContent?: string; mimeType: string }) {
    if (input.base64 && input.mimeType.startsWith("image/")) {
      this.documentContext = {
        type: "image_url",
        image_url: {
          url: `data:${input.mimeType};base64,${input.base64}`,
          detail: "high",
        },
      };
    } else if (input.textContent) {
      this.documentContext = {
        type: "text",
        text: `Document context:\n\n${input.textContent}`,
      };
    } else {
      this.documentContext = {
        type: "text",
        text: `A ${input.mimeType} document was uploaded by the user.`,
      };
    }

    this.history.push({
      role: "system",
      content:
        "You are a helpful assistant that answers questions about a document provided by the user. Be accurate, concise, and base your answers on the document content.",
    });
  }

  async sendMessage(userMessage: string): Promise<string> {
    // On the first user message, attach the document context alongside the question
    const isFirstMessage = this.history.length === 1;

    const userContent = isFirstMessage
      ? [this.documentContext, { type: "text", text: userMessage }]
      : userMessage;

    this.history.push({ role: "user", content: userContent });

    const reply = await callOpenAI(this.history);

    this.history.push({ role: "assistant", content: reply });

    return reply;
  }
}
