import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { Mail, User as UserIcon, BookOpen } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/colors";
import { Input, PasswordInput, PrimaryButton, Label } from "../components/UI";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please fill in every field to create your account.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Your password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Re-enter your password so both fields match.");
      return;
    }

    setLoading(true);
    const { error } = await signUp({ fullName: fullName.trim(), email: email.trim(), password });
    setLoading(false);

    if (error) {
      Alert.alert("Couldn't create account", error.message);
      return;
    }
    navigation.navigate("Login");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 26, alignItems: "center", backgroundColor: theme.surface }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <BookOpen size={22} color={theme.goldSoft} />
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 22, color: theme.goldSoft }}>Join the shelf</Text>
        </View>
        <Text style={{ fontSize: 12, color: theme.muted, marginTop: 6 }}>200+ Ethiopian stories are waiting for you.</Text>
      </View>

      <View style={{ padding: 24 }}>
        <Label>Full name</Label>
        <Input icon={<UserIcon size={15} color={theme.muted} />} placeholder="Your name" value={fullName} onChangeText={setFullName} />

        <Label>Email</Label>
        <Input icon={<Mail size={15} color={theme.muted} />} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />

        <Label>Password</Label>
        <PasswordInput placeholder="At least 6 characters" value={password} onChangeText={setPassword} />

        <Label>Confirm password</Label>
        <PasswordInput placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} />

        <PrimaryButton title="Create Account" onPress={handleRegister} loading={loading} />

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 18 }}>
          <Text style={{ fontSize: 12.5, color: theme.muted }}>Already have an account? </Text>
          <Text style={{ fontSize: 12.5, color: theme.goldSoft, fontFamily: fonts.bodySemibold }} onPress={() => navigation.navigate("Login")}>
            Log in
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
