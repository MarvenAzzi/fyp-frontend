import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Audio } from "expo-av";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { startDiagnose, resumeDiagnose } from "./src/api/ragChat";
import { diagnoseVoiceTurn, transcribeAudio } from "./src/api/voiceChat";

let counter = 0;
const newId = () => `m${counter++}`;

// ── Voice phase labels ────────────────────────────────────────────────────────
const VOICE_LABELS = {
  idle: "Tap to speak",
  recording: "Listening…  Tap to stop",
  transcribing: "Transcribing…",
  diagnosing: "Analyzing…",
  answering: "Tap to answer",
  speaking: "Speaking…",
};

// ── Shared metadata ───────────────────────────────────────────────────────────
const NEXT_STEP_META = {
  STOP_NOW: {
    label: "Stop Now",
    blurb: "Pull over safely, don't keep driving — arrange a tow.",
    color: "#ef4444",
    bg: "#fef2f2",
    icon: "alert-circle",
  },
  MECHANIC_ASAP: {
    label: "Mechanic ASAP",
    blurb: "Get it seen as soon as possible; drive minimally.",
    color: "#f97316",
    bg: "#fff7ed",
    icon: "warning",
  },
  BOOK_SOON: {
    label: "Book Soon",
    blurb: "Book a service in the next few days; drive gently.",
    color: "#eab308",
    bg: "#fefce8",
    icon: "calendar",
  },
  MONITOR: {
    label: "Monitor",
    blurb: "Keep an eye on it and note when it happens.",
    color: "#22c55e",
    bg: "#f0fdf4",
    icon: "eye",
  },
};

const SEVERITY_META = {
  Critical: { label: "Critical", color: "#ef4444", bg: "#fef2f2" },
  Warning: { label: "Warning", color: "#f59e0b", bg: "#fffbeb" },
  Info: { label: "Info", color: "#6b7280", bg: "#f9fafb" },
};

const ERROR_TEXT =
  "I couldn't reach Quattro right now. Please check that the AI service is running and try again.";

