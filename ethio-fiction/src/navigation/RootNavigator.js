import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, BookOpen, Heart, Settings as SettingsIcon, ShieldCheck } from "lucide-react-native";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import BooksScreen from "../screens/BooksScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AdminPanelScreen from "../screens/admin/AdminPanelScreen";

const AuthStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="Books" component={BooksScreen} options={{ tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }} />
      <Tabs.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} /> }} />
      {isAdmin && (
        <Tabs.Screen name="Admin" component={AdminPanelScreen} options={{ tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} /> }} />
      )}
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) return null; // splash is shown by Expo's native splash screen

  return (
    <NavigationContainer>
      {session ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
