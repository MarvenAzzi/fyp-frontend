import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert
} from "react-native";

import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";

import CarImage from "./assets/car-blue.png";
import MapImage from "./assets/maps.png";
import HeaderBg from "./assets/homeheader.png";

import { getAuthUser } from "./src/api/auth";
import { getSelectedVehicle } from "./src/api/vehicles";
import { getLatestScan } from "./src/api/diagnostics";
import { calculateReminders, getBadgeCount } from "./src/utils/serviceReminders";

const screenWidth = Dimensions.get("window").width;

export default function Home({ navigation }) {
  const [imagesReady, setImagesReady] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [notifBadge, setNotifBadge] = useState(0);

  function formatLastScanned(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return `Today, ${time}`;
    if (diffDays === 1) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString()}, ${time}`;
  }

  async function loadHomeData() {
    try {
      const user = await getAuthUser();
      const vehicle = await getSelectedVehicle();

      if (user && user.username) {
        setUsername(user.username);
      } else {
        setUsername("");
      }

      setSelectedVehicle(vehicle);

      if (vehicle) {
        try {
          const data = await getLatestScan(vehicle.id);
          setLastScan(data.scan ?? null);
        } catch (_) {
          setLastScan(null);
        }
        const reminders = calculateReminders(vehicle.current_mileage, vehicle.engine_type, vehicle.id);
        setNotifBadge(getBadgeCount(reminders));
      } else {
        setLastScan(null);
        setNotifBadge(0);
      }
    } catch (error) {
      console.log("Home load error:", error);
    }
  }

  useEffect(() => {
    async function prepareHome() {
      try {
        await Asset.loadAsync([CarImage, MapImage, HeaderBg]);
        await loadHomeData();
      } catch (error) {
        console.log("Home prepare error:", error);
      } finally {
        setImagesReady(true);
      }
    }

    prepareHome();

    const unsubscribe = navigation.addListener("focus", () => {
      loadHomeData();
    });

    return unsubscribe;
  }, [navigation]);

  function getSelectedCarName() {
    if (!selectedVehicle) {
      return null;
    }

    return `${selectedVehicle.brand} ${selectedVehicle.model}`;
  }

  async function handleDiagnosePress() {
    try {
      const vehicle = await getSelectedVehicle();

      if (!vehicle) {
        Alert.alert(
          "No car connected",
          "Please connect a car to diagnose."
        );
        return;
      }

      navigation.navigate("Diagnose");
    } catch (error) {
      console.log("Diagnose open error:", error);

      Alert.alert(
        "No car connected",
        "Please connect a car to diagnose."
      );
    }
  }

  async function handleOpenHistory() {
    try {
      const vehicle = await getSelectedVehicle();

      if (!vehicle) {
        Alert.alert("No car selected", "Please select a car first.");
        return;
      }

      navigation.navigate("CarInformation", {
        vehicle,
      });
    } catch (error) {
      console.log("Open history error:", error);
      Alert.alert("No car found", "Could not open car information.");
    }
  }

  return (
    <View style={styles.mainScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fc" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ImageBackground
            source={HeaderBg}
            style={styles.headerImage}
            resizeMode="stretch"
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTextBox}>
                {selectedVehicle ? (
                  <>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.name}>{username || "User"}</Text>
                    <View style={styles.carPill}>
                      <FontAwesome5 name="car" size={10} color="#2d7eff" />
                      <Text style={styles.selectedCarText} numberOfLines={1}>
                        {getSelectedCarName()}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.greeting}>Welcome to</Text>
                    <Text style={styles.nameBlue}>VAGDIAG</Text>
                    <Text style={styles.newUserHint}>Add a car to get started</Text>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate("Notifications", { vehicle: selectedVehicle })}
              >
                <Ionicons name="notifications-outline" size={22} color="#6ea0ff" />
                {notifBadge > 0 && (
                  <View style={styles.redBadge}>
                    <Text style={styles.redBadgeText}>
                      {notifBadge > 9 ? "9+" : notifBadge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.content}>
          <View style={styles.topCards}>
            <View style={styles.diagnoseCard}>
              <Image
                source={selectedVehicle?.image_url ? { uri: selectedVehicle.image_url } : CarImage}
                style={styles.carImage}
              />

              <Text style={styles.diagnoseTitle}>Start Diagnosis Now!!</Text>

              <TouchableOpacity
                style={styles.diagnoseButton}
                onPress={handleDiagnosePress}
              >
                <Text style={styles.diagnoseButtonText}>Diagnose</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rightCards}>
              <View style={[
                styles.statusCard,
                lastScan && (lastScan.overall_status === "faulty"
                  ? { borderLeftWidth: 3, borderLeftColor: "#ef4444" }
                  : { borderLeftWidth: 3, borderLeftColor: "#22c55e" })
              ]}>
                <View style={styles.statusTop}>
                  <View style={styles.iconBox}>
                    <FontAwesome5 name="car" size={14} color="#8faeff" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Car Status</Text>
                    <Text style={styles.cardSubtitle}>Engine Status</Text>
                  </View>
                </View>

                {lastScan ? (
                  <View style={[
                    styles.statusBadge,
                    lastScan.overall_status === "faulty"
                      ? styles.statusBadgeFaulty
                      : styles.statusBadgeHealthy,
                  ]}>
                    <Ionicons
                      name={lastScan.overall_status === "faulty" ? "close-circle" : "checkmark-circle"}
                      size={20}
                      color={lastScan.overall_status === "faulty" ? "#ef4444" : "#22c55e"}
                    />
                    <View>
                      <Text style={[
                        styles.statusBadgeText,
                        { color: lastScan.overall_status === "faulty" ? "#ef4444" : "#16a34a" }
                      ]}>
                        {lastScan.overall_status === "faulty" ? "Faulty" : "Healthy"}
                      </Text>
                      <Text style={styles.lastScannedText}>
                        {formatLastScanned(lastScan.scanned_at)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.statusBottom}>
                    <Text style={styles.noScanText}>No scan yet</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.historyCard} onPress={handleOpenHistory}>
                <View style={styles.historyTop}>
                  <View style={styles.iconBox}>
                    <MaterialIcons name="receipt-long" size={17} color="#8faeff" />
                  </View>

                  <Ionicons name="chevron-forward" size={22} color="#111" />
                </View>

                <Text style={styles.historyTitle}>History</Text>

                <Text style={styles.historySubtitle}>
                  Check your diagnostic{"\n"}history
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mapCard}>
            <View style={styles.mapLeft}>
              <Text style={styles.mapTitle}>
                Find your closest{"\n"}garage station
              </Text>

              <TouchableOpacity style={styles.directionButton} onPress={() => navigation.navigate("GarageMap")}>
                <Text style={styles.directionButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>

            <Image source={MapImage} style={styles.mapImage} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={21} color="#006fff" />
          <Text style={styles.activeNavText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={handleDiagnosePress}
        >
          <MaterialIcons name="manage-search" size={22} color="black" />
          <Text style={styles.navText}>Diagnose</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MyCars")}
        >
          <FontAwesome5 name="car" size={17} color="black" />
          <Text style={styles.navText}>Cars</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person" size={19} color="black" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "#f7f8fc",
  },

  header: {
    height: 250,
    backgroundColor: "#f7f8fc",
    overflow: "hidden",
  },

  headerImage: {
    width: screenWidth + 160,
    height: 290,
    marginLeft: -80,
    marginTop: -95,
  },

  headerContent: {
    paddingTop: 135,
    paddingHorizontal: 100,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerTextBox: {
    maxWidth: 190,
  },

  greeting: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 0.3,
  },

  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    marginTop: 2,
  },

  nameBlue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2d7eff",
    marginTop: 2,
    letterSpacing: -0.5,
  },

  carPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    backgroundColor: "rgba(45,126,255,0.10)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  selectedCarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2d7eff",
    maxWidth: 120,
  },

  newUserHint: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
    marginTop: 8,
  },

  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  redBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
  },

  redBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },

  content: {
    marginTop: 5,
    paddingHorizontal: 12,
    paddingBottom: 90,
  },

  topCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  diagnoseCard: {
    width: "54%",
    height: 285,
    backgroundColor: "white",
    borderRadius: 12,
    paddingTop: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },

  carImage: {
    width: 150,
    height: 120,
    resizeMode: "contain",
    marginTop: 10,
  },

  diagnoseTitle: {
    width: "100%",
    fontSize: 13,
    fontWeight: "700",
    color: "black",
    marginTop: 34,
    paddingLeft: 12,
  },

  diagnoseButton: {
    width: 130,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2d7eff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },

  diagnoseButtonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },

  rightCards: {
    width: "43%",
  },

  statusCard: {
    height: 132,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  statusTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#eef3ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "black",
  },

  cardSubtitle: {
    fontSize: 9,
    color: "#b4b4b4",
    marginTop: 8,
  },

  statusBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 25,
  },

  noScanText: {
    fontSize: 11,
    color: "#b4b4b4",
    fontWeight: "500",
    fontStyle: "italic",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statusBadgeHealthy: { backgroundColor: "#f0fdf4" },
  statusBadgeFaulty:  { backgroundColor: "#fff1f1" },

  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },

  lastScannedText: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 2,
  },

  historyCard: {
    height: 137,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  historyTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "black",
    marginTop: 12,
  },

  historySubtitle: {
    fontSize: 9,
    color: "#b4b4b4",
    marginTop: 6,
    lineHeight: 12,
  },

  mapCard: {
    width: "100%",
    height: 135,
    backgroundColor: "white",
    borderRadius: 14,
    marginTop: 26,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  mapLeft: {
    width: "50%",
    paddingLeft: 15,
    paddingTop: 18,
    zIndex: 2,
  },

  mapTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "black",
    lineHeight: 18,
  },

  directionButton: {
    width: 132,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2d7eff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  directionButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },

  mapImage: {
    position: "absolute",
    right: 0,
    width: "58%",
    height: "100%",
    resizeMode: "cover",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 75,
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

  activeNavText: {
    color: "#006fff",
    fontSize: 10,
    marginTop: 3,
    fontWeight: "700",
  },

  navText: {
    color: "black",
    fontSize: 10,
    marginTop: 3,
    fontWeight: "600",
  },
});