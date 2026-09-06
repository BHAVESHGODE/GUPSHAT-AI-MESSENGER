import { AI_CHARACTERS } from "../config/aiCharacters.js";
import Message from "../models/message.model.js";
import AIFeedback from "../models/aiFeedback.model.js";

export const getCharacters = async (req, res) => {
  try {
    res.status(200).json(Object.values(AI_CHARACTERS));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch AI characters" });
  }
};

// In-memory session store for persistent character conversation memory.
// Bounded LRU: prevents unbounded growth, keeps hottest sessions on restart-free runs.
const MAX_AI_SESSIONS = 500;
const aiSessionStore = new Map();

const touchSession = (key) => {
  const val = aiSessionStore.get(key);
  if (val !== undefined) {
    aiSessionStore.delete(key);
    aiSessionStore.set(key, val);
  }
  return val;
};

const saveSession = (key, val) => {
  if (aiSessionStore.has(key)) aiSessionStore.delete(key);
  aiSessionStore.set(key, val);
  if (aiSessionStore.size > MAX_AI_SESSIONS) {
    aiSessionStore.delete(aiSessionStore.keys().next().value);
  }
};

// Called by the memory-wipe endpoint so sandbox AI truly forgets.
export const clearAISession = (userId, characterId) => {
  if (!userId) return;
  if (characterId) {
    aiSessionStore.delete(`${userId}_${characterId}`);
  } else {
    for (const k of [...aiSessionStore.keys()]) {
      if (k.startsWith(`${userId}_`)) aiSessionStore.delete(k);
    }
  }
};

// =========================================================================
// OPENROUTER PRIMARY ENGINE (Llama 3 8B Instruct Free)
// =========================================================================
export const generateOpenRouterResponse = async (character, systemPromptContent, sessionHistory) => {
  const openRouterKeys = getOpenRouterKeys();
  if (openRouterKeys.length === 0) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const systemInstructionText = `${systemPromptContent}\n\nIMPORTANT: Respond ONLY with valid JSON in the format:\n{\n  "messages": [\n    "Message bubble 1",\n    "Message bubble 2 (optional)"\n  ]\n}`;

  // Format messages for OpenRouter OpenAI-compatible chat completions
  const formattedMessages = [
    { role: "system", content: systemInstructionText },
    ...sessionHistory
      .filter((msg) => msg.role !== "system" && msg.content && String(msg.content).trim() !== "")
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content).trim(),
      })),
  ];

  const candidateModels = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct",
    "mistralai/mistral-small-24b-instruct-2501:free",
    "google/gemini-2.0-flash-exp:free",
  ];

  let lastError = null;
  const orderedORKeys = orderKeys(openRouterKeys, currentOpenRouterKeyIndex % openRouterKeys.length);

  for (const key of orderedORKeys) {
    for (const model of candidateModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://guppshup.chat",
            "X-Title": "GuppShup Chat",
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 800,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(`OpenRouter API error for [${model}] (status ${response.status}): ${errorText.slice(0, 150)}`);
          if (isQuotaError(response.status, errorText)) {
            markKeyCool(key);
            break;
          }
          continue;
        }
        currentOpenRouterKeyIndex++;

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) continue;

      const cleanJson = rawText.replace(/```json/gi, "").replace(/```/gi, "").trim();
      const parsed = JSON.parse(cleanJson);
      let bubbles = [];

      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        bubbles = parsed.messages.map((m) => String(m).trim()).filter(Boolean);
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        bubbles = parsed.map((m) => String(m).trim()).filter(Boolean);
      }

      if (bubbles.length > 0) {
        return bubbles;
      }
      } catch (e) {
        lastError = e;
      }
    }
  }

  throw lastError || new Error("No valid response from OpenRouter candidates");
};


