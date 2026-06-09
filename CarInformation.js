import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { getScanHistory } from "./src/api/diagnostics";

const screenWidth = Dimensions.get("window").width;

function InfoRow({ icon, iconSet = "MaterialCommunityIcons", label, value }) {
  const Icon =
    iconSet === "Ionicons" ? Ionicons : MaterialCommunityIcons;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Icon name={icon} size={18} color="#b0b4c1" style={{ marginRight: 10 }} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value ?? "—"}
      </Text>
    </View>
  );
}

function severityColor(s) {
  if (s === "Critical") return "#ef4444";
  if (s === "Warning")  return "#f59e0b";
  if (s === "healthy")  return "#22c55e";
  return "#6b7280";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return isToday ? `Today ${time}` : `${d.toLocaleDateString()} ${time}`;
}

function HistoryItem({ code, description, date, severity, onPress }) {
  const color = severityColor(severity);
  return (
    <TouchableOpacity
      style={styles.historyItem}
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
    >
      <View style={[styles.severityDot, { backgroundColor: color }]} />
      <View style={styles.historyContent}>
        <Text style={styles.historyCode}>{code}</Text>
        <Text style={styles.historyDesc} numberOfLines={1}>{description}</Text>
      </View>
      <Text style={styles.historyDate}>{date}</Text>
    </TouchableOpacity>
  );
}

export default function CarInformation({ navigation, route }) {
  const [vehicle, setVehicle]           = useState(null);
  const [scanHistory, setScanHistory]   = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const car = route?.params?.vehicle;
    if (!car) {
      Alert.alert("No car found", "No car information was found.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      return;
    }
    setVehicle(car);

    (async () => {
      setHistoryLoading(true);
      try {
        const data = await getScanHistory(car.id);
        setScanHistory(Array.isArray(data) ? data : []);
      } catch (_) {
        setScanHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [route]);

  if (!vehicle) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>

      {/* ── Top white area: back button + car image ── */}
      <View style={styles.imageArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.carTitle}>
          {vehicle.brand} {vehicle.model}
        </Text>

        {vehicle.image_url ? (
          <Image
            source={{ uri: vehicle.image_url }}
            style={styles.carImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <FontAwesome5 name="car" size={90} color="#d0d4e0" />
          </View>
        )}
      </View>

      {/* ── Scrollable info card ── */}
      <ScrollView
        style={styles.infoCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {/* Car Info */}
        <Text style={styles.sectionTitle}>Car Information</Text>

        <InfoRow icon="car"                iconSet="Ionicons" label="Brand"          value={vehicle.brand} />
        <InfoRow icon="car"                iconSet="Ionicons" label="Model"          value={vehicle.model} />
        <InfoRow icon="calendar-outline"   iconSet="Ionicons" label="Year"           value={vehicle.year?.toString()} />
        <InfoRow icon="dots-grid"                             label="Plate Number"   value={vehicle.plate_number} />
        <InfoRow icon="dots-grid"                             label="VIN Number"     value={vehicle.vin} />
        <InfoRow icon="dots-grid"                             label="Engine Type"    value={vehicle.engine_type} />
        <InfoRow icon="dots-grid"                             label="Mileage"        value={vehicle.current_mileage ? `${vehicle.current_mileage} KM` : null} />

        {/* Color row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="color-palette-outline" size={18} color="#b0b4c1" style={{ marginRight: 10 }} />
            <Text style={styles.infoLabel}>Color</Text>
          </View>
          <View style={[styles.colorPill, {
            backgroundColor: vehicle.color_hex ? vehicle.color_hex + "22" : "#f0f0f0",
            borderColor: vehicle.color_hex ?? "#ddd",
          }]}>
            {vehicle.color_hex && (
              <View style={[styles.colorDot, { backgroundColor: vehicle.color_hex }]} />
            )}
            <Text style={[styles.colorPillText, { color: vehicle.color_hex ?? "#555" }]}>
              {vehicle.color ?? "—"}
            </Text>
          </View>
        </View>

        {/* Diagnostic History */}
        <View style={styles.historyHeader}>
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={20} color="#2D7EEB" />
          <Text style={styles.sectionTitle2}>Diagnostic History</Text>
        </View>

        {historyLoading ? (
          <ActivityIndicator size="small" color="#2D7EEB" style={{ marginVertical: 24 }} />
        ) : scanHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="checkmark-circle-outline" size={40} color="#d0d4e0" />
            <Text style={styles.emptyTitle}>No errors recorded</Text>
            <Text style={styles.emptySubtitle}>
              Run a diagnosis to start tracking your car's health
            </Text>
          </View>
        ) : (
          scanHistory.map((scan, si) => {
            const date   = formatDate(scan.scanned_at);
            const faults = scan.fault_codes ?? [];

            if (scan.overall_status === "healthy" || faults.length === 0) {
              return (
                <HistoryItem
                  key={si}
                  code="All Systems OK"
                  description="No fault codes detected"
                  date={date}
                  severity="healthy"
                />
              );
            }

            return faults.map((fault, fi) => (
              <HistoryItem
                key={`${si}-${fi}`}
                code={fault.code}
                description={fault.description}
                date={date}
                severity={fault.severity}
                onPress={() => navigation.navigate("ErrorLog", { fault })}
              />
            ));
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f0f3fc",
  },

  // ── Top white section ──
  imageArea: {
    backgroundColor: "white",
    paddingTop: 54,
    paddingBottom: 20,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 54,
    left: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  backText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 3,
    fontWeight: "500",
  },
  carTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginTop: 4,
    marginBottom: 8,
  },
  carImage: {
    width: screenWidth,
    height: 220,
    marginTop: 10,
  },
  imagePlaceholder: {
    width: screenWidth,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  // ── Sliding card ──
  infoCard: {
    flex: 1,
    backgroundColor: "#dde5fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -22,
    paddingHorizontal: 18,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "black",
    textAlign: "center",
    marginBottom: 16,
  },

  // ── Info rows ──
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#777",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
    maxWidth: "55%",
    textAlign: "right",
  },

  // ── Color pill ──
  colorPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  colorPillText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Diagnostic history ──
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  sectionTitle2: {
    fontSize: 18,
    fontWeight: "700",
    color: "black",
  },
  emptyHistory: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9ca3af",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#b0b4c1",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 30,
    lineHeight: 18,
  },

  // ── History items (for when data exists) ──
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyCode: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
  },
  historyDesc: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: "#b0b4c1",
    fontWeight: "500",
  },
});
