import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/colors";

export function Label({ children }) {
  const { theme } = useTheme();
  return (
    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: theme.muted, marginBottom: 6, marginLeft: 2 }}>
      {children}
    </Text>
  );
}

export function Input({ icon, style, ...props }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.inputWrap, { backgroundColor: theme.surface2, borderColor: theme.border }, style]}>
      {icon}
      <TextInput
        placeholderTextColor={theme.muted}
        style={{ flex: 1, color: theme.text, fontFamily: fonts.body, fontSize: 14, paddingVertical: 4, marginLeft: icon ? 8 : 0 }}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export function PasswordInput({ placeholder, value, onChangeText }) {
  const [show, setShow] = useState(false);
  const { theme } = useTheme();
  return (
    <View style={[styles.inputWrap, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        style={{ flex: 1, color: theme.text, fontFamily: fonts.body, fontSize: 14 }}
      />
      <TouchableOpacity onPress={() => setShow((s) => !s)}>
        {show ? <EyeOff size={17} color={theme.muted} /> : <Eye size={17} color={theme.muted} />}
      </TouchableOpacity>
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primaryBtn, (disabled || loading) && { opacity: 0.6 }]}
      activeOpacity={0.85}
    >
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14.5, color: "#241609" }}>
        {loading ? "Please wait…" : title}
      </Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({ title, onPress, color }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.outlineBtn, { borderColor: color || theme.gold }]} activeOpacity={0.8}>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: color || theme.gold }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  const { theme } = useTheme();
  return (
    <View style={[{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: 16 }, style]}>
      {children}
    </View>
  );
}

export function Chip({ label, tone = "muted" }) {
  const { theme } = useTheme();
  const tones = {
    muted: { bg: theme.surface2, fg: theme.muted },
    gold: { bg: theme.gold + "33", fg: theme.goldSoft },
    success: { bg: theme.success + "33", fg: theme.success },
    danger: { bg: theme.danger + "33", fg: theme.danger },
  };
  const t = tones[tone] || tones.muted;
  return (
    <View style={{ backgroundColor: t.bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, alignSelf: "flex-start" }}>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 10, color: t.fg, textTransform: "uppercase" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#C79A3E",
    alignItems: "center",
  },
  outlineBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
});
