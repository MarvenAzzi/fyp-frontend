import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  InputAccessoryView,
  ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import forgetPass from "./assets/forgetpassword.avif";
import {
  useFonts,
  Inter_600SemiBold,
  Inter_500Medium,
} from "@expo-google-fonts/inter";
import { useState } from "react";

import { sendForgotPasswordCode } from "./src/api/forgotPassword";

const emailInputAccessoryViewID = "emailInputAccessoryView";

export default function EmailForForgetPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [loadFonts] = useFonts({
    Inter_600SemiBold,
    Inter_500Medium,
  });

  function handleEmailChange(text) {
    setEmail(text);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSendCode() {
    Keyboard.dismiss();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await sendForgotPasswordCode(cleanEmail);

      Alert.alert(
        "Code sent",
        "A verification code has been sent to your email.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("OtpForForgetPassword", {
                email: cleanEmail,
              }),
          },
        ]
      );
    } catch (error) {
      console.log("Send code error:", error);
      Alert.alert("Error", error.message);
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
          <TouchableOpacity
            style={styles.verificationcodebutton}
            onPress={() => {
              Keyboard.dismiss();
              navigation.goBack();
            }}
          >
            <View style={styles.backContent}>
              <Ionicons name="arrow-back-outline" size={25} color="black" />
              <Text style={styles.verificationcodetext}>Forgot Password</Text>
            </View>
          </TouchableOpacity>

          <Image source={forgetPass} style={styles.verificationcodeimg} />

          <Text style={styles.text}>
            Please enter your email address to receive verification code
          </Text>

          <Text style={styles.labeltext}>Email Address</Text>

          <TextInput
            style={styles.textinput}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            placeholder="Enter your email"
            placeholderTextColor="#c5c8d3"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
            inputAccessoryViewID={
              Platform.OS === "ios" ? emailInputAccessoryViewID : undefined
            }
          />

          {Platform.OS === "ios" && (
            <InputAccessoryView nativeID={emailInputAccessoryViewID}>
              <View style={styles.keyboardToolbar}>
                <TouchableOpacity onPress={Keyboard.dismiss}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>
          )}

          <TouchableOpacity
            style={[styles.sendcodebutton, loading && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttontext}>Send Code</Text>
            )}
          </TouchableOpacity>
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

  verificationcodebutton: {
    marginTop: 80,
    marginLeft: 10,
    paddingLeft: 40,
    borderColor: "#DCDDE1",
    borderWidth: 2,
    borderRadius: 50,
    height: 50,
    width: 200,
    justifyContent: "center",
  },

  backContent: {
    flexDirection: "row",
    marginLeft: -30,
    gap: 20,
    alignItems: "center",
  },

  verificationcodetext: {
    textAlign: "center",
    fontSize: 14,
  },

  verificationcodeimg: {
    width: 330,
    height: 340,
    paddingTop: 20,
    marginLeft: 25,
  },

  text: {
    textAlign: "center",
    marginLeft: 30,
    marginRight: 30,
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: "#8A8F93",
  },

  labeltext: {
    marginLeft: 55,
    color: "#8A8F93",
    marginTop: 45,
    marginBottom: 8,
  },

  textinput: {
    borderColor: "#DCDDE1",
    borderWidth: 2,
    marginLeft: 45,
    marginTop: 0,
    width: 300,
    borderRadius: 10,
    height: 65,
    paddingLeft: 20,
    fontSize: 18,
  },

  sendcodebutton: {
    backgroundColor: "#2D7EEB",
    width: 300,
    height: 60,
    borderRadius: 20,
    marginLeft: 45,
    marginTop: 60,
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