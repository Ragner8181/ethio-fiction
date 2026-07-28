import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, Image } from "react-native";
import { Mail, BookOpen } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/colors";
import { Input, PasswordInput, PrimaryButton, Label } from "../components/UI";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { signIn, banMessage, clearBanMessage } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (banMessage) {
      Alert.alert("Account suspended", banMessage, [{ text: "OK", onPress: clearBanMessage }]);
    }
  }, [banMessage]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing details", "Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    const { error } = await signIn({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert("Couldn't log in", error.message);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ paddingTop: 70, paddingBottom: 30, paddingHorizontal: 26, alignItems: "center", backgroundColor: theme.surface }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <BookOpen size={26} color={theme.goldSoft} />
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 26, color: theme.goldSoft }}>Ethio Fiction</Text>
        </View>
        <Text style={{ fontFamily: fonts.serif, fontSize: 18, fontStyle: "italic", color: theme.text, textAlign: "center", lineHeight: 26 }}>
          "አንድ መጽሐፍ ሺህ ዓለማትን ይከፍታል"
        </Text>
        <Text style={{ fontSize: 12, color: theme.muted, marginTop: 6 }}>One book opens a thousand worlds.</Text>
      </View>

      <View style={{ padding: 24 }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 21, color: theme.text, marginBottom: 4 }}>Welcome back</Text>
        <Text style={{ fontSize: 12.5, color: theme.muted, marginBottom: 20 }}>Log in to keep reading where you left off.</Text>

        <Label>Email</Label>
        <Input icon={<Mail size={15} color={theme.muted} />} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />

        <Label>Password</Label>
        <PasswordInput placeholder="••••••••" value={password} onChangeText={setPassword} />

        <PrimaryButton title="Log In" onPress={handleLogin} loading={loading} />

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 18 }}>
          <Text style={{ fontSize: 12.5, color: theme.muted }}>New to Ethio Fiction? </Text>
          <Text style={{ fontSize: 12.5, color: theme.goldSoft, fontFamily: fonts.bodySemibold }} onPress={() => navigation.navigate("Register")}>
            Create an account
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