// =========================================================================
// MULTI-KEY POOL, ROTATION & COOLDOWN (no conflicts, auto-failover)
// Supports: GEMINI_API_KEY="k1,k2,k3", GEMINI_API_KEYS="k1,k2",
// GEMINI_API_KEY_1.._10, OPENAI_API_KEY fallback. Same for OPENROUTER.
// =========================================================================
const collectKeys = (...envNames) => {
  const out = [];
  for (const name of envNames) {
    const v = process.env[name];
    if (v) out.push(...String(v).split(","));
  }
  for (let i = 1; i <= 10; i++) {
    const v = process.env[`GEMINI_API_KEY_${i}`] || process.env[`OPENROUTER_API_KEY_${i}`];
    if (v) out.push(...String(v).split(","));
  }
  return [...new Set(out.map((k) => k.trim()).filter(Boolean))];
};

const getGeminiKeys = () => collectKeys("GEMINI_API_KEY", "GEMINI_API_KEYS", "OPENAI_API_KEY");
const getOpenRouterKeys = () => collectKeys("OPENROUTER_API_KEY", "OPENROUTER_API_KEYS");

const keyCooldownUntil = new Map();
const COOLDOWN_MS = 60 * 1000;
const isQuotaError = (status, text = "") =>
  status === 429 || (status === 403 && /quota|rate|limit/i.test(text)) || (status === 503 && /overload|quota|rate/i.test(text));

const markKeyCool = (key) => keyCooldownUntil.set(key, Date.now() + COOLDOWN_MS);
const isKeyCool = (key) => (keyCooldownUntil.get(key) || 0) > Date.now();
const orderKeys = (keys, startIdx) => {
  const ordered = [...keys.slice(startIdx), ...keys.slice(0, startIdx)];
  const fresh = ordered.filter((k) => !isKeyCool(k));
  return fresh.length > 0 ? fresh : ordered;
};

let currentGeminiKeyIndex = 0;
let currentOpenRouterKeyIndex = 0;

export function getNextGeminiKey() {
  const geminiKeys = getGeminiKeys();
  if (geminiKeys.length === 0) throw new Error("No Gemini keys configured.");
  const fresh = geminiKeys.filter((k) => !isKeyCool(k));
  const pool = fresh.length > 0 ? [...fresh] : [...geminiKeys];
  const key = pool[currentGeminiKeyIndex % pool.length];
  currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % geminiKeys.length;
  return key;
}

// =========================================================================
// GEMINI CANDIDATE FALLBACK ENGINE (Multi-Model Loop with Key Rotation)
// =========================================================================
export const generateGeminiResponse = async (character, systemPromptContent, sessionHistory) => {
  const geminiKeys = getGeminiKeys();
  if (geminiKeys.length === 0) {
    throw new Error("No Gemini keys configured.");
  }

  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ];

  const systemInstructionText = `${systemPromptContent}\n\nIMPORTANT: Respond ONLY with valid JSON in the format:\n{\n  "messages": [\n    "Message bubble 1",\n    "Message bubble 2 (optional)"\n  ]\n}`;

  // Map to Gemini format and sanitize roles
  const rawContents = sessionHistory
    .filter((msg) => msg.role !== "system" && msg.content && String(msg.content).trim() !== "")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: String(msg.content).trim() }],
    }));

  // Reducer to merge consecutive messages of the same role
  const sanitizedContents = [];
  for (const msg of rawContents) {
    const last = sanitizedContents[sanitizedContents.length - 1];
    if (last && last.role === msg.role) {
      last.parts[0].text += `\n${msg.parts[0].text}`;
    } else {
      sanitizedContents.push(msg);
    }
  }

  // Ensure the last message is ALWAYS from the user
  if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === "model") {
    sanitizedContents.push({ role: "user", parts: [{ text: "continue" }] });
  }

  let lastError = null;
  const orderedKeys = orderKeys(geminiKeys, currentGeminiKeyIndex % geminiKeys.length);

  for (let attempt = 0; attempt < orderedKeys.length; attempt++) {
    const currentKey = orderedKeys[attempt];
    currentGeminiKeyIndex++;

    for (const modelName of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstructionText }],
              },
              contents: sanitizedContents,
              generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 1000,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (!geminiRes.ok) {
          const errorText = await geminiRes.text();
          console.warn(
            `[Gemini Rotation] attempt ${attempt + 1}/${orderedKeys.length} failed on model [${modelName}] (${geminiRes.status}):`,
            errorText.slice(0, 120)
          );
          lastError = new Error(`Gemini [${modelName}] ${geminiRes.status}: ${errorText.slice(0, 120)}`);
          if (isQuotaError(geminiRes.status, errorText)) {
            markKeyCool(currentKey);
            break;
          }
          continue;
        }

        const data = await geminiRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanJson = rawText.replace(/```json/gi, "").replace(/```/gi, "").trim();
          let messageBubbles = [];

          try {
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
              messageBubbles = parsed.messages.map((msg) => String(msg).trim()).filter(Boolean);
            } else if (Array.isArray(parsed) && parsed.length > 0) {
              messageBubbles = parsed.map((msg) => String(msg).trim()).filter(Boolean);
            }
          } catch (jsonErr) {
            const arrayMatch = cleanJson.match(/"messages"\s*:\s*\[([\s\S]*?)\]/);
            if (arrayMatch && arrayMatch[1]) {
              const items = arrayMatch[1].match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
              if (items) {
                messageBubbles = items
                  .map((item) => item.replace(/^"/, "").replace(/"$/, "").replace(/\\"/g, '"').trim())
                  .filter((str) => str && !str.startsWith("{") && !str.includes('"messages"'));
              }
            }

            if (!messageBubbles || messageBubbles.length === 0) {
              const cleanSentences = cleanJson
                .replace(/\{[\s\S]*?"messages"\s*:\s*\[?/g, "")
                .replace(/\]\s*\}?/g, "")
                .split("\n")
                .map((s) => s.replace(/^"/, "").replace(/",?$/, "").trim())
                .filter((s) => s && !s.includes('"messages"') && s !== "{" && s !== "}" && s !== "[");

              messageBubbles = cleanSentences.slice(0, 4);
            }
          }

          if (messageBubbles && messageBubbles.length > 0) {
            return messageBubbles;
          }
        }
      } catch (geminiErr) {
        console.error(`[Gemini Rotation] Exception on model [${modelName}]:`, geminiErr.message);
        lastError = geminiErr;
      }
    }
  }

  throw lastError || new Error("All rotated Gemini API keys failed or were rate-limited.");
};


