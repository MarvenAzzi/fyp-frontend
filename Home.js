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

const screenWidth = Dimensions.get("window").width;

export default function Home({ navigation }) {
  const [imagesReady, setImagesReady] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
                <Text style={styles.greeting}>Good Morning,</Text>

                <Text style={styles.name}>{username || "User"}</Text>

                <Text style={styles.selectedCarText}>
                  {getSelectedCarName()}
                </Text>
              </View>

              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications" size={22} color="#6ea0ff" />
                <View style={styles.redDot} />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.content}>
          <View style={styles.topCards}>
            <View style={styles.diagnoseCard}>
              <Image source={CarImage} style={styles.carImage} />

              <Text style={styles.diagnoseTitle}>Start Diagnosis Now!!</Text>

              <TouchableOpacity
                style={styles.diagnoseButton}
                onPress={handleDiagnosePress}
              >
                <Text style={styles.diagnoseButtonText}>Diagnose</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rightCards}>
              <View style={styles.statusCard}>
                <View style={styles.statusTop}>
                  <View style={styles.iconBox}>
                    <FontAwesome5 name="car" size={14} color="#8faeff" />
                  </View>

                  <View>
                    <Text style={styles.cardTitle}>Car Status</Text>
                    <Text style={styles.cardSubtitle}>Engine Status</Text>
                  </View>
                </View>

                <View style={styles.statusBottom}>
                  <View style={styles.noneBadge}>
                    <Text style={styles.noneText}>NONE</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.historyCard} onPress={handleOpenHistory}>
                <View style={styles.historyTop}>
                  <View style={styles.iconBox}>
                    <MaterialIcons name="history" size={17} color="#8faeff" />
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
    fontSize: 20,
    fontWeight: "800",
    color: "black",
  },

  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "black",
    marginTop: 2,
  },

  selectedCarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2d7eff",
    marginTop: 15,
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

  redDot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3b30",
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
    width: "52%",
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
    width: "38%",
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

  noneBadge: {
    backgroundColor: "#f1f2f6",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 5,
  },

  noneText: {
    color: "#7a7d86",
    fontSize: 9,
    fontWeight: "800",
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
    height: 58,
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