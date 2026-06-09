import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";

import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAuthUser, logout } from "./src/api/auth";

const screenWidth = Dimensions.get("window").width;

export default function Profile({ navigation }) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getAuthUser();
        if (user && user.username) setUsername(user.username);
      } catch (error) {
        console.log("Profile load user error:", error);
      }
    }
    loadUser();
  }, []);

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            navigation.replace("Signin");
          } catch (error) {
            Alert.alert("Error", "Could not sign out. Please try again.");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.mainScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="#c0caf5" />

      {/* ── Curved gradient header ── */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={["#b0bde8", "#c8d3f5", "#dce5ff"]}
          style={styles.header}
        >
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {username ? username.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Ionicons name="pencil" size={13} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>{username || "User"}</Text>
        </LinearGradient>
      </View>

      {/* ── Menu items ── */}
      <View style={styles.content}>
        <MenuItem
          icon={<Ionicons name="person-outline" size={22} color="#8fa7ff" />}
          label="Account Information"
          onPress={() => navigation.navigate("AccountInformation")}
        />
        <MenuItem
          icon={<Ionicons name="car-sport-outline" size={22} color="#8fa7ff" />}
          label="My Cars"
          onPress={() => navigation.navigate("MyCars")}
        />
        <MenuItem
          icon={<Ionicons name="log-out-outline" size={22} color="#8fa7ff" />}
          label="Sign Out"
          onPress={handleSignOut}
        />
      </View>

      {/* ── Bottom nav ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home-outline" size={22} color="black" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Diagnose")}>
          <MaterialIcons name="manage-search" size={23} color="black" />
          <Text style={styles.navText}>Diagnose</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MyCars")}>
          <FontAwesome5 name="car" size={18} color="black" />
          <Text style={styles.navText}>Cars</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={21} color="#006fff" />
          <Text style={styles.activeNavText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconBox}>{icon}</View>
        <Text style={styles.menuText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#c0c0c0" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  headerContainer: {
    width: "100%",
    alignItems: "center",
    overflow: "hidden",
    height: 300,
  },
  header: {
    width: screenWidth * 1.6,
    paddingTop: 60,
    paddingBottom: 55,
    borderBottomLeftRadius: screenWidth * 1.0,
    borderBottomRightRadius: screenWidth * 1.0,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#7f9cff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: "white",
    fontSize: 40,
    fontWeight: "800",
  },
  editButton: {
    position: "absolute",
    right: 0,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8fa7ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  username: {
    fontSize: 26,
    fontWeight: "800",
    color: "black",
  },

  // ── Menu ──
  content: {
    marginTop: 48,
    alignItems: "center",
    gap: 18,
  },
  menuItem: {
    width: screenWidth - 56,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#f4f5f7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#eef1ff",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
  },

  // ── Bottom nav ──
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
