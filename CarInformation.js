import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function CarInformation({ navigation, route }) {
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    const car = route?.params?.vehicle;

    if (!car) {
      Alert.alert("No car found", "No car information was found.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }

    setVehicle(car);
  }, [route]);

  if (!vehicle) {
    return <View style={styles.mainScreen} />;
  }

  return (
    <View style={styles.mainScreen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={18} color="#555" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>


        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Car Information</Text>

          <InfoRow
            icon="car"
            label="Brand"
            value={vehicle.brand || "N/A"}
          />

          <InfoRow
            icon="car"
            label="Model"
            value={vehicle.model || "N/A"}
          />

          <InfoRow
            icon="calendar-month-outline"
            label="Year"
            value={vehicle.year ? String(vehicle.year) : "N/A"}
          />

          <InfoRow
            icon="dots-grid"
            label="Plate Number"
            value={vehicle.plate_number || "N/A"}
          />

          <InfoRow
            icon="dots-grid"
            label="VIN Number"
            value={vehicle.vin || "N/A"}
          />

          <InfoRow
            icon="dots-grid"
            label="Engine Type"
            value={vehicle.engine_type || "N/A"}
          />

          <InfoRow
            icon="dots-grid"
            label="Current Mileage"
            value={
              vehicle.current_mileage
                ? `${vehicle.current_mileage} KM`
                : "N/A"
            }
          />

          <InfoRow
            icon="color-palette-outline"
            label="Color"
            value={vehicle.color || "N/A"}
          />

          <Text style={styles.historyTitle}>Error History</Text>

          <View style={styles.emptyHistoryBox}>
            <Text style={styles.emptyHistoryText}>
              No error history available yet.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={22} color="#c5c9d2" />

      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  backButton: {
    marginTop: 45,
    marginLeft: 8,
    width: 90,
    height: 35,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#eeeeee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 5,
  },

  infoSection: {
    width: "100%",
    backgroundColor: "#cdd8ff",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 32,
    paddingHorizontal: 32,
    paddingBottom: 50,
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "700",
    textAlign: "center",
    color: "black",
    marginBottom: 22,
  },

  infoRow: {
    width: "100%",
    height: 42,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  infoLabel: {
    fontSize: 15,
    color: "#9fa3ad",
    marginLeft: 10,
    flex: 1,
  },

  infoValue: {
    fontSize: 15,
    color: "#8f9299",
    maxWidth: 140,
    textAlign: "right",
  },

  historyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "black",
    marginTop: 8,
    marginBottom: 12,
  },

  emptyHistoryBox: {
    width: "100%",
    height: 85,
    backgroundColor: "white",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyHistoryText: {
    fontSize: 15,
    color: "#9fa3ad",
    fontWeight: "600",
  },
});