// ── Candidate (expandable fault code) card ───────────────────────────────────
function CandidateCard({ c }) {
  const [expanded, setExpanded] = useState(false);
  const step = NEXT_STEP_META[c.next_step] ?? NEXT_STEP_META.MONITOR;
  const sev = SEVERITY_META[c.severity] ?? SEVERITY_META.Info;

  return (
    <TouchableOpacity
      style={styles.candidateCard}
      activeOpacity={0.8}
      onPress={() => setExpanded((e) => !e)}
    >
      <View style={styles.candidateHeader}>
        <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.candidateCode}>{c.codes.p_code}</Text>
          <Text style={styles.candidateVag}>VAG {c.codes.vag}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: sev.bg }]}>
          <Text style={[styles.pillText, { color: sev.color }]}>{sev.label}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: step.bg }]}>
          <Text style={[styles.pillText, { color: step.color }]}>{step.label}</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#9ca3af" />
      </View>

      {expanded && (
        <View style={styles.candidateBody}>
          <Text style={styles.candidateSummary}>{c.plain_summary}</Text>
          {c.symptoms?.map((s, i) => (
            <View key={i} style={styles.symptomRow}>
              <View style={[styles.symptomDot, { backgroundColor: step.color }]} />
              <Text style={styles.symptomText}>{s}</Text>
            </View>
          ))}
          {c.citations?.length > 0 && (
            <View style={styles.citationsBox}>
              {c.citations.map((u) => (
                <Text key={u} style={styles.citationLink} numberOfLines={1}>
                  {u}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Final triage result card ─────────────────────────────────────────────────
function TriageCard({ data }) {
  const head = NEXT_STEP_META[data.headline_next_step] ?? NEXT_STEP_META.MONITOR;

  return (
    <View style={styles.triageContainer}>
      <View style={[styles.headlineCard, { backgroundColor: head.bg, borderColor: head.color }]}>
        <View style={[styles.headlineIcon, { backgroundColor: head.color }]}>
          <Ionicons name={head.icon} size={20} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.headlineTopRow}>
            <Text style={[styles.headlineLabel, { color: head.color }]}>{head.label}</Text>
            {data.source === "web" && (
              <View style={styles.webBadge}>
                <Text style={styles.webBadgeText}>web sources</Text>
              </View>
            )}
          </View>
          <Text style={styles.headlineBlurb}>{head.blurb}</Text>
          <Text style={styles.confidenceText}>{data.confidence} confidence</Text>
        </View>
      </View>

      {data.candidates?.length > 0 ? (
        <View style={styles.candidatesBox}>
          <Text style={styles.sectionLabel}>POSSIBLE FAULT CODES</Text>
          {data.candidates.map((c) => (
            <CandidateCard key={`${c.rank}-${c.codes.p_code}`} c={c} />
          ))}
        </View>
      ) : (
        <Text style={styles.noMatchText}>No matching fault code in the database.</Text>
      )}

      <Text style={styles.disclaimer}>{data.disclaimer}</Text>
    </View>
  );
}

// ── Chat bubble for one message ──────────────────────────────────────────────
function MessageBubble({ message, onQuickReply }) {
  if (message.kind === "triage") {
    return <TriageCard data={message.triage} />;
  }

  if (message.role === "user") {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowRight]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userBubbleText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  if (message.kind === "error") {
    return (
      <View style={styles.bubbleRow}>
        <View style={[styles.bubble, styles.errorBubble]}>
          <Text style={styles.errorBubbleText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bubbleRow}>
      <View>
        <View style={[styles.bubble, styles.assistantBubble]}>
          <Text style={styles.assistantBubbleText}>{message.text}</Text>
        </View>
        {message.kind === "consent" && onQuickReply && (
          <View style={styles.quickReplyRow}>
            <TouchableOpacity style={styles.quickReplyBtn} onPress={() => onQuickReply("Yes")}>
              <Text style={styles.quickReplyText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickReplyBtn, styles.quickReplyBtnSecondary]}
              onPress={() => onQuickReply("No")}
            >
              <Text style={[styles.quickReplyText, styles.quickReplyTextSecondary]}>No</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function AiAssistant({ navigation }) {
  // ── Text mode state ──
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | streaming | awaiting_input | done | error
  const threadRef = useRef(null);
  const awaitingRef = useRef(false);
  const scrollRef = useRef(null);

  // ── Voice mode state ──
  const [voiceMode, setVoiceMode] = useState(false);
  const [voicePhase, setVoicePhase] = useState("idle"); // idle | recording | transcribing | diagnosing | speaking | answering
  const [voiceThreadId, setVoiceThreadId] = useState(null); // null = fresh, string = mid-conversation
  const recordingRef = useRef(null);
  const soundRef = useRef(null);

  // Set audio session to playback mode on mount so speech is loud from the start
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    }).catch(() => {});

    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── Text mode helpers ────────────────────────────────────────────────────
  const push = useCallback((m) => {
    setMessages((prev) => [...prev, m]);
  }, []);

  const handleEvent = useCallback(
    (ev) => {
      if (ev.type === "interrupt") {
        push({
          id: newId(),
          role: "assistant",
          kind: ev.kind === "consent" ? "consent" : "question",
          text: ev.question,
        });
        awaitingRef.current = true;
        setStatus("awaiting_input");
      } else if (ev.type === "result") {
        push({ id: newId(), role: "assistant", kind: "triage", triage: ev.data });
        awaitingRef.current = false;
        threadRef.current = null;
        setStatus("done");
      }
    },
    [push]
  );

  const fail = useCallback(() => {
    push({ id: newId(), role: "assistant", kind: "error", text: ERROR_TEXT });
    awaitingRef.current = false;
    threadRef.current = null;
    setStatus("error");
  }, [push]);

  const send = useCallback(
    (raw) => {
      const content = raw.trim();
      if (!content || status === "streaming") return;

      push({ id: newId(), role: "user", kind: "text", text: content });
      setInput("");
      setStatus("streaming");

      const resuming = awaitingRef.current && threadRef.current;
      awaitingRef.current = false;

      const handlers = {
        onThread: (id) => { threadRef.current = id; },
        onEvent: handleEvent,
        onError: fail,
      };

      const p = resuming
        ? resumeDiagnose(threadRef.current, content, handlers)
        : startDiagnose(content, handlers);

      p.catch(() => {});
    },
    [status, push, handleEvent, fail]
  );

  const reset = useCallback(() => {
    recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    recordingRef.current = null;
    soundRef.current?.stopAsync().catch(() => {});
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setVoicePhase("idle");

    setMessages([]);
    setInput("");
    setStatus("idle");
    threadRef.current = null;
    awaitingRef.current = false;
  }, []);

  // ── Voice mode helpers ───────────────────────────────────────────────────
  async function handleVoiceStart() {
    try {
      const { status: perm } = await Audio.requestPermissionsAsync();
      if (perm !== "granted") {
        Alert.alert("Permission needed", "Microphone access is required for voice mode.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setVoicePhase("recording");
    } catch (e) {
      console.error("Voice start error:", e);
      Alert.alert("Error", "Could not start recording. Please try again.");
    }
  }

  // Plays a base64 MP3 string aloud through the main speaker and resolves when done.
  async function playAudio(base64) {
    const dataUri = `data:audio/mp3;base64,${base64}`;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri: dataUri });
    soundRef.current = sound;
    await new Promise((resolve) => {
      let finished = false;
      const done = () => {
        if (!finished) {
          finished = true;
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
          resolve();
        }
      };
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.didJustFinish) done();
        if (s.error) done();
      });
      sound.setVolumeAsync(1.0).catch(() => {});
      sound.playAsync().catch(done);
    });
  }

  async function handleVoiceStop() {
    const rec = recordingRef.current;
    if (!rec) return;

    try {
      setVoicePhase("transcribing");
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      await new Promise((r) => setTimeout(r, 150));

      // Step 1: Whisper transcription
      const text = await transcribeAudio(uri);
      if (!text) {
        push({
          id: newId(),
          role: "assistant",
          kind: "error",
          text: "I couldn't hear anything clearly. Please try speaking again.",
        });
        setVoicePhase(voiceThreadId ? "answering" : "idle");
        return;
      }

      push({ id: newId(), role: "user", kind: "text", text });
      setVoicePhase("diagnosing");

      // Step 2: Send to the interactive voice turn endpoint.
      // If voiceThreadId is set we're answering a clarifying question;
      // otherwise this is the first message in a new conversation.
      const turn = voiceThreadId
        ? await diagnoseVoiceTurn({ threadId: voiceThreadId, answer: text })
        : await diagnoseVoiceTurn({ message: text });

      if (turn.type === "question") {
        // Agent needs more info — speak the question and wait for the user to answer.
        setVoiceThreadId(turn.thread_id);
        push({ id: newId(), role: "assistant", kind: "text", text: turn.question });
        setVoicePhase("speaking");
        await playAudio(turn.audio_base64);
        setVoicePhase("answering");
      } else {
        // Final result — speak it and reset the conversation.
        setVoiceThreadId(null);
        push({ id: newId(), role: "assistant", kind: "text", text: turn.spoken_text });
        setVoicePhase("speaking");
        await playAudio(turn.audio_base64);
        setVoicePhase("idle");
      }
    } catch (e) {
      console.error("Voice flow error:", e);
      setVoiceThreadId(null);
      push({
        id: newId(),
        role: "assistant",
        kind: "error",
        text: `Something went wrong: ${e.message ?? "unknown error"}. Please try again.`,
      });
      setVoicePhase("idle");
    }
  }

  function handleVoiceMicPress() {
    if (voicePhase === "idle" || voicePhase === "answering") {
      handleVoiceStart();
    } else if (voicePhase === "recording") {
      handleVoiceStop();
    }
    // transcribing / diagnosing / speaking: tapping does nothing
  }

  function toggleVoiceMode() {
    if (voicePhase === "recording") {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    if (voicePhase === "speaking") {
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setVoicePhase("idle");
    setVoiceMode((v) => !v);
  }

  const isVoiceBusy = voicePhase !== "idle" && voicePhase !== "recording" && voicePhase !== "answering";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <View style={styles.headerIcon}>
            <FontAwesome5 name="robot" size={14} color="#2d7eff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Quattro</Text>
            <Text style={styles.headerSubtitle}>
              {voiceMode ? "Voice Mode" : "AI Diagnosis Assistant"}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Voice / text mode toggle */}
          <TouchableOpacity style={styles.headerBtn} onPress={toggleVoiceMode}>
            <Ionicons
              name={voiceMode ? "mic" : "mic-outline"}
              size={20}
              color={voiceMode ? "#2d7eff" : "#9ca3af"}
            />
          </TouchableOpacity>
          {/* Reset conversation */}
          <TouchableOpacity style={styles.headerBtn} onPress={reset}>
            <Ionicons name="refresh" size={20} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            {voiceMode ? (
              <>
                <Ionicons name="mic-circle-outline" size={52} color="#c7d2fe" />
                <Text style={styles.emptyTitle}>Voice Mode</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the microphone below and describe what you're hearing, feeling,
                  or seeing with your car. Quattro will listen and respond out loud.
                </Text>
              </>
            ) : (
              <>
                <FontAwesome5 name="comment-medical" size={36} color="#c7d2fe" />
                <Text style={styles.emptyTitle}>Hi, I'm Quattro</Text>
                <Text style={styles.emptySubtitle}>
                  Tell me what you're noticing — sounds, smells, dashboard lights, when it
                  happens — and I'll help narrow down the possible fault.
                </Text>
              </>
            )}
          </View>
        )}

        {messages.map((m, idx) => (
          <View key={m.id} style={styles.messageWrapper}>
            <MessageBubble
              message={m}
              onQuickReply={
                idx === messages.length - 1 && status === "awaiting_input" ? send : null
              }
            />
          </View>
        ))}

        {/* Text mode streaming indicator */}
        {!voiceMode && status === "streaming" && (
          <View style={styles.bubbleRow}>
            <View style={[styles.bubble, styles.assistantBubble, styles.thinkingBubble]}>
              <ActivityIndicator size="small" color="#9ca3af" />
              <Text style={styles.thinkingText}>Thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom bar: text input OR voice control ── */}
      {voiceMode ? (
        <View style={styles.voiceBar}>
          <TouchableOpacity
            style={[
              styles.micBtn,
              voicePhase === "recording" && styles.micBtnRecording,
              isVoiceBusy && styles.micBtnDisabled,
            ]}
            onPress={handleVoiceMicPress}
            disabled={isVoiceBusy}
            activeOpacity={0.8}
          >
            {isVoiceBusy ? (
              <ActivityIndicator size="small" color="white" />
            ) : voicePhase === "recording" ? (
              <Ionicons name="stop" size={28} color="white" />
            ) : (
              <Ionicons name="mic" size={28} color="white" />
            )}
          </TouchableOpacity>
          <Text style={styles.voicePhaseLabel}>{VOICE_LABELS[voicePhase]}</Text>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Describe the symptom..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            editable={status !== "streaming"}
            multiline
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || status === "streaming") && styles.sendBtnDisabled,
            ]}
            onPress={() => send(input)}
            disabled={!input.trim() || status === "streaming"}
          >
            <Ionicons name="send" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(45,126,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#111" },
  headerSubtitle: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },

  // ── Messages ──
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  messageWrapper: { marginBottom: 12 },

  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginTop: 14 },
  emptySubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },

  // ── Bubbles ──
  bubbleRow: { flexDirection: "row" },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: { backgroundColor: "#2d7eff", borderBottomRightRadius: 4 },
  userBubbleText: { color: "white", fontSize: 14, lineHeight: 20 },
  assistantBubble: { backgroundColor: "#f3f4f6", borderBottomLeftRadius: 4 },
  assistantBubbleText: { color: "#111", fontSize: 14, lineHeight: 20 },
  errorBubble: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderBottomLeftRadius: 4,
  },
  errorBubbleText: { color: "#b91c1c", fontSize: 13, lineHeight: 19 },
  thinkingBubble: { flexDirection: "row", alignItems: "center", gap: 8 },
  thinkingText: { color: "#9ca3af", fontSize: 13, fontStyle: "italic" },

  // ── Quick replies ──
  quickReplyRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  quickReplyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#2d7eff",
  },
  quickReplyBtnSecondary: { backgroundColor: "#f3f4f6" },
  quickReplyText: { color: "white", fontSize: 13, fontWeight: "700" },
  quickReplyTextSecondary: { color: "#374151" },

  // ── Triage card ──
  triageContainer: { width: "100%" },
  headlineCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  headlineIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headlineTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  headlineLabel: { fontSize: 16, fontWeight: "800" },
  webBadge: {
    backgroundColor: "rgba(45,126,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  webBadgeText: { fontSize: 10, fontWeight: "700", color: "#2d7eff" },
  headlineBlurb: { fontSize: 12, color: "#6b7280", marginTop: 3, lineHeight: 17 },
  confidenceText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "capitalize",
    marginTop: 6,
  },
  candidatesBox: { marginTop: 14, gap: 8 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  candidateCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
  },
  candidateHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  candidateCode: { fontSize: 14, fontWeight: "800", color: "#111" },
  candidateVag: { fontSize: 10, color: "#9ca3af", marginTop: 1 },
  pill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: "700" },
  candidateBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 8,
  },
  candidateSummary: { fontSize: 13, color: "#374151", lineHeight: 19 },
  symptomRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  symptomDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 7 },
  symptomText: { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 18 },
  citationsBox: { gap: 4, marginTop: 4 },
  citationLink: { fontSize: 11, color: "#2d7eff" },
  noMatchText: { fontSize: 13, color: "#6b7280", marginTop: 14 },
  disclaimer: { fontSize: 10, color: "#9ca3af", marginTop: 14, lineHeight: 15 },

  // ── Text input bar ──
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#f3f4f6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2d7eff",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#c7d2fe" },

  // ── Voice bar ──
  voiceBar: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "white",
    gap: 12,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2d7eff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2d7eff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  micBtnRecording: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
  },
  micBtnDisabled: {
    backgroundColor: "#9ca3af",
    shadowColor: "#9ca3af",
  },
  voicePhaseLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
});
