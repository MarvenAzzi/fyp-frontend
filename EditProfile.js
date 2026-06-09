import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView,
  ScrollView,
  Pressable,
} from "react-native";

import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import {
  getAuthUser,
  updateProfile,
  isStrongPassword,
  getPasswordErrorMessage,
} from "./src/api/auth";

const screenWidth = Dimensions.get("window").width;
const phoneInputAccessoryViewID = "phoneInputAccessoryView";

const PASSWORD_MASK = "••••••••";

export default function EditProfile({ navigation }) {
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState(PASSWORD_MASK);

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getAuthUser();

        if (user) {
          setUsernameInput(user.username || "");
          setPhoneInput(user.phone_number || "");
          setPasswordInput(PASSWORD_MASK);
        }
      } catch (error) {
        console.log("Edit profile load error:", error);
      } finally {
        setPageReady(true);
      }
    }

    loadUser();
  }, []);

  function handlePhoneChange(text) {
    const onlyDigits = text.replace(/[^0-9]/g, "");
    setPhoneInput(onlyDigits.slice(0, 8));
  }

  function handlePasswordFocus() {
    if (passwordInput === PASSWORD_MASK) {
      setPasswordInput("");
      setShowPassword(false);
    }
  }

  function handlePasswordBlur() {
    if (passwordInput.trim() === "") {
      setPasswordInput(PASSWORD_MASK);
      setShowPassword(false);
    }
  }

  function handleEyePress() {
    if (passwordInput === PASSWORD_MASK) {
      Alert.alert(
        "Password hidden",
        "For security, your old password cannot be shown. Type a new password first, then press the eye to show or hide it."
      );
      return;
    }

    setShowPassword(!showPassword);
  }

  async function handleSave() {
    Keyboard.dismiss();

    const username = usernameInput.trim();
    const phone = phoneInput.trim();
    const password = passwordInput.trim();

    const passwordChanged = password !== PASSWORD_MASK && password.length > 0;

    if (!username || !phone) {
      Alert.alert("Missing fields", "Username and phone number are required.");
      return;
    }

    if (phone.length !== 8) {
      Alert.alert(
        "Invalid phone number",
        "Please enter your 8 digit phone number without +961."
      );
      return;
    }

    if (passwordChanged && !isStrongPassword(password)) {
      Alert.alert("Weak password", getPasswordErrorMessage());
      return;
    }

    try {
      setLoading(true);

      const data = await updateProfile(
        username,
        phone,
        passwordChanged ? password : ""
      );

      console.log("Updated user:", data.user);

      setPasswordInput(PASSWORD_MASK);
      setShowPassword(false);

      Alert.alert("Success", "Profile updated successfully.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Profile"),
        },
      ]);
    } catch (error) {
      console.log("Update profile error:", error);
      Alert.alert("Update failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!pageReady) {
    return <View style={styles.mainScreen} />;
  }

  return (
    <View style={styles.mainScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="#dce4ff" />

      <KeyboardAvoidingView
        style={styles.mainScreen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Keyboard.dismiss();
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#4d4d4d" />
              <Text style={styles.backText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {usernameInput ? usernameInput.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>

            <Text style={styles.usernameTitle}>{usernameInput || "User"}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputBox}>
              <Ionicons name="person" size={22} color="#b7c3ff" />

              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#cfd2db"
                value={usernameInput}
                onChangeText={setUsernameInput}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="call" size={22} color="#b7c3ff" />

              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#cfd2db"
                value={phoneInput}
                onChangeText={handlePhoneChange}
                keyboardType="number-pad"
                maxLength={8}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? phoneInputAccessoryViewID : undefined
                }
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="lock-closed" size={22} color="#b7c3ff" />

              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#cfd2db"
                value={passwordInput}
                onChangeText={setPasswordInput}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                secureTextEntry={
                  passwordInput !== PASSWORD_MASK && !showPassword
                }
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? phoneInputAccessoryViewID : undefined
                }
              />

              <Pressable
                style={styles.eyeButton}
                onPress={handleEyePress}
                hitSlop={20}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={22}
                  color="#b7c3ff"
                />
              </Pressable>
            </View>

            {Platform.OS === "ios" && (
              <InputAccessoryView nativeID={phoneInputAccessoryViewID}>
                <View style={styles.keyboardToolbar}>
                  <TouchableOpacity onPress={Keyboard.dismiss}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            )}

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Home")}
          >
            <Ionicons name="home" size={22} color="black" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Diagnose")}
          >
            <MaterialIcons name="manage-search" size={23} color="black" />
            <Text style={styles.navText}>Diagnose</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("MyCars")}
          >
            <FontAwesome5 name="car" size={18} color="black" />
            <Text style={styles.navText}>Cars</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person" size={21} color="#006fff" />
            <Text style={styles.activeNavText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  scrollContent: {
    paddingBottom: 130,
  },

  header: {
    width: screenWidth,
    height: 327,
    backgroundColor: "#dce4ff",
    borderBottomLeftRadius: 210,
    borderBottomRightRadius: 210,
    alignItems: "center",
    paddingTop: 42,
  },

  backButton: {
    position: "absolute",
    top: 40,
    left: 8,
    width: 132,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  backText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#4d4d4d",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#7f9cff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

  avatarLetter: {
    color: "white",
    fontSize: 48,
    fontWeight: "800",
  },

  usernameTitle: {
    marginTop: 30,
    fontSize: 31,
    fontWeight: "900",
    color: "black",
  },

  form: {
    marginTop: 72,
    alignItems: "center",
  },

  inputBox: {
    width: screenWidth - 88,
    height: 53,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 52,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#222222",
  },

  passwordInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#222222",
    paddingRight: 55,
  },

  eyeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 55,
    height: 53,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 999,
  },

  saveButton: {
    width: screenWidth - 94,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#2d7eff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
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

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 62,
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