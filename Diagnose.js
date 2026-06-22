import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Image,
} from "react-native";

import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

// BUG FIX 3: Also import getVehicles + saveSelectedVehicle so we can refresh
// the vehicle from the server on every focus, instead of using a stale
// SecureStore snapshot that may have wrong year / mileage / engine_type.
import { getSelectedVehicle, getVehicles, saveSelectedVehicle } from "./src/api/vehicles";
import { runScan, getLatestScan } from "./src/api/diagnostics";

const { width: screenWidth } = Dimensions.get("window");
const SCAN_DURATION = 4000;

// ── Circular progress ring (two-half technique) ─────────────────────────────
function CircularProgress({ progress, size = 200, strokeWidth = 14 }) {
  const half = size / 2;
  const p = Math.min(100, Math.max(0, progress));

  const firstAngle  = p <= 50 ? (p / 50) * 180 : 180;
  const secondAngle = p > 50  ? ((p - 50) / 50) * 180 : 0;

  return (
    <View style={{ width: size, height: size }}>
      {/* Gray track */}
      <View style={{
        position: "absolute", width: size, height: size,
        borderRadius: half, borderWidth: strokeWidth, borderColor: "#e2e8f0",
      }} />

      {/* Right half — 0 to 50% */}
      <View style={{ position: "absolute", right: 0, width: half, height: size, overflow: "hidden" }}>
        <View style={{
          position: "absolute", right: 0,
          width: size, height: size, borderRadius: half,
          borderWidth: strokeWidth,
          borderTopColor: "#22c55e",
          borderRightColor: "#22c55e",
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
          transform: [{ rotate: `${firstAngle - 135}deg` }],
        }} />
      </View>

      {/* Left half — 50 to 100% */}
      <View style={{ position: "absolute", left: 0, width: half, height: size, overflow: "hidden" }}>
        <View style={{
          position: "absolute", left: 0,
          width: size, height: size, borderRadius: half,
          borderWidth: strokeWidth,
          borderTopColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: p > 50 ? "#22c55e" : "transparent",
          borderLeftColor:  p > 50 ? "#22c55e" : "transparent",
          transform: [{ rotate: `${secondAngle - 135}deg` }],
        }} />
      </View>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatScannedAt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return isToday ? `Today, ${time}` : `${d.toLocaleDateString()}, ${time}`;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Diagnose({ navigation }) {
  const [vehicle, setVehicle]           = useState(null);
  const [scanning, setScanning]         = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan]         = useState(null);
  const intervalRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          // BUG FIX 3: Read the selected vehicle ID from SecureStore, then
          // fetch fresh data from the server so year/mileage/engine_type are
          // always up-to-date. A stale SecureStore snapshot with mileage=0
          // or year=null was making the backend think every car is brand-new,
          // causing it to always return "healthy".
          const stored = await getSelectedVehicle();
          if (!stored) {
            Alert.alert("No car connected", "Please select a car first.", [
              { text: "OK", onPress: () => navigation.navigate("MyCars") },
            ]);
            return;
          }

          // Refresh the vehicle from the server
          try {
            const allVehicles = await getVehicles();
            const fresh = allVehicles.find((v) => v.id === stored.id);
            if (fresh) {
              // Update SecureStore so next load is also correct
              await saveSelectedVehicle(fresh);
              setVehicle(fresh);
            } else {
              // Vehicle was deleted — fall back to stored snapshot
              setVehicle(stored);
            }
          } catch (_) {
            // Network error — use cached snapshot rather than blocking the UI
            setVehicle(stored);
          }

          // Load the latest scan
          try {
            const data = await getLatestScan(stored.id);
            // BUG FIX 2: getLatestScan returns { scan: {...} }
            // Always unwrap .scan here so lastScan shape is consistent.
            setLastScan(data.scan ?? null);
          } catch (_) {
            setLastScan(null);
          }
        } catch (e) {
          console.log("Diagnose load error:", e);
        }
      }
      load();
    }, [])
  );

  // BUG FIX 1: The original code wrapped the API call in setTimeout(async () => {...})
  // which is fire-and-forget — React Native can't properly track async work
  // inside a plain setTimeout. If the component re-renders or unmounts during
  // the delay, state updates are silently lost, leaving the UI stuck on the
  // previous (healthy) result.
  //
  // Fix: run the animation timer separately with setInterval as before, but
  // fire the API call with a proper awaited Promise so the result is never
  // dropped.
  async function handleRunDiagnosis() {
    if (!vehicle) return;
    setScanning(true);
    setScanProgress(0);

    // Start the progress animation
    const step = 100 / (SCAN_DURATION / 40);
    intervalRef.current = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(intervalRef.current);
          return 100;
        }
        return next;
      });
    }, 40);

    // Wait for the animation to finish, THEN call the API
    // Using a Promise wrapper so we can properly await it
    await new Promise((resolve) => setTimeout(resolve, SCAN_DURATION + 300));

    try {
      const result = await runScan(vehicle.id);

      // BUG FIX 2: runScan returns a flat object:
      //   { scan_id, overall_status, fault_codes, mileage_at_scan, scanned_at, last_scanned_at }
      // getLatestScan (on load) returns { scan: { scan_id, overall_status, ... } }
      // We must normalize both to the same shape so isFaulty check always works.
      // Normalize runScan result to match the getLatestScan .scan shape:
      setLastScan({
        scan_id:         result.scan_id,
        overall_status:  result.overall_status,
        fault_codes:     result.fault_codes ?? [],
        mileage_at_scan: result.mileage_at_scan,
        scanned_at:      result.scanned_at,
      });
    } catch (e) {
      Alert.alert("Scan failed", e.message);
    } finally {
      clearInterval(intervalRef.current);
      setScanning(false);
      setScanProgress(0);
    }
  }

  function handlePauseScan() {
    clearInterval(intervalRef.current);
    setScanning(false);
    setScanProgress(0);
  }

  const carName  = vehicle ? `${vehicle.brand} ${vehicle.model}` : "No Car Connected";
  const isFaulty = lastScan?.overall_status === "faulty";
  const faults   = lastScan?.fault_codes ?? [];
  const mileage  = lastScan?.mileage_at_scan ?? vehicle?.current_mileage ?? null;

  // ── SCANNING STATE ────────────────────────────────────────────────────────
  if (scanning) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View style={styles.topSection}>
          <Text style={styles.carName}>{carName}</Text>
          <Text style={styles.connectedText}>Connected</Text>
          {vehicle?.image_url ? (
            <Image source={{ uri: vehicle.image_url }} style={styles.carImage} resizeMode="contain" />
          ) : (
            <View style={styles.carImageSpace}>
              <FontAwesome5 name="car" size={70} color="#d0d4e0" />
            </View>
          )}
        </View>

        <View style={styles.scanningContainer}>
          <View style={styles.ringWrapper}>
            <CircularProgress progress={scanProgress} size={200} strokeWidth={14} />
            <View style={styles.ringInner}>
              <TouchableOpacity style={styles.pauseBtn} onPress={handlePauseScan}>
                <Ionicons name="pause" size={16} color="white" />
              </TouchableOpacity>
              <Text style={styles.diagnosingText}>Diagnosing</Text>
              <Text style={styles.percentText}>{Math.round(scanProgress)}%</Text>
            </View>
          </View>

          <View style={styles.scanLabelsRow}>
            <View style={styles.scanLabel}>
              <MaterialIcons name="settings-input-component" size={22} color="#0071ff" />
              <Text style={styles.scanLabelText}>Engine</Text>
              <Text style={styles.scanLabelSub}>Engine Temperature</Text>
            </View>
            <View style={styles.scanLabel}>
              <View style={styles.warningCircle}>
                <Ionicons name="warning-outline" size={16} color="white" />
              </View>
              <Text style={styles.scanLabelText}>Error Log</Text>
              <Text style={styles.scanLabelSub}>No errors yet</Text>
            </View>
          </View>

          <View style={styles.vehicleStatusBox}>
            <View style={styles.statusIconBox}>
              <Ionicons name="document-text-outline" size={30} color="#9b9b9b" />
            </View>
            <View>
              <Text style={styles.statusTitle}>Vehicle Status</Text>
              <Text style={styles.statusDash}>—</Text>
              <Text style={styles.statusSub}>Scan not Started</Text>
            </View>
          </View>

          <View style={styles.lastScannedRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#344054" />
            <Text style={styles.lastScannedText}>Last Scanned: {formatScannedAt(lastScan?.scanned_at)}</Text>
          </View>
        </View>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
            <Ionicons name="home-outline" size={22} color="black" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialIcons name="manage-search" size={25} color="#006fff" />
            <Text style={styles.activeNavText}>Diagnose</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MyCars")}>
            <FontAwesome5 name="car" size={18} color="black" />
            <Text style={styles.navText}>Cars</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-outline" size={21} color="black" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── IDLE / RESULT STATE ───────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Car header */}
        <View style={styles.topSection}>
          <Text style={styles.carName}>{carName}</Text>
          <Text style={styles.connectedText}>{vehicle ? "Connected" : "Not Connected"}</Text>
          {vehicle?.image_url ? (
            <Image source={{ uri: vehicle.image_url }} style={styles.carImage} resizeMode="contain" />
          ) : (
            <View style={styles.carImageSpace}>
              <FontAwesome5 name="car" size={70} color="#d0d4e0" />
            </View>
          )}
        </View>

        {/* Main card */}
        <View style={styles.card}>

          {/* Row 1: Run button + Mileage circle */}
          <View style={styles.topCardRow}>
            <TouchableOpacity style={styles.runBox} onPress={handleRunDiagnosis} activeOpacity={0.8}>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={13} color="white" />
              </View>
              <View>
                <Text style={styles.runText}>Run Diagnosis</Text>
                <Text style={styles.runSubText}>Start full engine scan</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.mileageCircle}>
              <Text style={styles.mileageNumber}>{mileage ? mileage.toLocaleString() : "—"}</Text>
              <Text style={styles.kmText}>KM</Text>
              <Text style={styles.totalText}>Total Mileage</Text>
            </View>
          </View>

          {/* Row 2: Engine + Issues */}
          <View style={styles.middleRow}>
            <View style={styles.smallBox}>
              <MaterialIcons name="settings-input-component" size={26} color="#0071ff" />
              <Text style={styles.boxTitle}>Engine</Text>
              <Text style={styles.boxValue}>{lastScan ? "90 C" : "—"}</Text>
              <Text style={styles.boxSub}>Engine{"\n"}Temperature</Text>
            </View>

            <View style={styles.smallBox}>
              <View style={[styles.warningCircle, isFaulty && styles.warningRed]}>
                <Ionicons
                  name={isFaulty ? "warning" : "checkmark"}
                  size={16}
                  color="white"
                />
              </View>
              <Text style={styles.boxTitle}>Issues</Text>
              {lastScan ? (
                <Text style={[styles.boxValue, { color: isFaulty ? "#ef4444" : "#22c55e", fontSize: 11 }]}>
                  {isFaulty ? "Fault Detected" : "No Issues"}
                </Text>
              ) : (
                <Text style={styles.boxValue}>—</Text>
              )}
              <Text style={styles.boxSub}>
                {isFaulty ? `${faults.length} code${faults.length !== 1 ? "s" : ""} found` : "Engine is running fine"}
              </Text>
            </View>
          </View>

          {/* Fault codes list (only when faulty) */}
          {isFaulty && faults.length > 0 && (
            <View style={styles.faultList}>
              {faults.map((fault, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.faultItem}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate("ErrorLog", { fault })}
                >
                  <View style={styles.faultLeft}>
                    <View style={[styles.severityDot, {
                      backgroundColor:
                        fault.severity === "Critical" ? "#ef4444" :
                        fault.severity === "Warning"  ? "#f59e0b" : "#6b7280",
                    }]} />
                    <View>
                      <Text style={styles.faultCode}>{fault.code}</Text>
                      <Text style={styles.faultDesc} numberOfLines={1}>{fault.description}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#c0c0c0" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Vehicle Status */}
          <View style={[
            styles.vehicleStatusBox,
            lastScan && (isFaulty ? styles.statusBoxFaulty : styles.statusBoxHealthy),
          ]}>
            <View style={[styles.statusIconBox, lastScan && { borderColor: "transparent", backgroundColor: "transparent" }]}>
              {lastScan ? (
                isFaulty
                  ? <Ionicons name="close-circle" size={36} color="#ef4444" />
                  : <Ionicons name="checkmark-circle" size={36} color="#22c55e" />
              ) : (
                <Ionicons name="document-text-outline" size={30} color="#9b9b9b" />
              )}
            </View>
            <View>
              <Text style={styles.statusTitle}>Vehicle Status</Text>
              {lastScan ? (
                <>
                  <Text style={[styles.statusValue, { color: isFaulty ? "#ef4444" : "#22c55e" }]}>
                    {isFaulty ? "Faulty" : "Healthy"}
                  </Text>
                  <Text style={styles.statusSub}>
                    {isFaulty ? "Action required" : "No issues detected"}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.statusDash}>—</Text>
                  <Text style={styles.statusSub}>Scan not Started</Text>
                </>
              )}
            </View>
          </View>

          {/* Last scanned */}
          <View style={styles.lastScannedRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#344054" />
            <Text style={styles.lastScannedText}>
              Last Scanned: {formatScannedAt(lastScan?.scanned_at)}
            </Text>
          </View>
        </View>

        {/* AI Assistant entry */}
        <TouchableOpacity
          style={styles.aiButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("AiAssistant")}
        >
          <View style={styles.aiButtonIcon}>
            <FontAwesome5 name="robot" size={14} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiButtonTitle}>Ask Quattro</Text>
            <Text style={styles.aiButtonSubtitle}>Describe a symptom and get instant guidance</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home-outline" size={22} color="black" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="manage-search" size={25} color="#006fff" />
          <Text style={styles.activeNavText}>Diagnose</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MyCars")}>
          <FontAwesome5 name="car" size={18} color="black" />
          <Text style={styles.navText}>Cars</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-outline" size={21} color="black" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },

  topSection: { alignItems: "center", paddingTop: 45 },
  carName: { fontSize: 17, color: "black", fontWeight: "600" },
  connectedText: { fontSize: 14, color: "#0051FF", marginTop: 6 },
  carImage: { width: screenWidth, height: 210, marginTop: 16 },
  carImageSpace: {
    width: screenWidth, height: 210, marginTop: 16,
    alignItems: "center", justifyContent: "center",
  },

  // ── Card ──
  card: {
    width: screenWidth - 16, marginHorizontal: 8,
    borderWidth: 1, borderColor: "#DCDDE1", borderRadius: 8,
    paddingVertical: 24, paddingHorizontal: 18, marginTop: 4,
  },

  topCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  runBox: {
    width: 165, height: 68, backgroundColor: "#f1f5ff",
    borderRadius: 6, flexDirection: "row", alignItems: "center", paddingLeft: 14, gap: 10,
  },
  playCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: "black",
    justifyContent: "center", alignItems: "center",
  },
  runText: { color: "#0051FF", fontSize: 13, fontWeight: "700" },
  runSubText: { color: "#7d8592", fontSize: 10, marginTop: 5 },

  mileageCircle: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 7, borderColor: "#cfd1d4",
    justifyContent: "center", alignItems: "center",
  },
  mileageNumber: { color: "#334155", fontSize: 14, fontWeight: "700" },
  kmText: { color: "#334155", fontSize: 9, fontWeight: "700" },
  totalText: { color: "#334155", fontSize: 9, fontWeight: "700", marginTop: 4 },

  // ── Small boxes ──
  middleRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 30, marginTop: 28 },
  smallBox: { width: 115, height: 130, backgroundColor: "#fafafa", padding: 13, overflow: "hidden" },
  warningCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#22c55e",
    justifyContent: "center", alignItems: "center",
  },
  warningRed: { backgroundColor: "#ef4444" },
  boxTitle: { color: "black", fontSize: 13, fontWeight: "800", marginTop: 8 },
  boxValue: { color: "#334155", fontSize: 13, fontWeight: "700", marginTop: 6 },
  boxSub: { color: "#667085", fontSize: 9, fontWeight: "600", marginTop: 3, lineHeight: 12 },

  // ── Fault list ──
  faultList: { marginTop: 18, gap: 8 },
  faultItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff5f5", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#fecaca",
  },
  faultLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  faultCode: { fontSize: 13, fontWeight: "700", color: "#222" },
  faultDesc: { fontSize: 11, color: "#888", marginTop: 2, maxWidth: screenWidth - 140 },

  // ── Vehicle status ──
  vehicleStatusBox: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1.5, borderColor: "#d1d5db", borderRadius: 8,
    padding: 14, marginTop: 20, backgroundColor: "#fafafa",
  },
  statusBoxFaulty: { backgroundColor: "#fff5f5", borderColor: "#fecaca" },
  statusBoxHealthy: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  statusIconBox: {
    width: 44, height: 44, borderWidth: 1, borderColor: "#c0c0c0",
    borderRadius: 6, justifyContent: "center", alignItems: "center",
  },
  statusTitle: { fontSize: 12, color: "#6b7280" },
  statusValue: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  statusDash: { color: "#b8b8b8", fontSize: 18, marginTop: 2 },
  statusSub: { fontSize: 10, color: "#667085", fontWeight: "600", marginTop: 1 },

  // ── Last scanned ──
  lastScannedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 6 },
  lastScannedText: { color: "#9ca3af", fontSize: 12 },

  // ── AI Assistant entry ──
  aiButton: {
    width: screenWidth - 16, marginHorizontal: 8, marginTop: 14,
    backgroundColor: "#2d7eff", borderRadius: 8,
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  aiButtonIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  aiButtonTitle: { color: "white", fontSize: 14, fontWeight: "800" },
  aiButtonSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },

  // ── Scanning overlay ──
  scanningContainer: { flex: 1, alignItems: "center", paddingTop: 20, paddingHorizontal: 18 },
  ringWrapper: { width: 200, height: 200, justifyContent: "center", alignItems: "center" },
  ringInner: {
    position: "absolute", top: 14, left: 14,
    width: 172, height: 172, borderRadius: 86,
    justifyContent: "center", alignItems: "center", gap: 4,
  },
  pauseBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "black",
    justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  diagnosingText: { fontSize: 14, fontWeight: "700", color: "black" },
  percentText: { fontSize: 28, fontWeight: "800", color: "black" },
  scanLabelsRow: {
    flexDirection: "row", justifyContent: "space-around",
    width: "100%", marginTop: 28,
  },
  scanLabel: { alignItems: "flex-start", width: 120 },
  scanLabelText: { fontSize: 13, fontWeight: "700", color: "black", marginTop: 6 },
  scanLabelSub: { fontSize: 10, color: "#667085", marginTop: 3 },

  // ── Bottom nav ──
  bottomNav: {
    position: "absolute", bottom: 0, width: "100%", height: 75,
    backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#e5e5e5",
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
  },
  navItem: { alignItems: "center", justifyContent: "center" },
  navText: { color: "black", fontSize: 10, marginTop: 4, fontWeight: "600" },
  activeNavText: { color: "#006fff", fontSize: 10, marginTop: 4, fontWeight: "700" },
});
