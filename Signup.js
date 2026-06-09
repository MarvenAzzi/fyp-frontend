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
import Logo from "./assets/logo1.png";

import { isStrongPassword, getPasswordErrorMessage } from "./src/api/auth";
import { register } from "./src/api/auth";

const screenWidth = Dimensions.get("window").width;

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
    const onlyDigits = text.replace(/[^0-9]/g, "");
    setPhoneNumber(onlyDigits.slice(0, 8));
  }

  async function handleSignup() {
    if (!username || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }

    if (phoneNumber.length !== 8) {
      Alert.alert(
        "Invalid phone number",
        "Please enter your 8 digit phone number without +961."
      );
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

      const data = await register(username, phoneNumber, email, password);

      console.log("Registered user:", data.user);

      Alert.alert("Success", "Account created successfully.");
      navigation.navigate("Signin");
    } catch (error) {
      console.log("Signup error:", error);
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!logoReady) {
    return null;
  }

  return (
    <View style={styles.mainScreen}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.mainScreen}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.page}>
              <View style={styles.topBox}>
                <Image source={Logo} style={styles.logo} resizeMode="stretch" />
              </View>

              <Text style={styles.bigText}>Welcome To VAGDIAG</Text>

              <Text style={styles.smallTitle}>Create Account</Text>

              <View style={styles.formBox}>
                <View style={styles.inputBox}>
                  <Ionicons
                    name="person"
                    size={18}
                    color="#b8c7ff"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#c5c8d3"
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>

                <View style={styles.inputBox}>
                  <Ionicons
                    name="mail"
                    size={18}
                    color="#b8c7ff"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#c5c8d3"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputBox}>
                  <Ionicons
                    name="call"
                    size={18}
                    color="#b8c7ff"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor="#c5c8d3"
                    keyboardType="number-pad"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    maxLength={8}
                  />
                </View>

                <View style={styles.inputBox}>
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color="#b8c7ff"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#c5c8d3"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color="#b8c7ff"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputBox}>
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color="#b8c7ff"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#c5c8d3"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={18}
                      color="#b8c7ff"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.termsBox}>
                  <TouchableOpacity
                    style={[styles.checkBox, checked && styles.checkBoxActive]}
                    onPress={() => setChecked(!checked)}
                    activeOpacity={0.8}
                  >
                    {checked && (
                      <Ionicons name="checkmark" size={13} color="white" />
                    )}
                  </TouchableOpacity>

                  <Text style={styles.termsText}>
                    I agree to the{" "}
                    <Text style={styles.blueText}>Terms and Conditions.</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>SIGN UP</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.loginBox}>
                  <Text style={styles.loginText}>
                    Already have an account?{" "}
                  </Text>

                  <TouchableOpacity
                    onPress={() => navigation.navigate("Signin")}
                  >
                    <Text style={styles.blueText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: "white",
  },

  page: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
  },

  topBox: {
    width: screenWidth,
    height: 185,
    backgroundColor: "#eceaff",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    overflow: "hidden",
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  bigText: {
    marginTop: 39,
    fontSize: 23,
    fontWeight: "800",
    color: "black",
    textAlign: "center",
  },

  smallTitle: {
    marginTop: 24,
    fontSize: 21,
    fontWeight: "500",
    color: "black",
    textAlign: "center",
  },

  formBox: {
    width: "100%",
    alignItems: "center",
    marginTop: 31,
  },

  inputBox: {
    width: "80%",
    height: 39,
    borderWidth: 1,
    borderColor: "#dcdfe8",
    borderRadius: 22,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 13,
  },

  inputIcon: {
    marginRight: 14,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    color: "#222222",
    paddingVertical: 0,
  },

  termsBox: {
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  checkBox: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: "#dcdfe8",
    backgroundColor: "white",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  checkBoxActive: {
    backgroundColor: "#006bff",
    borderColor: "#006bff",
  },

  termsText: {
    fontSize: 14,
    color: "black",
  },

  blueText: {
    color: "#006bff",
    fontWeight: "600",
    fontSize: 14,
  },

  button: {
    width: "58%",
    height: 45,
    borderRadius: 23,
    backgroundColor: "#aebfff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  loginBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    marginBottom: 40,
  },

  loginText: {
    fontSize: 15,
    color: "#c6c8d1",
  },
});