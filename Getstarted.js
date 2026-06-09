import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";

import Logo from "./assets/logo-vagdiag.png";
import Background from "./assets/getstarted.png";

const screenWidth = Dimensions.get("window").width;

const BTN_W     = screenWidth * 0.8;
const BTN_H     = 68;
const THUMB_W   = 62;
const PAD       = 4;
const MAX_SLIDE = BTN_W - THUMB_W - PAD * 2;
const TRIGGER   = MAX_SLIDE * 0.82;

export default function Getstarted({ navigation }) {
  const [imagesReady, setImagesReady] = useState(false);
  const slideX    = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);

  // "Get started" text fades as thumb approaches the right
  const textOpacity = slideX.interpolate({
    inputRange: [0, MAX_SLIDE * 0.5, MAX_SLIDE],
    outputRange: [1, 0.4, 0],
    extrapolate: "clamp",
  });

  // Right arrow fades out as thumb approaches it
  const arrowOpacity = slideX.interpolate({
    inputRange: [0, MAX_SLIDE * 0.6, MAX_SLIDE],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, gs) => {
        slideX.setValue(Math.max(0, Math.min(gs.dx, MAX_SLIDE)));
      },
      onPanResponderRelease: (_, gs) => {
        if (triggered.current) return;
        const x = Math.max(0, Math.min(gs.dx, MAX_SLIDE));
        if (x >= TRIGGER) {
          triggered.current = true;
          Animated.timing(slideX, {
            toValue: MAX_SLIDE,
            duration: 100,
            useNativeDriver: false,
          }).start(() => {
            navigation.navigate("Signup");
            setTimeout(() => {
              slideX.setValue(0);
              triggered.current = false;
            }, 500);
          });
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            friction: 6,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    async function loadImages() {
      await Asset.loadAsync([Logo, Background]);
      setImagesReady(true);
    }
    loadImages();
  }, []);

  if (!imagesReady) return null;

  return (
    <View style={styles.mainScreen}>
      <StatusBar translucent backgroundColor="transparent" />

        <ImageBackground
          source={Background}
          style={styles.background}
          resizeMode="cover"
        >
          <Image source={Logo} style={styles.logo} resizeMode="contain" />

          <View style={styles.boxOne}>
            <View style={[styles.dot, { backgroundColor: "#45ff28" }]} />
            <Text style={styles.boxText}>Connect your car</Text>
          </View>

          <View style={styles.boxTwo}>
            <View style={[styles.dot, { backgroundColor: "#ff3b30" }]} />
            <Text style={styles.boxText}>Detect engine faults</Text>
          </View>

          <View style={styles.boxThree}>
            <View style={[styles.dot, { backgroundColor: "#ffff2e" }]} />
            <Text style={styles.boxText}>View live engine data</Text>
          </View>

          <Text style={styles.title}>
            Understand your Audi{"\n"}
            and Volkswagen like{"\n"}
            never before
          </Text>

          <Text style={styles.description}>
            Engine diagnostics and real-time insights designed{"\n"}
            specifically for Audi and Volkswagen vehicles.
          </Text>

          {/* ── Slider button (same look as before, white circle is draggable) ── */}
          <View style={styles.button}>

            {/* Draggable white circle — the thumb */}
            <Animated.View
              style={[styles.leftCircle, { transform: [{ translateX: slideX }] }]}
              {...panResponder.panHandlers}
            >
              <Ionicons name="chevron-forward" size={32} color="#d8d8d8" />
            </Animated.View>

            {/* Centre label */}
            <Animated.Text style={[styles.buttonText, { opacity: textOpacity }]}>
              Slide to get started
            </Animated.Text>

            {/* Right arrow */}
            <Animated.View style={[styles.rightArrow, { opacity: arrowOpacity }]}>
              <Ionicons name="chevron-forward" size={30} color="white" />
            </Animated.View>

          </View>

          <Text style={styles.bottomText}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  background: {
    flex: 1,
    width: screenWidth,
  },

  logo: {
    width: 110,
    height: 115,
    marginLeft: 20,
    marginTop: 20,
  },

  boxOne: {
    position: "absolute",
    top: 120,
    left: 28,
    width: 205,
    height: 42,
    borderRadius: 25,
    backgroundColor: "rgba(130, 160, 185, 0.55)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  boxTwo: {
    position: "absolute",
    top: 202,
    right: 55,
    width: 200,
    height: 42,
    borderRadius: 25,
    backgroundColor: "rgba(130, 160, 185, 0.55)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  boxThree: {
    position: "absolute",
    top: 282,
    left: 28,
    width: 205,
    height: 42,
    borderRadius: 25,
    backgroundColor: "rgba(130, 160, 185, 0.55)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 16,
  },

  boxText: {
    fontSize: 12,
    color: "#6f7782",
  },

  title: {
    position: "absolute",
    top: 585,
    width: "100%",
    fontSize: 30,
    fontWeight: "800",
    color: "black",
    textAlign: "center",
    lineHeight: 42,
  },

  description: {
    position: "absolute",
    top: 730,
    width: "100%",
    fontSize: 13,
    color: "#7d7d7d",
    textAlign: "center",
    lineHeight: 18,
  },

  button: {
    position: "absolute",
    top: 785,
    left: screenWidth * 0.1,
    width: BTN_W,
    height: BTN_H,
    borderRadius: 36,
    backgroundColor: "#006fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leftCircle: {
    position: "absolute",
    left: PAD,
    width: THUMB_W,
    height: THUMB_W,
    borderRadius: THUMB_W / 2,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  rightArrow: {
    position: "absolute",
    right: 20,
  },

  bottomText: {
    position: "absolute",
    top: 870,
    width: "100%",
    fontSize: 11,
    color: "#777777",
    textAlign: "center",
  },
});
