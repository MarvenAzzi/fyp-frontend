import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import { useFonts, Outfit_700Bold, Outfit_400Regular } from "@expo-google-fonts/outfit";
import { Inter_700Bold, Inter_500Medium } from "@expo-google-fonts/inter";
import CheckBox from "expo-checkbox";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Logo from "./assets/logo1_transparent.png";
import { login } from "./src/api/auth";

const screenWidth = Dimensions.get("window").width;

export default function Signin({ navigation }) {
  const [isChecked, setChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loadFont] = useFonts({ Outfit_700Bold, Inter_700Bold, Outfit_400Regular, Inter_500Medium });

  async function handleSignin() {
    if (!username || !password) {
      Alert.alert("Missing fields", "Please enter your username and password.");
      return;
    }
    try {
      setLoading(true);
      const data = await login(username, password);
      navigation.replace("Home");
    } catch (error) {
      Alert.alert("Signin failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!loadFont) return null;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Arc header with logo ── */}
          <LinearGradient
            colors={["#8fa7ff", "#b8c8ff", "#dce5ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerContainer}
          >
            <Image source={Logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.slogan}>Diagnose. Understand. Fix</Text>
          </LinearGradient>

          {/* ── Form ── */}
          <View style={styles.form}>
            <Text style={styles.title}>Sign In Now</Text>

            <InputField
              icon="person-outline"
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <InputField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={19} color="#b0bff8" />
                </TouchableOpacity>
              }
            />

            {/* Remember me + Forgot password */}
            <View style={styles.rememberRow}>
              <View style={styles.rememberLeft}>
                <CheckBox
                  value={isChecked}
                  onValueChange={setChecked}
                  color={isChecked ? "#7b8cde" : undefined}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>Remember me</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("EmailForForgetPassword")}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, keyboardType, rightIcon }) {
  return (
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={19} color="#b0bff8" style={{ marginRight: 12 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aab0c0"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize || "sentences"}
        keyboardType={keyboardType || "default"}
      />
      {rightIcon}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },

  // ── Arc header ──
  headerContainer: {
    width: screenWidth,
    height: 240,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  slogan: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
    letterSpacing: 1.4,
    marginTop: -28,
    marginBottom: 10,
  },

  logo: {
    width: screenWidth * 0.72,
    height: 210,
    alignSelf: "center",
    marginTop: 30,
  },

  // ── Form ──
  form: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "black",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "Outfit_700Bold",
  },

  // ── Input ──
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#dcdfe8",
    borderRadius: 22,
    height: 50,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    fontFamily: "Inter_500Medium",
    paddingVertical: 0,
  },

  // ── Remember row ──
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 36,
    paddingHorizontal: 4,
  },
  rememberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  rememberText: {
    fontSize: 13,
    color: "#888",
    fontFamily: "Inter_500Medium",
  },

  // ── Button ──
  button: {
    backgroundColor: "#8f9cdd",
    borderRadius: 28,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8f9cdd",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: "Inter_700Bold",
  },

  // ── Footer ──
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  footerText: {
    fontSize: 14,
    color: "#aaa",
    fontFamily: "Inter_500Medium",
  },
  linkText: {
    fontSize: 14,
    color: "#6b7cdd",
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
