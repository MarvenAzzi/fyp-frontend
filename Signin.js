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

import {
  useFonts,
  Outfit_700Bold,
  Outfit_400Regular,
} from "@expo-google-fonts/outfit";
import { Inter_700Bold, Inter_500Medium } from "@expo-google-fonts/inter";

import CheckBox from "expo-checkbox";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import Logo from "./assets/logo1.png";

import { login } from "./src/api/auth";

const screenWidth = Dimensions.get("window").width;

export default function Signin({ navigation }) {
  const [isChecked, setChecked] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [loadFont] = useFonts({
    Outfit_700Bold,
    Inter_700Bold,
    Outfit_400Regular,
    Inter_500Medium,
  });

  async function handleSignin() {
    if (!username || !password) {
      Alert.alert("Missing fields", "Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await login(username, password);

      console.log("Logged in user:", data.user);

      Alert.alert("Success", "Signed in successfully.");
      navigation.replace("Home");
    } catch (error) {
      console.log("Signin error:", error);
      Alert.alert("Signin failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!loadFont) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.mainScreen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.topBox}>
            <Image source={Logo} style={styles.logoImage} resizeMode="stretch" />
          </View>

          <Text
            style={{
              fontFamily: "Outfit_400Regular",
              fontSize: 32,
              textAlign: "center",
              padding: 60,
            }}
          >
            Sign In Now
          </Text>

          <View style={styles.inputBox}>
            <Ionicons name="person" color={"#B0BFF8"} size={25} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="lock-closed" color={"#B0BFF8"} size={25} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={22}
                color="#B0BFF8"
              />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginLeft: 25, paddingTop: 15 }}>
            <CheckBox value={isChecked} onValueChange={setChecked} />

            <Text style={{ marginLeft: 10 }}>Remember Me</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("EmailForForgetPassword")}
            >
              <Text style={{ color: "#0051FF", marginLeft: 100 }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupbutton, loading && styles.buttonDisabled]}
            onPress={handleSignin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttontext}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 20,
            }}
          >
            <Text>Don't you have an account?</Text>

            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={{ color: "#0051FF", marginLeft: 5 }}>Sign Up</Text>
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

  logoImage: {
    width: "100%",
    height: "100%",
  },

  inputBox: {
    borderColor: "#DCDDE1",
    borderWidth: 2,
    marginLeft: 20,
    marginTop: 30,
    width: 350,
    borderRadius: 20,
    height: 45,
    paddingLeft: 20,
    paddingRight: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    height: "100%",
  },

  signupbutton: {
    backgroundColor: "#B0BFF8",
    width: 225,
    height: 50,
    borderRadius: 20,
    marginLeft: 80,
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
    fontSize: 20,
  },
});