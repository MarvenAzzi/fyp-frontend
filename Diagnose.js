import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";

import { useState, useCallback } from "react";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { getSelectedVehicle } from "./src/api/vehicles";

const screenWidth = Dimensions.get("window").width;

export default function Diagnose({ navigation }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  async function loadSelectedVehicle() {
    try {
      const vehicle = await getSelectedVehicle();

      if (!vehicle) {
        setSelectedVehicle(null);

        Alert.alert(
          "No car connected",
          "Please connect a car to diagnose.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("MyCars"),
            },
          ]
        );

        return;
      }

      setSelectedVehicle(vehicle);
    } catch (error) {
      console.log("Load selected vehicle error:", error);

      Alert.alert(
        "No car connected",
        "Please connect a car to diagnose.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("MyCars"),
          },
        ]
      );
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSelectedVehicle();
    }, [])
  );

  function getSelectedCarName() {
    if (!selectedVehicle) {
      return "No Car Connected";
    }

    const brand =
      selectedVehicle.brand ||
      selectedVehicle.car_brand ||
      selectedVehicle.carBrand ||
      "";

    const model =
      selectedVehicle.model ||
      selectedVehicle.car_model ||
      selectedVehicle.carModel ||
      "";

    return `${brand} ${model}`.trim();
  }

  function handleRunDiagnosis() {
    if (!selectedVehicle) {
      Alert.alert("No car connected", "Please connect a car to diagnose.");
      return;
    }

    Alert.alert("Diagnosis Started", "Full engine scan started.");
  }

  return (
    <View style={styles.mainScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Text allowFontScaling={false} style={styles.carName}>
            {getSelectedCarName()}
          </Text>

          <Text allowFontScaling={false} style={styles.connectedText}>
            {selectedVehicle ? "Connected" : "Not Connected"}
          </Text>

          <View style={styles.carImageSpace} />
        </View>

        <View style={styles.card}>
          <View style={styles.topCardRow}>
            <TouchableOpacity
              style={styles.runBox}
              onPress={handleRunDiagnosis}
              activeOpacity={0.8}
            >
              <View style={styles.playCircle}>
                <Ionicons name="play" size={14} color="white" />
              </View>

              <View style={styles.runTextBox}>
                <Text allowFontScaling={false} style={styles.runText}>
                  Run Diagnosis
                </Text>

                <Text allowFontScaling={false} style={styles.runSubText}>
                  Start full engine scan
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.mileageCircle}>
              <Text allowFontScaling={false} style={styles.mileageDash}>
                —
              </Text>

              <Text allowFontScaling={false} style={styles.kmText}>
                KM
              </Text>

              <Text allowFontScaling={false} style={styles.totalText}>
                Total Mileage
              </Text>
            </View>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.smallBox}>
              <MaterialIcons
                name="settings-input-component"
                size={26}
                color="#0071ff"
              />

              <Text allowFontScaling={false} style={styles.boxTitle}>
                Engine
              </Text>

              <Text allowFontScaling={false} style={styles.dash}>
                —
              </Text>

              <Text allowFontScaling={false} style={styles.boxSubtitle}>
                Engine{"\n"}Temperature
              </Text>
            </View>

            <View style={styles.smallBox}>
              <View style={styles.warningCircle}>
                <Ionicons name="warning-outline" size={20} color="white" />
              </View>

              <Text allowFontScaling={false} style={styles.boxTitle}>
                Error Log
              </Text>

              <Text allowFontScaling={false} style={styles.dash}>
                —
              </Text>

              <Text allowFontScaling={false} style={styles.boxSubtitle}>
                No errors yet
              </Text>
            </View>
          </View>

          <View style={styles.vehicleStatusBox}>
            <View style={styles.statusIconBox}>
              <Ionicons
                name="document-text-outline"
                size={33}
                color="#9b9b9b"
              />
            </View>

            <View style={styles.vehicleTextBox}>
              <Text allowFontScaling={false} style={styles.statusTitle}>
                Vehicle Status
              </Text>

              <Text allowFontScaling={false} style={styles.statusDash}>
                —
              </Text>

              <Text allowFontScaling={false} style={styles.statusSubtitle}>
                Scan not Started
              </Text>
            </View>
          </View>

          <View style={styles.lastScannedBox}>
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color="#344054"
            />

            <Text allowFontScaling={false} style={styles.lastScannedText}>
              Last Scanned:  —
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home" size={22} color="black" />
          <Text allowFontScaling={false} style={styles.navText}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="manage-search" size={25} color="#006fff" />
          <Text allowFontScaling={false} style={styles.activeNavText}>
            Diagnose
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MyCars")}
        >
          <FontAwesome5 name="car" size={18} color="black" />
          <Text allowFontScaling={false} style={styles.navText}>
            Cars
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person" size={21} color="black" />
          <Text allowFontScaling={false} style={styles.navText}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  topSection: {
    alignItems: "center",
    paddingTop: 45,
  },

  carName: {
    fontSize: 17,
    color: "black",
    fontWeight: "400",
  },

  connectedText: {
    fontSize: 15,
    color: "#0051FF",
    marginTop: 10,
  },

  carImageSpace: {
    width: screenWidth,
    height: 170,
    marginTop: 35,
    backgroundColor: "white",
  },

  card: {
    width: screenWidth - 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#DCDDE1",
    borderRadius: 8,
    paddingTop: 40,
    paddingBottom: 24,
    marginBottom: 90,
    backgroundColor: "#ffffff",
  },

  topCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    alignItems: "center",
  },

  runBox: {
    width: 165,
    height: 70,
    backgroundColor: "#f1f5ff",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
  },

  playCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  runTextBox: {
    justifyContent: "center",
  },

  runText: {
    color: "#0051FF",
    fontSize: 13,
    fontWeight: "700",
  },

  runSubText: {
    color: "#7d8592",
    fontSize: 10,
    marginTop: 7,
  },

  mileageCircle: {
    width: 115,
    height: 115,
    borderRadius: 58,
    borderWidth: 7,
    borderColor: "#cfd1d4",
    justifyContent: "center",
    alignItems: "center",
  },

  mileageDash: {
    color: "#b8b8b8",
    fontSize: 34,
    marginBottom: -4,
  },

  kmText: {
    color: "#334155",
    fontSize: 9,
    fontWeight: "700",
  },

  totalText: {
    color: "#334155",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 7,
  },

  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 43,
    marginTop: 35,
  },

  smallBox: {
    width: 115,
    height: 132,
    backgroundColor: "#fafafa",
    paddingLeft: 13,
    paddingTop: 13,
    paddingRight: 8,
    overflow: "hidden",
  },

  warningCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ff6f86",
    justifyContent: "center",
    alignItems: "center",
  },

  boxTitle: {
    color: "black",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },

  dash: {
    color: "#b8b8b8",
    fontSize: 16,
    marginTop: 8,
  },

  boxSubtitle: {
    color: "#667085",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
    lineHeight: 12,
  },

  vehicleStatusBox: {
    width: screenWidth - 78,
    height: 70,
    borderWidth: 2,
    borderColor: "#c9c9c9",
    borderRadius: 5,
    alignSelf: "center",
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
    backgroundColor: "#fdfdfd",
  },

  statusIconBox: {
    width: 43,
    height: 43,
    borderWidth: 1,
    borderColor: "#b9b9b9",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 17,
    backgroundColor: "#fdfdfd",
  },

  vehicleTextBox: {
    justifyContent: "center",
  },

  statusTitle: {
    fontSize: 12,
    color: "black",
  },

  statusDash: {
    color: "#b8b8b8",
    fontSize: 16,
    marginTop: 5,
  },

  statusSubtitle: {
    fontSize: 10,
    color: "#667085",
    fontWeight: "700",
    marginTop: 1,
  },

  lastScannedBox: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  lastScannedText: {
    color: "#9ca3af",
    fontSize: 12,
    marginLeft: 6,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 62,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  navText: {
    color: "black",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },

  activeNavText: {
    color: "#006fff",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "700",
  },
});