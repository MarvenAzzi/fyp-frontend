import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

function InfoRow({ icon, iconSet = "MaterialCommunityIcons", label, value }) {
  const Icon =
    iconSet === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Icon
          name={icon}
          size={18}
          color="#b0b4c1"
          style={{ marginRight: 10 }}
        />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value ?? "—"}</Text>
    </View>
  );
}

export default function CarInfo({ route, navigation }) {
  const { vehicle } = route.params;

  return (
    <View style={styles.screen}>

      {/* ── White top area: back button + car image ── */}
      <View style={styles.imageArea}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={18} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {vehicle.image_url ? (
          <Image
            source={{ uri: vehicle.image_url }}
            style={styles.carImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="car" size={90} color="#d0d4e0" />
          </View>
        )}
      </View>

      {/* ── Blue info card with rounded top corners ── */}
      <ScrollView
        style={styles.infoCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <Text style={styles.cardTitle}>Car Information</Text>

        <InfoRow icon="car"              iconSet="Ionicons" label="Brand"          value={vehicle.brand} />
        <InfoRow icon="car"              iconSet="Ionicons" label="Model"          value={vehicle.model} />
        <InfoRow icon="calendar-outline" iconSet="Ionicons" label="Year"           value={vehicle.year?.toString()} />
        <InfoRow icon="dots-grid"                           label="Plate Number"   value={vehicle.plate_number} />
        <InfoRow icon="dots-grid"                           label="VIN Number"     value={vehicle.vin} />
        <InfoRow icon="dots-grid"                           label="Engine Type"    value={vehicle.engine_type} />
        <InfoRow icon="dots-grid"                           label="Current Mileage" value={vehicle.current_mileage ? `${vehicle.current_mileage} KM` : null} />

        {/* ── Color row — pill badge instead of overlay ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons
              name="color-palette-outline"
              size={18}
              color="#b0b4c1"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.infoLabel}>Color</Text>
          </View>
          {/* Color pill: filled background + text */}
          <View
            style={[
              styles.colorPill,
              {
                backgroundColor: vehicle.color_hex
                  ? vehicle.color_hex + "22"   // 13% opacity background
                  : "#f0f0f0",
                borderColor: vehicle.color_hex ?? "#ddd",
              },
            ]}
          >
            {vehicle.color_hex && (
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: vehicle.color_hex },
                ]}
              />
            )}
            <Text
              style={[
                styles.colorPillText,
                { color: vehicle.color_hex ?? "#555" },
              ]}
            >
              {vehicle.color ?? "—"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f0f3fc",   // same as blue card so no gap shows
  },

  // ── Top white section ──
  imageArea: {
    backgroundColor: "white",
    paddingTop: 54,
    paddingBottom: 20,
    alignItems: "center",
    // No border — card overlaps it with rounded corners
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
  carImage: {
    width: screenWidth,
    height: 280,
    marginTop: 44,
  },
  imagePlaceholder: {
    width: screenWidth,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 44,
  },

  // ── Blue card with rounded top ──
  infoCard: {
    flex: 1,
    backgroundColor: "#dde5fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingHorizontal: 18,
    paddingTop: 28,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "black",
    textAlign: "center",
    marginBottom: 20,
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

  // ── Color pill (new method) ──
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
});