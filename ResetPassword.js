import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  InputAccessoryView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import resetPassword from "./assets/resetpassword.jpg";
import {
  Inter_600SemiBold,
  Inter_500Medium,
  useFonts,
} from "@expo-google-fonts/inter";
import { useState } from "react";

import { resetForgotPassword } from "./src/api/forgotPassword";
import { isStrongPassword, getPasswordErrorMessage } from "./src/api/auth";

const passwordInputAccessoryViewID = "passwordInputAccessoryView";

export default function ResetPassword({ navigation, route }) {
  const email = route?.params?.email || "";
  const code = route?.params?.code || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [loadFonts] = useFonts({
    Inter_600SemiBold,
    Inter_500Medium,
  });

  async function handleSavePassword() {
    Keyboard.dismiss();

    if (!password || !confirmPassword) {
      Alert.alert("Missing fields", "Please enter and confirm your password.");
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

    if (!email || !code) {
      Alert.alert(
        "Reset error",
        "Missing verification data. Please verify your code again."
      );
      navigation.navigate("EmailForForgetPassword");
      return;
    }

    try {
      setLoading(true);

      const data = await resetForgotPassword(email, code, password);

      console.log("Password reset:", data);

      Alert.alert(
        "Success",
        "Password changed successfully. Please sign in with your new password.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Signin"),
          },
        ]
      );
    } catch (error) {
      console.log("Reset password error:", error);
      Alert.alert("Reset failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!loadFonts) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.mainScreen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.resetpassbutton}
              onPress={() => {
                Keyboard.dismiss();
                navigation.goBack();
              }}
            >
              <View style={styles.backContent}>
                <Ionicons name="arrow-back-outline" size={25} />
                <Text style={styles.resetpasstext}>Reset Password</Text>
              </View>
            </TouchableOpacity>

            <Image source={resetPassword} style={styles.resetpassimg} />

            <Text style={styles.text}>Please enter your new password</Text>

            <Text style={styles.labeltext}>Password</Text>
            <View style={styles.passwordBox}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="New Password"
                placeholderTextColor="#c5c8d3"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={
                  Platform.OS === "ios"
                    ? passwordInputAccessoryViewID
                    : undefined
                }
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={22}
                  color="#8A8F93"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.labeltext}>Confirm Password</Text>
            <View style={styles.passwordBox}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm New Password"
                placeholderTextColor="#c5c8d3"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={
                  Platform.OS === "ios"
                    ? passwordInputAccessoryViewID
                    : undefined
                }
              />

              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={22}
                  color="#8A8F93"
                />
              </TouchableOpacity>
            </View>

            {Platform.OS === "ios" && (
              <InputAccessoryView nativeID={passwordInputAccessoryViewID}>
                <View style={styles.keyboardToolbar}>
                  <TouchableOpacity onPress={Keyboard.dismiss}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            )}

            <TouchableOpacity
              style={[styles.savepassbutton, loading && styles.buttonDisabled]}
              onPress={handleSavePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttontext}>Save Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  container: {
    backgroundColor: "white",
    paddingBottom: 80,
    paddingTop: 60,
  },

  resetpassbutton: {
    marginLeft: 20,
    paddingLeft: 20,
    borderColor: "#DCDDE1",
    borderWidth: 2,
    borderRadius: 50,
    height: 50,
    width: 200,
    justifyContent: "center",
  },

  backContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  resetpasstext: {
    textAlign: "center",
  },

  resetpassimg: {
    width: 270,
    height: 300,
    marginTop: 25,
    marginLeft: 55,
  },

  text: {
    textAlign: "center",
    marginLeft: 30,
    marginRight: 30,
    marginTop: 20,
    marginBottom: 25,
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: "#8A8F93",
  },

  labeltext: {
    marginLeft: 55,
    color: "#8A8F93",
    marginBottom: 8,
  },

  textinput: {
    borderColor: "#DCDDE1",
    borderWidth: 2,
    marginLeft: 45,
    width: 300,
    borderRadius: 10,
    height: 60,
    paddingLeft: 20,
    marginBottom: 18,
    fontSize: 16,
  },

  passwordBox: {
    borderColor: "#DCDDE1",
    borderWidth: 2,
    marginLeft: 45,
    width: 300,
    borderRadius: 10,
    height: 60,
    paddingLeft: 20,
    paddingRight: 15,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },

  savepassbutton: {
    backgroundColor: "#2D7EEB",
    width: 300,
    height: 60,
    borderRadius: 20,
    marginLeft: 45,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttontext: {
    color: "white",
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 23,
  },

  keyboardToolbar: {
    height: 44,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 18,
    borderTopWidth: 1,
    borderTopColor: "#dcdcdc",
  },

  doneText: {
    color: "#2D7EEB",
    fontSize: 17,
    fontWeight: "600",
  },
});