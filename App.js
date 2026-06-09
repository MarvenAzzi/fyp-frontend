import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, StyleSheet } from 'react-native';
import Home from './Home';
import Signup from './Signup';
import Signin from './Signin';
import EmailForForgetPassword from './EmailForForgetPassword';
import OtpForForgetPassword from './OtpForForgetPassword';
import ResetPassword from './ResetPassword';
import Getstarted from './Getstarted';
import AddCar from './AddCar';
import Profile from './Profile';
import AccountInformation from './AccountInformation';
import EditProfile from './EditProfile';
import MyCars from './MyCars';
import CarInfo from './CarInfo';
import CarInformation from './CarInformation';
import Diagnose from './Diagnose';
import GarageMap from './GarageMap';
import { useEffect } from 'react';
import { useFonts, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { LinearGradient } from 'expo-linear-gradient';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Getstarted");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={['#e5e8ef', '#B0BFF8']} style={styles.background}>
      <Image source={require('./assets/logo-vagdiag.png')} style={styles.img} />
    </LinearGradient>
  );
};

const Stack = createNativeStackNavigator();

export default function App() {
  const [loadFonts] = useFonts({ Outfit_700Bold });

  if (!loadFonts) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='logoscreen'>
        <Stack.Screen name='logoscreen'          component={SplashScreen}          options={{ headerShown: false }} />
        <Stack.Screen name='Signup'              component={Signup}                options={{ headerShown: false }} />
        <Stack.Screen name='Signin'              component={Signin}                options={{ headerShown: false }} />
        <Stack.Screen name='EmailForForgetPassword' component={EmailForForgetPassword} options={{ headerShown: false }} />
        <Stack.Screen name='OtpForForgetPassword' component={OtpForForgetPassword} options={{ headerShown: false }} />
        <Stack.Screen name='ResetPassword'       component={ResetPassword}         options={{ headerShown: false }} />
        <Stack.Screen name='Home'                component={Home}                  options={{ headerShown: false }} />
        <Stack.Screen name='Getstarted'          component={Getstarted}            options={{ headerShown: false }} />
        <Stack.Screen name='AddCar'              component={AddCar}                options={{ headerShown: false }} />
        <Stack.Screen name='Profile'             component={Profile}               options={{ headerShown: false }} />
        <Stack.Screen name='AccountInformation'  component={AccountInformation}    options={{ headerShown: false }} />
        <Stack.Screen name='EditProfile'         component={EditProfile}           options={{ headerShown: false }} />
        <Stack.Screen name='MyCars'              component={MyCars}                options={{ headerShown: false }} />
        <Stack.Screen name='CarInfo'             component={CarInfo}               options={{ headerShown: false }} />
        <Stack.Screen name='CarInformation'      component={CarInformation}        options={{ headerShown: false }} />
        <Stack.Screen name='Diagnose'            component={Diagnose}              options={{ headerShown: false }} />
        <Stack.Screen name='GarageMap'           component={GarageMap}             options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  img: { width: 290, height: 290 },
});