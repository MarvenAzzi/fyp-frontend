import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";

import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

function severityColor(severity) {
  if (severity === "Critical") return "#ef4444";
  if (severity === "Warning")  return "#f59e0b";
  return "#6b7280";
}

function severityBg(severity) {
  if (severity === "Critical") return "#fef2f2";
  if (severity === "Warning")  return "#fffbeb";
  return "#f9fafb";
}

export default function ErrorLog({ navigation, route }) {
  const fault = route?.params?.fault;

  if (!fault) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={16} color="#333" />
          <Text style={styles.backText}>Car Diagnostic</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#aaa" }}>No fault data found.</Text>
        </View>
      </View>
    );
  }

  const causes = Array.isArray(fault.possible_causes)
    ? fault.possible_causes
    : typeof fault.possible_causes === "string"
    ? JSON.parse(fault.possible_causes || "[]")
    : [];

  const sColor = severityColor(fault.severity);
  const sBg    = severityBg(fault.severity);

  return (
    <View style={styles.screen}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={16} color="#333" />
        <Text style={styles.backText}>Car Diagnostic</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Critical header card ── */}
        <View style={[styles.headerCard, { backgroundColor: sColor }]}>
          <View style={styles.headerTop}>
            <View style={styles.warningIconBox}>
              <Ionicons name="warning" size={22} color={sColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSeverity}>{fault.severity}</Text>
              <Text style={styles.headerTitle}>Engine Error</Text>
            </View>
          </View>
          <Text style={styles.headerCode}>{fault.code} — {fault.description}</Text>
          <View style={styles.headerFooter}>
            <View style={styles.severityDot} />
            <Text style={styles.headerDetected}>{fault.severity} · Detected just now</Text>
          </View>
        </View>

        {/* ── Engine section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="cog" size={20} color="#ef4444" solid />
            <Text style={styles.sectionTitle}>Engine</Text>
          </View>

          {/* Causes + Impact */}
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.colTitle}>Possible Causes</Text>
              {causes.length > 0
                ? causes.map((c, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="checkmark" size={13} color="#6b7280" />
                      <Text style={styles.bulletText}>{c}</Text>
                    </View>
                  ))
                : <Text style={styles.bulletText}>—</Text>
              }
            </View>

            <View style={styles.divider} />

            <View style={styles.col}>
              <Text style={styles.colTitle}>Impact</Text>
              <View style={styles.bulletRow}>
                <FontAwesome5 name="gas-pump" size={11} color="#6b7280" />
                <Text style={styles.bulletText}>Reduced fuel efficiency</Text>
              </View>
              <Text style={[styles.colTitle, { marginTop: 14 }]}>Recommendation</Text>
              <View style={styles.bulletRow}>
                <FontAwesome5 name="tools" size={11} color="#6b7280" />
                <Text style={styles.bulletText}>Visit service{"\n"}center soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Find Nearby Garage ── */}
        <TouchableOpacity
          style={styles.garageBtn}
          onPress={() => navigation.navigate("GarageMap")}
          activeOpacity={0.85}
        >
          <Ionicons name="location" size={16} color="white" />
          <Text style={styles.garageBtnText}>Find Nearby Garage</Text>
        </TouchableOpacity>

        {/* ── What You Should Know ── */}
        <Text style={styles.knowTitle}>What You Should Know</Text>

        {fault.diagnostic_notes ? (
          <View style={[styles.knowCard, { borderLeftColor: "#f59e0b" }]}>
            <Ionicons name="warning-outline" size={20} color="#f59e0b" style={{ marginRight: 10 }} />
            <Text style={styles.knowText}>{fault.diagnostic_notes}</Text>
          </View>
        ) : null}

        <View style={[styles.knowCard, { borderLeftColor: "#ef4444" }]}>
          <FontAwesome5 name="cog" size={16} color="#ef4444" style={{ marginRight: 10 }} solid />
          <Text style={styles.knowText}>
            Driving with this issue may lead to increased fuel consumption and potential engine damage.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f8fc" },

  backBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, gap: 4,
    backgroundColor: "white",
  },
  backText: { fontSize: 14, color: "#333", fontWeight: "500" },

  // ── Header card ──
  headerCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16,
  },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  warningIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: "white",
    justifyContent: "center", alignItems: "center",
  },
  headerSeverity: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  headerTitle: { fontSize: 18, color: "white", fontWeight: "800" },
  headerCode: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500", lineHeight: 18 },
  headerFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  severityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fbbf24" },
  headerDetected: { fontSize: 12, color: "rgba(255,255,255,0.85)" },

  // ── Section ──
  section: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: "white",
    borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "black" },

  twoColRow: { flexDirection: "row" },
  col: { flex: 1 },
  colTitle: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  bulletText: { fontSize: 12, color: "#6b7280", flex: 1, lineHeight: 16 },
  divider: { width: 1, backgroundColor: "#e5e7eb", marginHorizontal: 12 },

  // ── Garage button ──
  garageBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#3b82f6", borderRadius: 10, padding: 14, gap: 8,
    marginHorizontal: 16, marginTop: 20,
  },
  garageBtnText: { color: "white", fontSize: 14, fontWeight: "700" },

  // ── What You Should Know ──
  knowTitle: { fontSize: 16, fontWeight: "700", color: "black", marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  knowCard: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "white", borderRadius: 12, padding: 14,
    marginHorizontal: 16, marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  knowText: { fontSize: 12, color: "#6b7280", flex: 1, lineHeight: 18 },
});