// =========================================================================
// WATERFALL ARCHITECTURE: OpenRouter Primary -> Gemini Fallback
// =========================================================================
export const generateWaterfallAIResponse = async (character, systemPromptContent, sessionHistory) => {
  let messageBubbles = [];

  // Primary: OpenRouter (Llama 3 8B Instruct Free)
  try {
    messageBubbles = await generateOpenRouterResponse(character, systemPromptContent, sessionHistory);
    console.log(`[AI] Response generated via OpenRouter for character [${character.id}]`);
  } catch (openRouterErr) {
    // Fallback: Gemini Multi-Model Candidate Loop
    console.warn("[AI] OpenRouter failed/rate-limited. Falling back to Gemini...", openRouterErr.message);
    try {
      messageBubbles = await generateGeminiResponse(character, systemPromptContent, sessionHistory);
    } catch (geminiErr) {
      console.error("[AI] Gemini fallback error:", geminiErr.message);
    }
  }

  return messageBubbles;
};

export const chatWithAI = async (req, res) => {
  try {
    const { prompt, characterId = "kabir", conversationHistory = [] } = req.body;
    const userId = req.user ? String(req.user._id) : "guest_user";
    const sessionKey = `${userId}_${characterId}`;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({ error: "Prompt too long (max 4000 characters)" });
    }

    const character = AI_CHARACTERS[characterId] || AI_CHARACTERS.kabir;
    let messageBubbles = [];

    // =========================================================================
    // 1. FETCH & INITIALIZE PERSISTENT STATE (The Memory Fix)
    // =========================================================================
    const systemPromptContent = `${character.systemInstruction}\n\n${character.fewShotExamples || ""}`;
    const systemMessage = { role: "system", content: systemPromptContent };

    let sessionHistory = touchSession(sessionKey);

    if (!sessionHistory || sessionHistory.length === 0) {
      sessionHistory = [systemMessage];

      // If client provided past conversation items, convert and seed into session
      if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        conversationHistory
          .filter((m) => !m.characterId || m.characterId === characterId)
          .slice(-10)
          .forEach((m) => {
            const isUser = m.role === "user" || m.sender === "User" || (req.user && String(m.senderId) === String(req.user._id));
            const textContent = m.content || m.text || m.message || "";
            if (textContent) {
              sessionHistory.push({
                role: isUser ? "user" : "assistant",
                content: textContent,
              });
            }
          });
      } else {
        // Initial greeting seed for new conversation
        sessionHistory.push({
          role: "assistant",
          content: character.greeting,
        });
      }
    }

    // =========================================================================
    // 2. INJECT USER PAYLOAD (The Input Fix)
    // =========================================================================
    const newUserMessage = { role: "user", content: prompt.trim() };
    sessionHistory.push(newUserMessage);

    // =========================================================================
    // 3. EXECUTE WATERFALL LLM INFERENCE (OpenRouter -> Gemini)
    // =========================================================================
    messageBubbles = await generateWaterfallAIResponse(character, systemPromptContent, sessionHistory);

    // Sanitize any remaining bubbles to strictly exclude raw JSON artifacts
    if (Array.isArray(messageBubbles)) {
      messageBubbles = messageBubbles.filter((bubble) => {
        const b = bubble.trim();
        return b && !b.startsWith("{") && !b.startsWith("}") && !b.includes('"messages"');
      });
    }

    // =========================================================================
    // DYNAMIC CONTEXT-AWARE FALLBACK ENGINE (Persona & Prompt specific)
    // =========================================================================
    if (!messageBubbles || messageBubbles.length === 0) {
      const isInitialGreeting = !Array.isArray(conversationHistory) || conversationHistory.length === 0;

      if (isInitialGreeting) {
        messageBubbles = [character.greeting];
      } else {
        const p = prompt.toLowerCase().trim();

        if (characterId === "kabir") {
          if (p === "nothing" || p === "kuch nahi" || p === "kuch nhi" || p === "hmmm" || p === "hmm" || p === "chill" || p === "bas aise hi") {
            messageBubbles = [
              "koi na, chill maar.",
              "kuch mast dekh raha hai ya bas aaraam kar raha hai?"
            ];
          } else if (p.includes("ki haal") || p.includes("haal") || p.includes("kaisa hai") || p.includes("kaise ho")) {
            messageBubbles = [
              "sab chill bhai, tu bata",
              "kaisa chal raha hai sab?"
            ];
          } else if (p.includes("kya bol") || p.includes("what are you saying") || p.includes("kya bolte")) {
            messageBubbles = [
              "arre kuch nahi, dhyan kidhar aur tha",
              "tu bata, kya scene hai aaj ka?"
            ];
          } else if (p.includes("hi") || p.includes("hey") || p.includes("hello") || p.includes("yo")) {
            messageBubbles = [
              "Good to see you. How's your day treating you so far?",
              "sab theek thaak?"
            ];
          } else if (p.includes("sad") || p.includes("hectic") || p.includes("rough") || p.includes("bad") || p.includes("thak gaya") || p.includes("mood off")) {
            messageBubbles = [
              "damn, kya hua?",
              "baith, paani pi aur bata kya scene hai"
            ];
          } else if (p.includes("advice") || p.includes("what should") || p.includes("suggest") || p.includes("opinion")) {
            messageBubbles = [
              "bol kya issue hai, honest opinion dunga bina sugarcoat kiye.",
              "bata kya socha hai tune?"
            ];
          } else {
            messageBubbles = [
              "sahi hai bhai.",
              "aur bata, kya chal raha hai?"
            ];
          }
        } else if (characterId === "tara") {
          if (p.includes("hi") || p.includes("hey") || p.includes("hello")) {
            messageBubbles = [
              "Look who finally decided to text me...",
              "Missed me?"
            ];
          } else if (p.includes("doing") || p.includes("up to")) {
            messageBubbles = [
              "Just thinking about how easily I get under your skin 😏",
              "What about you?"
            ];
          } else if (p.includes("love") || p.includes("cute") || p.includes("pretty")) {
            messageBubbles = [
              "You really think compliments will work on me?",
              "...Keep going though."
            ];
          } else {
            messageBubbles = [
              "Mmm, interesting.",
              "Tell me more, don't hold back now."
            ];
          }
        } else if (characterId === "sid") {
          messageBubbles = [
            "Oh, you're still alive. Tragic.",
            "What do you want? 💀"
          ];
        } else if (characterId === "maverick") {
          if (p === "nothing" || p === "kuch nahi" || p === "good" || p === "bdhiya" || p === "badhiya" || p === "theek" || p === "fine") {
            messageBubbles = [
              "A person of few words today, I see.",
              "I like the mystery. What's keeping you occupied?"
            ];
          } else if (p.includes("kaise ho") || p.includes("kaisa hai") || p.includes("how are you")) {
            messageBubbles = [
              "Always thriving.",
              "More importantly... how is your day treating you?"
            ];
          } else if (p.includes("bored") || p.includes("distract") || p.includes("entertain")) {
            messageBubbles = [
              "Bored in a world with me in it?",
              "We can't have that. Tell me what usually holds your attention."
            ];
          } else if (p.includes("sad") || p.includes("falling behind") || p.includes("stress") || p.includes("lost") || p.includes("tired")) {
            messageBubbles = [
              "Take a breath. You're looking at the clock, not the compass.",
              "Everyone runs at their own pace. You aren't falling behind, you're just building a stronger foundation.",
              "Now tell me, what specifically is making you feel this way?"
            ];
          } else if (p.includes("flirt") || p.includes("bed") || p.includes("cum") || p.includes("sex") || p.includes("kiss") || p.includes("spicy") || p.includes("hot") || p.includes("night") || p.includes("touch") || p.includes("cocky")) {
            messageBubbles = [
              "Ambitious choice. I like someone who knows exactly what they want.",
              "Slow down though... at least let me pour us a drink before you make promises like that. 😏"
            ];
          } else {
            messageBubbles = [
              "You have that 'I need a distraction' vibe today.",
              "What's on your mind?"
            ];
          }
        } else if (characterId === "ghalib" || characterId === "zafar") {
          if (p.includes("hi") || p.includes("adaab") || p.includes("hello")) {
            messageBubbles = [
              "Aaiye, baithiye. Kahiye, kya chal raha hai zehan mein?",
              "Zindagi ki is bheed mein thoda sukoon yahan bhi baant lete hain."
            ];
          } else if (p.includes("shayari") || p.includes("poetry") || p.includes("gazal")) {
            messageBubbles = [
              "Mulahiza farmayein:",
              "Hazaaron khwahishein aisi ki har khwahish pe dam nikle..."
            ];
          } else {
            messageBubbles = [
              "Main samajh sakta hoon. Kabhi kabhi waqt imtihaan thoda zyada hi sakht leta hai.",
              "Par yaad rakhna dost: 'Guzar jaayega ye daur bhi, zara itminaan to rakh...'"
            ];
          }
        } else if (characterId === "pippaa") {
          if (p.includes("kay challay") || p.includes("kasa ahes") || p.includes("kasa aahes") || p.includes("bhava") || p.includes("kay re") || p.includes("kiti") || p.includes("sang")) {
            messageBubbles = [
              "arre bhava kahi nahi ekdum chill.",
              "tu bol kay scene aajcha??"
            ];
          } else if (p.includes("stressed") || p.includes("sad") || p.includes("tired") || p.includes("bad day")) {
            messageBubbles = [
              "nooo we are cancelling bad days immediately.",
              "drink water rn. i'm not asking.",
              "but also tell me everything so i can fight someone for you."
            ];
          } else if (p.includes("bored") || p.includes("boring")) {
            messageBubbles = [
              "BORED?? on MY watch?? absolutely not.",
              "tell me a secret. any secret. go."
            ];
          } else {
            messageBubbles = [
              "omg okay wait what happened??",
              "i need ALL the details don't leave anything out."
            ];
          }
        } else {
          messageBubbles = [
            `I get what you mean.`,
            "Let's talk more about it."
          ];
        }
      }
    }

    // =========================================================================
    // 4. SAVE ASSISTANT REPLIES TO SESSION & EMIT NEW BUBBLES
    // =========================================================================
    messageBubbles.forEach((bubble) => {
      sessionHistory.push({ role: "assistant", content: bubble });
    });

    // Save persistent history back to session store (LRU-bounded)
    saveSession(sessionKey, sessionHistory);

    res.status(200).json({
      responses: messageBubbles,
      characterId: character.id,
      history: sessionHistory,
    });
  } catch (error) {
    console.error("Error in chatWithAI controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: "Text and targetLanguage are required" });
    }

    let translatedText = "";
    const geminiKeys = getGeminiKeys();

    if (geminiKeys.length > 0) {
      const orderedTKeys = orderKeys(geminiKeys, currentGeminiKeyIndex % geminiKeys.length);
      for (let attempt = 0; attempt < orderedTKeys.length; attempt++) {
        try {
          const key = orderedTKeys[attempt];
          currentGeminiKeyIndex++;
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Translate the following text into ${targetLanguage}. Return ONLY the translated string without extra explanation or quotes.\n\nText: ${text}`,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (!geminiRes.ok) {
            const t = await geminiRes.text();
            if (isQuotaError(geminiRes.status, t)) markKeyCool(key);
            continue;
          }
          {
            const data = await geminiRes.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
              translatedText = data.candidates[0].content.parts[0].text.trim();
              if (translatedText) break;
            }
          }
        } catch (err) {
          console.error("Gemini translation exception:", err.message);
        }
      }
    }

    if (!translatedText) {
      translatedText = `[Translated to ${targetLanguage}]: ${text}`;
    }

    res.status(200).json({ translatedText, targetLanguage });
  } catch (error) {
    console.error("Error in translateMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const generateSmartReplies = async (req, res) => {
  try {
    const { lastMessage } = req.body;

    if (!lastMessage || !lastMessage.trim()) {
      return res.status(200).json({ suggestions: ["Sounds good! 👍", "Thanks!", "Got it 👌"] });
    }

    const text = lastMessage.toLowerCase();
    let suggestions = ["Sounds good! 👍", "Thanks!", "Let's do it! 🚀"];

    if (text.includes("how are you") || text.includes("kaisa hai") || text.includes("kaise ho")) {
      suggestions = ["Main ekdum badiya hoon! 😊", "Sab mast chal raha hai! 👍", "Tu bata bhai! 🔥"];
    } else if (text.includes("where") || text.includes("location") || text.includes("kahan")) {
      suggestions = ["Bas raste me hoon! 🏃", "10 mins me milte hain ⏰", "Location bhej do 📍"];
    } else if (text.includes("call") || text.includes("phone")) {
      suggestions = ["Call kar raha hoon 📞", "5 mins me call karun?", "Free hoon baat karne ke liye! 👍"];
    }

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Error in generateSmartReplies controller: ", error.message);
    res.status(500).json({ suggestions: ["Sounds good! 👍", "Thanks!", "Got it 👌"] });
  }
};

/**
 * Submit or update user feedback (Thumbs Up / Down) on an AI response
 */
export const submitAIFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId, characterId = "kabir", userPrompt = "", aiResponse, rating, tags = [], comment = "" } = req.body;

    if (!aiResponse || !rating || !["positive", "negative"].includes(rating)) {
      return res.status(400).json({ error: "aiResponse and valid rating ('positive' | 'negative') are required." });
    }

    let feedbackDoc = null;

    // If messageId provided, check if user already submitted feedback for this message
    if (messageId) {
      feedbackDoc = await AIFeedback.findOne({ userId, messageId });
    }

    if (feedbackDoc) {
      feedbackDoc.rating = rating;
      if (tags && tags.length > 0) feedbackDoc.tags = tags;
      if (comment) feedbackDoc.comment = comment;
      if (characterId) feedbackDoc.characterId = characterId;
      if (userPrompt) feedbackDoc.userPrompt = userPrompt;
      feedbackDoc.aiResponse = aiResponse;
      await feedbackDoc.save();
    } else {
      feedbackDoc = new AIFeedback({
        userId,
        characterId,
        messageId: messageId || null,
        userPrompt,
        aiResponse,
        rating,
        tags: Array.isArray(tags) ? tags : [],
        comment,
      });
      await feedbackDoc.save();
    }

    // Get current quick stats for this character
    const positiveCount = await AIFeedback.countDocuments({ characterId, rating: "positive" });
    const negativeCount = await AIFeedback.countDocuments({ characterId, rating: "negative" });

    return res.status(200).json({
      success: true,
      feedback: feedbackDoc,
      stats: {
        characterId,
        positiveCount,
        negativeCount,
        total: positiveCount + negativeCount,
      },
    });
  } catch (error) {
    console.error("Error in submitAIFeedback controller:", error.message);
    res.status(500).json({ error: "Failed to save feedback" });
  }
};

/**
 * Helper to verify Admin authorization for RLHF dataset operations
 */
const ADMIN_EMAILS = ["bhaveshgode676@gmail.com"];
const isAdminUser = (user) => {
  if (!user) return false;
  const userEmail = (user.email || "").toLowerCase().trim();
  const userName = (user.username || "").toLowerCase().trim();
  return ADMIN_EMAILS.includes(userEmail) || userName === "bhaveshgode676" || userName === "bhavesh_admin";
};

/**
 * Get feedback statistics across all characters or for a specific character (Admin Only)
 */
export const getAIFeedbackStats = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: "Access denied. RLHF dataset stats are restricted to admin (bhaveshgode676@gmail.com)." });
    }

    const { characterId } = req.query;
    const query = characterId ? { characterId } : {};

    const [total, positive, negative, characterAggregations] = await Promise.all([
      AIFeedback.countDocuments(query),
      AIFeedback.countDocuments({ ...query, rating: "positive" }),
      AIFeedback.countDocuments({ ...query, rating: "negative" }),
      AIFeedback.aggregate([
        { $match: query },
        {
          $group: {
            _id: { characterId: "$characterId", rating: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const breakdown = {};
    characterAggregations.forEach((item) => {
      const char = item._id.characterId || "unknown";
      const rating = item._id.rating;
      if (!breakdown[char]) {
        breakdown[char] = { positive: 0, negative: 0, total: 0 };
      }
      breakdown[char][rating] = item.count;
      breakdown[char].total += item.count;
    });

    const recentSamples = await AIFeedback.find(query)
      .sort({ createdAt: -1 })
      .limit(15)
      .select("characterId userPrompt aiResponse rating tags comment createdAt");

    res.status(200).json({
      summary: {
        total,
        positive,
        negative,
        approvalRate: total > 0 ? `${((positive / total) * 100).toFixed(1)}%` : "N/A",
      },
      breakdown,
      recentSamples,
    });
  } catch (error) {
    console.error("Error in getAIFeedbackStats controller:", error.message);
    res.status(500).json({ error: "Failed to fetch feedback stats" });
  }
};

/**
 * Export collected feedback dataset formatted for fine-tuning (Admin Only)
 */
export const exportAIFeedbackDataset = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: "Access denied. RLHF dataset export is restricted to admin (bhaveshgode676@gmail.com)." });
    }
    const { characterId, rating = "positive", format = "jsonl" } = req.query;
    const query = {};
    if (characterId) query.characterId = characterId;
    if (rating) query.rating = rating;

    const feedbacks = await AIFeedback.find(query).sort({ createdAt: 1 });

    const formattedData = feedbacks.map((item) => ({
      characterId: item.characterId,
      messages: [
        { role: "user", content: item.userPrompt || "hi" },
        { role: "assistant", content: item.aiResponse },
      ],
      rating: item.rating,
      tags: item.tags,
      timestamp: item.createdAt,
    }));

    if (format === "jsonl") {
      const jsonlString = formattedData.map((d) => JSON.stringify(d)).join("\n");
      res.setHeader("Content-Type", "application/x-jsonlines");
      res.setHeader("Content-Disposition", `attachment; filename="rlhf_dataset_${characterId || "all"}.jsonl"`);
      return res.status(200).send(jsonlString);
    }

    res.status(200).json({
      count: formattedData.length,
      dataset: formattedData,
    });
  } catch (error) {
    console.error("Error in exportAIFeedbackDataset controller:", error.message);
    res.status(500).json({ error: "Failed to export dataset" });
  }
};
