import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";

import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import {
  getVehicles,
  deleteVehicle,
  saveSelectedVehicle,
  getSelectedVehicle,
  removeSelectedVehicle,
} from "./src/api/vehicles";

const screenWidth = Dimensions.get("window").width;
const CARD_W = screenWidth - 64;  // card is narrower, centered — matches Figma
const CARD_H = 135;

const SKIP_COLOR = [
  "#f4f4f2","#f7f7f5","#f0f0ee","#f5f5f3",
  "#a0a09e","#a8aaaa","#6b6d6e","#7c7d7d","#9a9b9c","#8a8b8c",
];

function isDark(hex) {
  if (!hex) return false;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return (r*0.299 + g*0.587 + b*0.114) < 80;
}

export default function MyCars({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadVehicles(); }, []));

  async function loadVehicles() {
    try {
      setLoading(true);
      const vehiclesData = await getVehicles();
      const selected = await getSelectedVehicle();
      setVehicles(vehiclesData || []);
      if (selected && vehiclesData) {
        const stillExists = vehiclesData.find((c) => c.id === selected.id);
        if (stillExists) setSelectedVehicleId(selected.id);
        else { await removeSelectedVehicle(); setSelectedVehicleId(null); }
      } else setSelectedVehicleId(null);
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setLoading(false); }
  }

  async function handleSelectVehicle(vehicle) {
    try {
      await saveSelectedVehicle(vehicle);
      setSelectedVehicleId(vehicle.id);
      Alert.alert("Selected", `${vehicle.brand} ${vehicle.model} selected.`);
    } catch { Alert.alert("Error", "Could not select this car."); }
  }

  function handleDeleteVehicle(vehicle) {
    Alert.alert("Delete Car", `Delete ${vehicle.brand} ${vehicle.model}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await deleteVehicle(vehicle.id);
          const sel = await getSelectedVehicle();
          if (sel?.id === vehicle.id) { await removeSelectedVehicle(); setSelectedVehicleId(null); }
          setVehicles((old) => old.filter((c) => c.id !== vehicle.id));
        } catch (e) { Alert.alert("Delete failed", e.message); }
      }},
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>My Cars</Text>
          <Text style={styles.subtitle}>Manage and track your vehicles</Text>

          {loading ? (
            <ActivityIndicator color="#2D7EEB" size="large" style={{ marginTop: 50 }} />
          ) : (
            <>
              {vehicles.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id;
                const shouldColor = vehicle.color_hex && !SKIP_COLOR.includes(vehicle.color_hex?.toLowerCase());
                const overlayOpacity = isDark(vehicle.color_hex) ? 0.55 : 0.38;

                return (
                  <View key={vehicle.id} style={styles.cardOuter}>
                    <TouchableOpacity
                      style={[styles.card, isSelected && styles.cardSelected]}
                      activeOpacity={0.85}
                      onPress={() => handleSelectVehicle(vehicle)}
                    >
                      {/* ── Left: text ── */}
                      <View style={styles.cardLeft}>
                        <Text style={styles.carName} numberOfLines={1}>
                          {vehicle.brand} {vehicle.model}
                        </Text>
                        <Text style={styles.carPlate} numberOfLines={1}>
                          Plate number: {vehicle.plate_number}
                        </Text>
                        <TouchableOpacity
                          style={styles.infoBtn}
                          onPress={() => navigation.navigate("CarInfo", { vehicle })}
                        >
                          <Text style={styles.infoBtnText}>Check Car Info</Text>
                        </TouchableOpacity>
                      </View>

                      {/* ── Right: image clipped inside card ── */}
                      <View style={styles.imgClip}>
                        {vehicle.image_url ? (
                          <>
                            <Image
                              source={{ uri: vehicle.image_url }}
                              style={styles.img}
                            />
                            {shouldColor && (
                              <View style={[StyleSheet.absoluteFill, {
                                backgroundColor: vehicle.color_hex,
                                opacity: overlayOpacity,
                              }]} />
                            )}
                          </>
                        ) : (
                          <FontAwesome5 name="car" size={36} color="#d0d4e0" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* ── Delete: red circle on top-right corner of card ── */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteVehicle(vehicle)}
                    >
                      <Ionicons name="trash" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Add card */}
              <View style={styles.addCard}>
                <Text style={styles.addTitle}>Add another car</Text>
                <Text style={styles.addSub}>Plate number........</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => navigation.navigate("AddCar")}
                >
                  <Text style={styles.addBtnText}>ADD YOUR CAR</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home" size={21} color="black" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Diagnose")}>
          <MaterialIcons name="manage-search" size={22} color="black" />
          <Text style={styles.navText}>Diagnose</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <FontAwesome5 name="car" size={18} color="#006fff" />
          <Text style={[styles.navText, { color: "#006fff" }]}>Cars</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person" size={20} color="black" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#dde5fb" },
  content: {
    paddingTop: 55,
    paddingBottom: 100,
    alignItems: "center",   // centers all cards horizontally
  },
  title: { fontSize: 30, fontWeight: "800", color: "black", alignSelf: "flex-start", marginLeft: 28 },
  subtitle: { fontSize: 14, color: "#888", marginTop: 6, marginBottom: 28, alignSelf: "flex-start", marginLeft: 28 },

  // ── Card outer: position:relative so delete btn can anchor to it ──
  cardOuter: {
    width: CARD_W,
    marginBottom: 20,
    position: "relative",
  },

  // ── Card ──
  card: {
    width: "100%",
    height: CARD_H,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    flexDirection: "row",
    overflow: "hidden",       // keeps image clipped inside rounded card
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSelected: { borderColor: "#2D7EEB", borderWidth: 2 },

  // Left 48%: name, plate, button
  cardLeft: {
    width: "48%",
    paddingLeft: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  carName: { fontSize: 16, fontWeight: "800", color: "black" },
  carPlate: { fontSize: 11, color: "#b0b0b0", fontWeight: "500", marginTop: 4 },
  infoBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#2D7EEB",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
  },
  infoBtnText: { color: "white", fontSize: 11, fontWeight: "700" },

  // Right 52%: image clipped — zoomed to show front of car
  imgClip: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "54%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    width: CARD_W * 1.1,     // bigger = more zoom
    height: CARD_H * 1.35,
    position: "absolute",
    right: -CARD_W * 0.44,  // slight left from 0.48
    top: -(CARD_H * 0.15),
    resizeMode: "contain",
  },

  // ── Delete button: RED circle, top-right of card ──
  deleteBtn: {
    position: "absolute",
    top: -12,
    right: -12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff3b30",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },

  // ── Add card ──
  addCard: {
    width: CARD_W,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    padding: 18,
    minHeight: 115,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  addTitle: { fontSize: 17, fontWeight: "800", color: "black" },
  addSub: { marginTop: 10, fontSize: 12, color: "#c0c0c0", fontWeight: "500" },
  addBtn: {
    alignSelf: "flex-end",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#b8c7ff",
    borderRadius: 6,
  },
  addBtnText: { color: "#9aadff", fontSize: 11, fontWeight: "900" },

  // ── Bottom nav ──
  nav: {
    position: "absolute", bottom: 0, width: "100%", height: 65,
    backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#e5e5e5",
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
  },
  navItem: { alignItems: "center", justifyContent: "center" },
  navText: { color: "black", fontSize: 10, marginTop: 4, fontWeight: "600" },
});