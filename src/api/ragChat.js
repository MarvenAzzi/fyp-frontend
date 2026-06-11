import { fetch as expoFetch } from "expo/fetch";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const API = process.env.EXPO_PUBLIC_RAG_API_URL;

function dispatch(eventName, dataStr, onEvent) {
  let data;
  try {
    data = dataStr ? JSON.parse(dataStr) : null;
  } catch (_) {
    data = dataStr;
  }
  const d = data ?? {};

  if (eventName === "progress") {
    onEvent({ type: "progress", node: d.node ?? "" });
  } else if (eventName === "interrupt") {
    onEvent({
      type: "interrupt",
      kind: d.type === "consent" ? "consent" : "question",
      question: d.question ?? "",
    });
  } else if (eventName === "result") {
    onEvent({ type: "result", data });
  }
}

async function stream(url, body, handlers) {
  const ctrl = new AbortController();
  let terminal = false;

  try {
    await fetchEventSource(url, {
      fetch: expoFetch,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      openWhenHidden: true,

      async onopen(res) {
        const tid = res.headers.get("x-thread-id");
        if (tid) handlers.onThread?.(tid);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      },

      onmessage(msg) {
        if (!msg.event) return;
        dispatch(msg.event, msg.data, handlers.onEvent);

        if (msg.event === "interrupt" || msg.event === "result") {
          terminal = true;
          ctrl.abort();
        }
      },

      onerror(err) {
        throw err;
      },
    });
  } catch (err) {
    const aborted = terminal || err?.name === "AbortError";
    if (!aborted) handlers.onError?.(err);
  }
}

export function startDiagnose(message, handlers) {
  return stream(`${API}/diagnose`, { message }, handlers);
}

export function resumeDiagnose(threadId, answer, handlers) {
  return stream(`${API}/diagnose/${threadId}/resume`, { answer }, handlers);
}
