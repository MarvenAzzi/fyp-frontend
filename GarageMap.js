import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Linking,
} from "react-native";

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { getGarageDirections, getNearbyGarages } from "./src/api/garages";

const screenWidth = Dimensions.get("window").width;

function decodeGooglePolyline(encoded) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 100000,
      longitude: lng / 100000,
    });
  }

  return coordinates;
}

export default function GarageMap({ navigation }) {
  const mapRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [garages, setGarages] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingGarages, setLoadingGarages] = useState(false);

  useEffect(() => {
    getUserLocationAndGarages();
  }, []);

  async function getUserLocationAndGarages() {
    try {
      setLoading(true);
      setRouteCoords([]);
      setRouteInfo(null);
      setSelectedGarage(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location permission denied",
          "Please allow location access to see nearby garages."
        );
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getLastKnownPositionAsync();

      if (!currentLocation) {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
      }

      const userLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      };

      setLocation(userLocation);

      setTimeout(() => {
        mapRef.current?.animateToRegion(userLocation, 1000);
      }, 500);

      await fetchNearbyGarages(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (error) {
      console.log("Location error:", error);
      Alert.alert("Location error", "Could not get your current location.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNearbyGarages(latitude, longitude) {
    try {
      setLoadingGarages(true);

      const results = await getNearbyGarages(latitude, longitude, 8000);
      setGarages(results);

      if (results.length > 0) {
        setSelectedGarage(results[0]);
      } else {
        Alert.alert(
          "No garages found",
          "No nearby garages were found around your current location."
        );
      }
    } catch (error) {
      console.log("Garage search error:", error);
      Alert.alert(
        "Garage search error",
        error.message || "Could not load nearby garages."
      );
    } finally {
      setLoadingGarages(false);
    }
  }

  async function drawRouteToGarage(garage) {
    if (!location || !garage) {
      return;
    }

    try {
      setSelectedGarage(garage);

      const data = await getGarageDirections(
        {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        {
          latitude: garage.latitude,
          longitude: garage.longitude,
        }
      );

      if (!data.polyline) {
        Alert.alert("Route error", "Could not find a route to this garage.");
        return;
      }

      const coords = decodeGooglePolyline(data.polyline);

      if (!coords.length) {
        Alert.alert("Route error", "Could not draw the route to this garage.");
        return;
      }

      setRouteCoords(coords);
      setRouteInfo({
        distanceKm: data.distanceMeters
          ? data.distanceMeters / 1000
          : garage.distance || 0,
        durationMin: data.durationSeconds
          ? Math.round(data.durationSeconds / 60)
          : 0,
        distanceText: data.distanceText,
        durationText: data.durationText,
      });

      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: {
          top: 130,
          right: 60,
          bottom: 260,
          left: 60,
        },
        animated: true,
      });
    } catch (error) {
      console.log("Route error:", error);
      Alert.alert("Route error", error.message || "Could not load directions.");
    }
  }

  function openGoogleMapsNavigation() {
    if (!selectedGarage) {
      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${selectedGarage.latitude},${selectedGarage.longitude}` +
      `&travelmode=driving`;

    Linking.openURL(selectedGarage.googleMapsUri || url);
  }

  function focusOnGarage(garage) {
    setSelectedGarage(garage);

    const region = {
      latitude: garage.latitude,
      longitude: garage.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    mapRef.current?.animateToRegion(region, 800);
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2D7EEB" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorText}>Location not available</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={getUserLocationAndGarages}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainScreen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={location}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userMarkerWrapper}>
            <View style={styles.userMarkerBlue}>
              <View style={styles.userMarkerWhite}>
                <FontAwesome5 name="car" size={27} color="black" />
              </View>
            </View>
          </View>
        </Marker>

        {garages.map((garage) => (
          <Marker
            key={garage.id}
            coordinate={{
              latitude: garage.latitude,
              longitude: garage.longitude,
            }}
            onPress={() => focusOnGarage(garage)}
          >
            <View style={styles.garageMarker}>
              {garage.image ? (
                <Image
                  source={{ uri: garage.image }}
                  style={styles.markerImage}
                />
              ) : (
                <View style={styles.noMarkerImage}>
                  <FontAwesome5 name="tools" size={20} color="#2D7EEB" />
                </View>
              )}
            </View>

            <View style={styles.distanceBubble}>
              <Text style={styles.distanceBubbleText}>
                {Number(garage.distance || 0).toFixed(1)} km
              </Text>
            </View>
          </Marker>
        ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor="#2D7EEB"
          />
        )}
      </MapView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color="#4d4d4d" />
        <Text style={styles.backText}>
          {routeInfo ? "Directions" : "Nearest Location"}
        </Text>
      </TouchableOpacity>

      <View style={styles.zoomBox}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            mapRef.current?.animateToRegion({
              ...location,
              latitudeDelta: Math.max(location.latitudeDelta / 2, 0.003),
              longitudeDelta: Math.max(location.longitudeDelta / 2, 0.003),
            });
          }}
        >
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>

        <View style={styles.zoomDivider} />

        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            mapRef.current?.animateToRegion({
              ...location,
              latitudeDelta: location.latitudeDelta * 2,
              longitudeDelta: location.longitudeDelta * 2,
            });
          }}
        >
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>

      {loadingGarages && (
        <View style={styles.routeTopBox}>
          <Text style={styles.routeTopDistance}>Loading garages...</Text>
          <Text style={styles.routeVia}>Searching Google Places near you</Text>
        </View>
      )}

      {routeInfo && selectedGarage ? (
        <View style={styles.routeTopBox}>
          <Text style={styles.routeTopDistance}>
            {routeInfo.distanceText || `${routeInfo.distanceKm.toFixed(1)} km`}{" "}
            . {routeInfo.durationText || `${routeInfo.durationMin} min`}
          </Text>

          <Text style={styles.routeVia}>Via Google Maps driving route</Text>

          <TouchableOpacity
            style={styles.routeCheck}
            onPress={() => {
              setRouteCoords([]);
              setRouteInfo(null);
            }}
          >
            <Ionicons name="checkmark" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ) : null}

      {selectedGarage && (
        <View style={styles.garagePanel}>
          <View style={styles.panelHandle} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {garages.map((garage) => (
              <TouchableOpacity
                key={garage.id}
                style={[
                  styles.garageCard,
                  selectedGarage.id === garage.id && styles.activeGarageCard,
                ]}
                onPress={() => focusOnGarage(garage)}
                activeOpacity={0.9}
              >
                {garage.image ? (
                  <Image
                    source={{ uri: garage.image }}
                    style={styles.garageImage}
                  />
                ) : (
                  <View style={styles.noGarageImage}>
                    <FontAwesome5 name="tools" size={28} color="#2D7EEB" />
                    <Text style={styles.noPhotoText}>No photo</Text>
                  </View>
                )}

                <View style={styles.garageInfo}>
                  <Text style={styles.garageName} numberOfLines={1}>
                    {garage.name}
                  </Text>

                  <Text style={styles.garageAddress} numberOfLines={1}>
                    {garage.address}
                  </Text>

                  <View style={styles.garageMetaRow}>
                    <Text style={styles.garageMetaText}>
                      {garage.durationText ||
                        `${Math.max(
                          5,
                          Math.round((garage.distance || 1) * 5)
                        )} min`}{" "}
                      from your location
                    </Text>

                    <View style={styles.dot} />

                    <Text style={styles.garageMetaText}>
                      {Number(garage.distance || 0).toFixed(1)} km
                    </Text>
                  </View>

                  <Text style={styles.ratingText}>
                    {garage.rating
                      ? `Overall Rating: ${garage.rating} ★ (${
                          garage.userRatingCount || 0
                        })`
                      : "Rating not available"}
                  </Text>

                  <View style={styles.cardDivider} />

                  {routeInfo && selectedGarage.id === garage.id ? (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={openGoogleMapsNavigation}
                    >
                      <Text style={styles.startButtonText}>Start</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.directionsButton}
                      onPress={() => drawRouteToGarage(garage)}
                    >
                      <Text style={styles.directionsButtonText}>
                        Directions
                      </Text>
                      <Ionicons name="navigate" size={19} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: {
    flex: 1,
    backgroundColor: "white",
  },

  map: {
    flex: 1,
    width: screenWidth,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#8A8F93",
  },

  errorText: {
    fontSize: 18,
    color: "#8A8F93",
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#2D7EEB",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 20,
  },

  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  userMarkerWrapper: {
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "rgba(45,126,235,0.30)",
    justifyContent: "center",
    alignItems: "center",
  },

  userMarkerBlue: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(45,126,235,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  userMarkerWhite: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  garageMarker: {
    width: 63,
    height: 63,
    borderRadius: 32,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  markerImage: {
    width: 55,
    height: 55,
    borderRadius: 28,
  },

  noMarkerImage: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#eef3ff",
    justifyContent: "center",
    alignItems: "center",
  },

  distanceBubble: {
    alignSelf: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: -5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  distanceBubbleText: {
    fontSize: 11,
    color: "#4d4d4d",
    fontWeight: "600",
  },

  backButton: {
    position: "absolute",
    top: 45,
    left: 8,
    height: 42,
    borderRadius: 22,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },

  backText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#4d4d4d",
  },

  zoomBox: {
    position: "absolute",
    top: 95,
    right: 22,
    width: 45,
    height: 92,
    borderRadius: 22,
    backgroundColor: "white",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  zoomButton: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  zoomText: {
    fontSize: 30,
    color: "black",
    lineHeight: 33,
  },

  zoomDivider: {
    height: 1,
    backgroundColor: "#eeeeee",
  },

  routeTopBox: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 122,
    backgroundColor: "white",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 42,
    paddingLeft: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },

  routeTopDistance: {
    fontSize: 24,
    fontWeight: "800",
    color: "black",
  },

  routeVia: {
    fontSize: 15,
    color: "#555",
    marginTop: 14,
    fontWeight: "600",
  },

  routeCheck: {
    position: "absolute",
    right: 28,
    top: 43,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2D7EEB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#f3f7ff",
  },

  garagePanel: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    height: 178,
  },

  panelHandle: {
    width: 58,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dcdcdc",
    alignSelf: "center",
    marginBottom: -10,
    zIndex: 3,
  },

  garageCard: {
    width: screenWidth - 65,
    height: 170,
    backgroundColor: "white",
    borderRadius: 19,
    marginLeft: 33,
    marginRight: 8,
    padding: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 7,
  },

  activeGarageCard: {
    borderWidth: 1,
    borderColor: "#e9e9e9",
  },

  garageImage: {
    width: 105,
    height: 75,
    borderRadius: 9,
    marginTop: 14,
  },

  noGarageImage: {
    width: 105,
    height: 75,
    borderRadius: 9,
    marginTop: 14,
    backgroundColor: "#eef3ff",
    justifyContent: "center",
    alignItems: "center",
  },

  noPhotoText: {
    marginTop: 5,
    fontSize: 11,
    color: "#2D7EEB",
    fontWeight: "700",
  },

  garageInfo: {
    flex: 1,
    marginLeft: 13,
  },

  garageName: {
    fontSize: 16,
    fontWeight: "800",
    color: "black",
  },

  garageAddress: {
    fontSize: 13,
    color: "#555",
    marginTop: 5,
    fontWeight: "600",
  },

  garageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  garageMetaText: {
    fontSize: 10,
    color: "#2D7EEB",
    fontWeight: "600",
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#d7d7d7",
    marginHorizontal: 8,
  },

  ratingText: {
    fontSize: 10,
    color: "#2D7EEB",
    marginTop: 7,
    fontWeight: "600",
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginTop: 10,
  },

  directionsButton: {
    width: 150,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#2D7EEB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    alignSelf: "center",
  },

  directionsButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 15,
  },

  startButton: {
    width: 190,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#2D7EEB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 13,
    alignSelf: "center",
  },

  startButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "500",
  },
});