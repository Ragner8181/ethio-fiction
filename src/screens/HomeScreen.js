import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Sun, Moon } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/colors";
import { Card, PrimaryButton, Chip } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function HomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, isPremium } = useAuth();
  const [bookCount, setBookCount] = useState(null);

  useEffect(() => {
    supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setBookCount(count));
  }, []);

  const goToPayment = () => navigation.navigate("Settings", { initialTab: "payment" });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56 }}>
        <View>
          <Text style={{ fontSize: 11.5, color: theme.muted }}>Good to see you,</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 19, color: theme.text }}>{profile?.full_name || "Reader"}</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
          {isDark ? <Sun size={17} color={theme.text} /> : <Moon size={17} color={theme.text} />}
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Card style={{ marginBottom: 16, backgroundColor: theme.surface2 }}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 17, color: theme.text, marginBottom: 6, lineHeight: 23 }}>
            Ethiopia's stories, all in one library.
          </Text>
          <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 19 }}>
            Read online or download to your phone. Over{" "}
            <Text style={{ color: theme.goldSoft, fontFamily: fonts.bodySemibold }}>{bookCount ?? "200+"} Ethiopian fiction titles</Text>{" "}
            across drama, history, romance and adventure — new stories added every month.
          </Text>
        </Card>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
          {[[String(bookCount ?? "200+"), "Books"], ["40+", "Authors"], ["8", "Genres"]].map(([n, l]) => (
            <Card key={l} style={{ flex: 1, alignItems: "center", paddingVertical: 12 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 17, color: theme.goldSoft }}>{n}</Text>
              <Text style={{ fontSize: 10.5, color: theme.muted }}>{l}</Text>
            </Card>
          ))}
        </View>

        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: theme.muted, marginBottom: 10 }}>
          Choose your plan
        </Text>

        <Card style={{ marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: theme.text }}>Free</Text>
            <Text style={{ fontSize: 11.5, color: theme.muted }}>Read & download 3 books</Text>
          </View>
          {!isPremium && <Chip label="Current" />}
        </Card>

        <Card style={{ marginBottom: 10, borderColor: theme.gold, borderWidth: 1.5, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: theme.text }}>Premium — 1 Year</Text>
            <Text style={{ fontSize: 11.5, color: theme.muted }}>Full library, 12 months</Text>
          </View>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 15, color: theme.goldSoft }}>1,400 ETB</Text>
        </Card>

        <Card style={{ marginBottom: 18, borderColor: theme.gold, borderWidth: 1.5, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: theme.text }}>Premium — 2 Years</Text>
            <Text style={{ fontSize: 11.5, color: theme.muted }}>Full library, 24 months · best value</Text>
          </View>
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 15, color: theme.goldSoft }}>2,500 ETB</Text>
        </Card>

        {!isPremium && <PrimaryButton title="Subscribe to Premium" onPress={goToPayment} />}
      </View>
    </ScrollView>
  );
}
