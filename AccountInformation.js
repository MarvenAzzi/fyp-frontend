import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { getAuthUser } from "./src/api/auth";

const screenWidth = Dimensions.get("window").width;

export default function AccountInformation({ navigation }) {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function loadUserInfo() {
      try {
        const user = await getAuthUser();

        if (user) {
          setUsername(user.username || "");
          setPhoneNumber(user.phone_number || "");
          setEmail(user.email || "");
          setPassword(user.plain_password || "");
        }
      } catch (error) {
        console.log("Account information load error:", error);
      }
    }

    loadUserInfo();
  }, []);

  return (
    <View style={styles.mainScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="#cfd9ff" />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color="#4d4d4d" />
        <Text style={styles.backText}>Account Information</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{username || "Not available"}</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.value}>{phoneNumber || "Not available"}</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email || "Not available"}</Text>
          <View style={styles.line} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },

  backButton: {
    position: "absolute",
    top: 42,
    left: 14,
    width: 205,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 2,
  },

  backText: {
    fontSize: 13,
    color: "#4d4d4d",
    marginLeft: 8,
    fontWeight: "500",
  },

  content: {
    marginTop: 120,
    paddingHorizontal: 30,
  },

  infoBlock: {
    marginBottom: 32,
  },

  label: {
    fontSize: 16,
    color: "#246bff",
    fontWeight: "500",
    marginBottom: 28,
  },

  value: {
    fontSize: 14,
    color: "#4b4b4b",
    marginLeft: 4,
    marginBottom: 7,
  },

  line: {
    width: screenWidth - 60,
    height: 1.5,
    backgroundColor: "#7ea2ff",
  },
});