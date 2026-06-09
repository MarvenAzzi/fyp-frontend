import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { calculateReminders } from "./src/utils/serviceReminders";

const { width: screenWidth } = Dimensions.get("window");

const STATUS_CONFIG = {
  urgent:    { label: "Due Soon",  color: "#ef4444", bg: "#fef2f2", barColor: "#ef4444" },
  soon:      { label: "Upcoming",  color: "#d97706", bg: "#fef3c7", barColor: "#f59e0b" },
  scheduled: { label: "Scheduled", color: "#3b82f6", bg: "#eff6ff", barColor: "#3b82f6" },
};

function formatKmLeft(kmLeft) {
  if (kmLeft <= 0)   return "Due now";
  if (kmLeft < 1000) return `${kmLeft} km`;
  return `${kmLeft.toLocaleString()} km`;
}

function ReminderCard({ item }) {
  const cfg = STATUS_CONFIG[item.status];

  return (
    <View style={[styles.card, { borderLeftColor: cfg.barColor }]}>
      <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
        <MaterialCommunityIcons name={item.icon} size={22} color={cfg.color} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={styles.dueAt}>Due at {item.nextAt.toLocaleString()} km</Text>

        <View style={styles.kmRow}>
          <Ionicons name="speedometer-outline" size={13} color={cfg.color} />
          <Text style={[styles.kmLeft, { color: cfg.color }]}>
            {formatKmLeft(item.kmLeft)} remaining
          </Text>
        </View>

        <Text style={styles.tip} numberOfLines={2}>{item.tip}</Text>
      </View>
    </View>
  );
}

export default function Notifications({ navigation, route }) {
  const vehicle   = route?.params?.vehicle ?? null;
  const mileage   = vehicle?.current_mileage ?? 0;
  const reminders = vehicle ? calculateReminders(mileage, vehicle.engine_type, vehicle.id) : [];

  const urgent    = reminders.filter(r => r.status === "urgent");
  const soon      = reminders.filter(r => r.status === "soon");
  const scheduled = reminders.filter(r => r.status === "scheduled");

  const attentionCount = urgent.length + soon.length;

  return (
    <View style={styles.screen}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Service Reminders</Text>
          {vehicle && (
            <Text style={styles.headerSub}>
              {vehicle.brand} {vehicle.model} · {mileage.toLocaleString()} km
            </Text>
          )}
        </View>
      </View>

      {/* ── Summary banner ── */}
      {attentionCount > 0 ? (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={18} color="#d97706" />
          <Text style={styles.alertText}>
            {attentionCount} service{attentionCount !== 1 ? "s" : ""} need{attentionCount === 1 ? "s" : ""} your attention
          </Text>
        </View>
      ) : (
        <View style={styles.okBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
          <Text style={styles.okText}>All services are on schedule</Text>
        </View>
      )}

      {vehicle ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>

          {urgent.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>⚠ Due Soon</Text>
              {urgent.map(r => <ReminderCard key={r.id} item={r} />)}
            </>
          )}

          {soon.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Upcoming</Text>
              {soon.map(r => <ReminderCard key={r.id} item={r} />)}
            </>
          )}

          {scheduled.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Scheduled</Text>
              {scheduled.map(r => <ReminderCard key={r.id} item={r} />)}
            </>
          )}

        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="car-outline" size={52} color="#d0d4e0" />
          <Text style={styles.emptyTitle}>No car selected</Text>
          <Text style={styles.emptySub}>Select a car to see service reminders</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f8fc" },

  // ── Header ──
  header: {
    backgroundColor: "#2d7eff",
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "white" },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  // ── Banners ──
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef3c7",
    marginHorizontal: 16, marginTop: 14,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: "#f59e0b",
  },
  alertText: { fontSize: 13, fontWeight: "600", color: "#92400e" },

  okBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f0fdf4",
    marginHorizontal: 16, marginTop: 14,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: "#22c55e",
  },
  okText: { fontSize: 13, fontWeight: "600", color: "#166534" },

  // ── List ──
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: 0.8,
    marginTop: 18, marginBottom: 8, marginLeft: 2,
  },

  // ── Card ──
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  cardBody: { flex: 1 },
  cardRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 4,
  },
  serviceName: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1, marginRight: 8 },

  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },

  dueAt: { fontSize: 12, color: "#374151", fontWeight: "600", marginBottom: 4 },

  kmRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  kmLeft: { fontSize: 12, fontWeight: "600" },

  tip: { fontSize: 11, color: "#9ca3af", lineHeight: 16 },

  // ── Empty ──
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#9ca3af" },
  emptySub:   { fontSize: 12, color: "#b0b4c1", textAlign: "center" },
});
