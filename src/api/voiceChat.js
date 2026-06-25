const RAG_API = process.env.EXPO_PUBLIC_RAG_API_URL;
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Step 1: send recorded audio to OpenAI Whisper and get back the transcribed text
export async function transcribeAudio(audioUri) {
  const form = new FormData();
  form.append("file", {
    uri: audioUri,
    type: "audio/m4a",
    name: "speech.m4a",
  });
  form.append("model", "whisper-1");
  form.append("language", "en");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Whisper error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.text ?? "").trim();
}

// Step 2a: interactive voice turn — handles new messages AND answers to clarifying questions.
// Returns { type: "question"|"result", thread_id, question?, spoken_text? }
export async function diagnoseVoiceTurn({ message, threadId, answer }) {
  const body = {};
  if (message  !== undefined) body.message   = message;
  if (threadId !== undefined) body.thread_id = threadId;
  if (answer   !== undefined) body.answer    = answer;

  const res = await fetch(`${RAG_API}/diagnose/voice/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Agent error ${res.status}: ${err}`);
  }
  return res.json();
}

// Step 2b (legacy one-shot): send transcribed text to the voice diagnosis endpoint and get human-speakable text
export async function diagnoseVoice(message) {
  const res = await fetch(`${RAG_API}/diagnose/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Agent error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.spoken_text ?? "").trim();
}

// Step 3: ask the backend to synthesize speech and return base64-encoded mp3.
// TTS is done server-side to avoid React Native's broken arrayBuffer() API.
export async function synthesizeSpeech(text) {
  const res = await fetch(`${RAG_API}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`TTS error ${res.status}: ${err}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (_) {
    throw new Error("TTS response was not valid JSON");
  }
  if (!data || !data.audio_base64) {
    throw new Error("TTS returned no audio data");
  }
  return data.audio_base64;
}
