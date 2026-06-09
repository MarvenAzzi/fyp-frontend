import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";

import {
  useFonts,
  Outfit_700Bold,
  Outfit_400Regular,
} from "@expo-google-fonts/outfit";

import { Inter_700Bold, Inter_500Medium } from "@expo-google-fonts/inter";
import { useState, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { addVehicle } from "./src/api/vehicles";
import {
  getBrands,
  getModels,
  getYears,
  getVariant,
} from "./src/api/carDataset";

const screenWidth = Dimensions.get("window").width;
const allowedPlateLetters = ["B", "G", "Z", "S", "N", "A", "Y"];

// ─── Reusable dropdown picker field ──────────────────────────────────────────
function DropdownField({
  icon,
  iconSet = "Ionicons",
  placeholder,
  value,
  items,
  onSelect,
  disabled = false,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const Icon =
    iconSet === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;

  return (
    <>
      <TouchableOpacity
        style={[styles.inputBox, disabled && styles.inputBoxDisabled]}
        onPress={() => !disabled && !loading && setOpen(true)}
        activeOpacity={0.7}
      >
        <Icon
          name={icon}
          color={disabled ? "#e0e0e0" : "#cfd2db"}
          size={iconSet === "MaterialCommunityIcons" ? 25 : 23}
          style={styles.icon}
        />
        <Text
          style={[
            styles.dropdownText,
            !value && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {loading ? "Loading..." : value || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#cfd2db"
            style={{ marginRight: 14 }}
          />
        ) : (
          <Ionicons
            name="chevron-down"
            size={16}
            color={disabled ? "#e0e0e0" : "#cfd2db"}
            style={{ marginRight: 14 }}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{placeholder}</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.value.toString()}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 340 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.sheetItem,
                  value === item.label && styles.sheetItemSelected,
                ]}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                {item.hex && (
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: item.hex },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.sheetItemText,
                    value === item.label && styles.sheetItemTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {value === item.label && (
                  <Ionicons name="checkmark" size={18} color="#2D7EEB" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AddCar({ navigation }) {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [colors, setColors] = useState([]);
  const [engines, setEngines] = useState([]);

  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingVariant, setLoadingVariant] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [generationId, setGenerationId] = useState(null);
  const [imagePath, setImagePath] = useState(null);

  const [plateNumber, setPlateNumber] = useState("");
  const [vinNumber, setVinNumber] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [loading, setLoading] = useState(false);

  const [loadFont] = useFonts({
    Outfit_700Bold,
    Outfit_400Regular,
    Inter_700Bold,
    Inter_500Medium,
  });

  // Load brands on mount
  useEffect(() => {
    (async () => {
      try {
        setLoadingBrands(true);
        const data = await getBrands();
        setBrands(data.map((b) => ({ value: b.id, label: b.name })));
      } catch (e) {
        Alert.alert("Error", "Could not load brands. Check your connection.");
      } finally {
        setLoadingBrands(false);
      }
    })();
  }, []);

  async function handleSelectBrand(item) {
    setSelectedBrand(item);
    setSelectedModel(null);
    setSelectedYear(null);
    setSelectedColor(null);
    setSelectedEngine(null);
    setGenerationId(null);
    setImagePath(null);
    setModels([]);
    setYears([]);
    setColors([]);
    setEngines([]);
    try {
      setLoadingModels(true);
      const data = await getModels(item.value);
      setModels(data.map((m) => ({ value: m.id, label: m.name })));
    } catch (e) {
      Alert.alert("Error", "Could not load models.");
    } finally {
      setLoadingModels(false);
    }
  }

  async function handleSelectModel(item) {
    setSelectedModel(item);
    setSelectedYear(null);
    setSelectedColor(null);
    setSelectedEngine(null);
    setGenerationId(null);
    setImagePath(null);
    setYears([]);
    setColors([]);
    setEngines([]);
    try {
      setLoadingYears(true);
      const data = await getYears(item.value);
      setYears(data.map((y) => ({ value: y, label: y.toString() })));
    } catch (e) {
      Alert.alert("Error", "Could not load years.");
    } finally {
      setLoadingYears(false);
    }
  }

  async function handleSelectYear(item) {
    setSelectedYear(item);
    setSelectedColor(null);
    setSelectedEngine(null);
    setGenerationId(null);
    setImagePath(null);
    setColors([]);
    setEngines([]);
    try {
      setLoadingVariant(true);
      const variant = await getVariant(selectedModel.value, item.value);
      setGenerationId(variant.generation_id);
      setImagePath(variant.image_path);
      setColors(
        variant.colors.map((c) => ({
          value: c.name,
          label: c.name,
          hex: c.hex,
        }))
      );
      setEngines(variant.engines.map((e) => ({ value: e, label: e })));
    } catch (e) {
      Alert.alert("Error", "Could not load variant details.");
    } finally {
      setLoadingVariant(false);
    }
  }

  function handlePlateChange(text) {
    let cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (cleaned.length === 0) {
      setPlateNumber("");
      return;
    }

    const firstLetter = cleaned.charAt(0);

    if (!allowedPlateLetters.includes(firstLetter)) {
      Alert.alert(
        "Invalid plate letter",
        "Plate number must start with B, G, Z, S, N, A, or Y."
      );
      setPlateNumber("");
      return;
    }

    const numbers = cleaned.slice(1).replace(/[^0-9]/g, "").slice(0, 7);

    setPlateNumber(firstLetter + numbers);
  }

  async function handleAddCar() {
    Keyboard.dismiss();

    if (
      !selectedBrand ||
      !selectedModel ||
      !selectedYear ||
      !selectedColor ||
      !selectedEngine
    ) {
      Alert.alert(
        "Missing fields",
        "Please select all car details from the dropdowns."
      );
      return;
    }

    const plate = plateNumber.trim().toUpperCase();
    const vin = vinNumber.trim().toUpperCase();
    const mileage = currentMileage.trim();

    if (!/^[BGZSNAY][0-9]{3,7}$/.test(plate)) {
      Alert.alert(
        "Invalid plate number",
        "Plate number must start with B, G, Z, S, N, A, or Y, followed by 3 to 7 numbers. Example: B3451"
      );
      return;
    }
    if (vin.length !== 17) {
      Alert.alert("Invalid VIN", "VIN number must be exactly 17 characters.");
      return;
    }
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      Alert.alert(
        "Invalid VIN",
        "VIN can only contain letters and numbers. It cannot contain I, O, or Q."
      );
      return;
    }
    const numericMileage = Number(mileage);
    if (!mileage || isNaN(numericMileage) || numericMileage < 0) {
      Alert.alert("Invalid mileage", "Current mileage must be a valid number.");
      return;
    }

    try {
      setLoading(true);

      const vehicleData = {
        brand: selectedBrand.label,
        model: selectedModel.label,
        color: selectedColor.label,
        color_hex: selectedColor.hex,
        year: selectedYear.value,
        plate_number: plate,
        vin,
        engine_type: selectedEngine.label,
        current_mileage: numericMileage,
        generation_id: generationId,
        image_path: imagePath,
      };

      console.log("Sending vehicle data:", vehicleData);
      const data = await addVehicle(vehicleData);
      console.log("Vehicle added:", data.vehicle);

      Alert.alert("Success", "Car added successfully.", [
        { text: "OK", onPress: () => navigation.navigate("MyCars") },
      ]);
    } catch (error) {
      console.log("Add car error:", error);
      Alert.alert("Add car failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!loadFont) return null;

  return (
    <TouchableWithoutFeedback
      onPress={() => Keyboard.dismiss()}
      accessible={false}
    >
      <KeyboardAvoidingView
        style={styles.mainScreen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.screen}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>VAGDIAG</Text>
          <Text style={styles.title}>Add Your Car</Text>
          <Text style={styles.subtitle}>
            Enter your car details to start diagnosis
          </Text>

          <View style={styles.form}>
            <DropdownField
              icon="car"
              placeholder="Car Brand"
              value={selectedBrand?.label}
              items={brands}
              onSelect={handleSelectBrand}
              loading={loadingBrands}
            />
            <DropdownField
              icon="car"
              placeholder="Car Model"
              value={selectedModel?.label}
              items={models}
              onSelect={handleSelectModel}
              disabled={!selectedBrand}
              loading={loadingModels}
            />
            <DropdownField
              icon="calendar-outline"
              placeholder="Car Year"
              value={selectedYear?.label}
              items={years}
              onSelect={handleSelectYear}
              disabled={!selectedModel}
              loading={loadingYears}
            />
            <DropdownField
              icon="color-palette-outline"
              placeholder="Car Color"
              value={selectedColor?.label}
              items={colors}
              onSelect={setSelectedColor}
              disabled={!selectedYear}
              loading={loadingVariant}
            />
            <DropdownField
              icon="dots-grid"
              iconSet="MaterialCommunityIcons"
              placeholder="Engine Type"
              value={selectedEngine?.label}
              items={engines}
              onSelect={setSelectedEngine}
              disabled={!selectedYear}
              loading={loadingVariant}
            />

            {/* Free-text fields */}
            <View style={styles.inputBox}>
              <MaterialCommunityIcons
                name="dots-grid"
                color="#cfd2db"
                size={25}
                style={styles.icon}
              />
              <TextInput
                style={styles.textinput}
                placeholder="Plate Number ex: B3451"
                placeholderTextColor="#cfd2db"
                value={plateNumber}
                autoCapitalize="characters"
                maxLength={8}
                onChangeText={handlePlateChange}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View style={styles.inputBox}>
              <MaterialCommunityIcons
                name="dots-grid"
                color="#cfd2db"
                size={25}
                style={styles.icon}
              />
              <TextInput
                style={styles.textinput}
                placeholder="VIN Number"
                placeholderTextColor="#cfd2db"
                value={vinNumber}
                autoCapitalize="characters"
                maxLength={17}
                onChangeText={(t) =>
                  setVinNumber(
                    t.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 17)
                  )
                }
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View style={styles.inputBox}>
              <MaterialCommunityIcons
                name="dots-grid"
                color="#cfd2db"
                size={25}
                style={styles.icon}
              />
              <TextInput
                style={styles.textinput}
                placeholder="Current Mileage"
                placeholderTextColor="#cfd2db"
                keyboardType="number-pad"
                value={currentMileage}
                onChangeText={(t) =>
                  setCurrentMileage(t.replace(/[^0-9]/g, ""))
                }
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, loading && styles.buttonDisabled]}
            onPress={handleAddCar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.addButtonText}>Add Car</Text>
                <Ionicons name="arrow-forward" color="white" size={25} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              navigation.goBack();
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  mainScreen: { flex: 1, backgroundColor: "#e9eefc" },
  screen: { flex: 1, backgroundColor: "#e9eefc" },
  logo: {
    fontFamily: "Outfit_700Bold",
    fontSize: 33,
    textAlign: "center",
    marginTop: 55,
    color: "black",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    textAlign: "center",
    marginTop: 35,
    color: "black",
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    color: "black",
  },
  form: { marginTop: 55 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#d6d6d6",
    borderWidth: 1,
    backgroundColor: "white",
    marginLeft: 36,
    marginTop: 17,
    width: screenWidth - 72,
    borderRadius: 18,
    height: 42,
    paddingLeft: 20,
    paddingRight: 15,
  },
  inputBoxDisabled: { backgroundColor: "#f9f9f9", borderColor: "#ebebeb" },
  icon: { marginRight: 15 },
  textinput: {
    flex: 1,
    height: "100%",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "black",
    paddingVertical: 0,
  },
  dropdownText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "black",
  },
  placeholderText: { color: "#cfd2db" },
  disabledText: { color: "#d8d8d8" },
  addButton: {
    backgroundColor: "#2D7EEB",
    width: screenWidth - 74,
    height: 45,
    borderRadius: 7,
    marginLeft: 37,
    marginTop: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  addButtonText: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    marginRight: 12,
  },
  cancelText: {
    fontFamily: "Inter_500Medium",
    color: "black",
    textAlign: "center",
    fontSize: 19,
    marginTop: 22,
    marginBottom: 50,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 34,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: "#d8d8d8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "black",
    textAlign: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ebebeb",
    marginHorizontal: 20,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f2f2f2",
  },
  sheetItemSelected: { backgroundColor: "#f0f6ff" },
  sheetItemText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#222",
  },
  sheetItemTextSelected: { color: "#2D7EEB", fontFamily: "Inter_700Bold" },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
});
