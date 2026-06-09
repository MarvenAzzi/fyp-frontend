import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";

import Logo from "./assets/logo1_transparent.png";
import { isStrongPassword, getPasswordErrorMessage, register } from "./src/api/auth";

const screenWidth = Dimensions.get("window").width;

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, maxLength, rightIcon }) {
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
        keyboardType={keyboardType || "default"}
        maxLength={maxLength}
        autoCapitalize="none"
      />
      {rightIcon}
    </View>
  );
}

export default function Signup({ navigation }) {
  const [checked, setChecked] = useState(false);
  const [logoReady, setLogoReady] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLogo() {
      await Asset.loadAsync(Logo);
      setLogoReady(true);
    }
    loadLogo();
  }, []);

  function handlePhoneChange(text) {
    setPhoneNumber(text.replace(/[^0-9]/g, "").slice(0, 8));
  }

  async function handleSignup() {
    if (!username || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }
    if (phoneNumber.length !== 8) {
      Alert.alert("Invalid phone number", "Please enter your 8 digit phone number without +961.");
      return;
    }
    if (!isStrongPassword(password)) {
      Alert.alert("Weak password", getPasswordErrorMessage());
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password error", "Passwords do not match.");
      return;
    }
    if (!checked) {
      Alert.alert("Terms required", "Please agree to the Terms and Conditions.");
      return;
    }
    try {
      setLoading(true);
      await register(username, phoneNumber, email, password);
      Alert.alert("Success", "Account created successfully.");
      navigation.navigate("Signin");
    } catch (error) {
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!logoReady) return null;

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
            <Text style={styles.title}>Welcome To VAGDIAG</Text>
            <Text style={styles.subtitle}>Create Account</Text>

            <InputField
              icon="person-outline"
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />
            <InputField
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <InputField
              icon="call-outline"
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              maxLength={8}
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
            <InputField
              icon="lock-closed-outline"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={19} color="#b0bff8" />
                </TouchableOpacity>
              }
            />

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setChecked(!checked)} activeOpacity={0.8}>
              <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                {checked && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkText}>Terms and Conditions.</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>SIGN UP</Text>}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signin")}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    paddingTop: 28,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "black",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginBottom: 28,
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
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    paddingVertical: 0,
  },

  // ── Terms ──
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 32,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: "#c0c8e8",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  checkboxActive: {
    backgroundColor: "#6b7cdd",
    borderColor: "#6b7cdd",
  },
  termsText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
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
  },

  // ── Footer ──
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#aaa",
  },
  linkText: {
    fontSize: 14,
    color: "#6b7cdd",
    fontWeight: "700",
  },
});
