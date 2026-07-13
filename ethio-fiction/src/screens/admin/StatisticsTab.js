import React, { useCallback, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Users, ShieldCheck, BookOpen, Activity } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/colors";
import { Card, Chip } from "../../components/UI";
import { supabase } from "../../lib/supabase";

export default function StatisticsTab() {
  const { theme } = useTheme();
  const [counts, setCounts] = useState({ total: 0, premium: 0, free: 0 });
  const [users, setUsers] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("email, full_name, plan, plan_expires_at, created_at").order("created_at", { ascending: false });
    setUsers(data || []);
    const total = data?.length || 0;
    const premium = data?.filter((u) => u.plan === "premium").length || 0;
    setCounts({ total, premium, free: total - premium });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isActive = (u) => !u.plan_expires_at || new Date(u.plan_expires_at) > new Date();

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
      <View>
        <Text style={{ fontFamily: fonts.serif, fontSize: 19, color: theme.text }}>Statistics Center</Text>
        <Text style={{ fontSize: 12.5, color: theme.muted, marginTop: 4 }}>Overview of your reader base.</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Users", value: counts.total, icon: Users },
          { label: "Premium", value: counts.premium, icon: ShieldCheck },
          { label: "Free", value: counts.free, icon: BookOpen },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, minWidth: 130 }}>
            <s.icon size={16} color={theme.goldSoft} />
            <Text style={{ fontFamily: fonts.mono, fontSize: 20, color: theme.text, marginTop: 8 }}>{s.value}</Text>
            <Text style={{ fontSize: 11, color: theme.muted }}>{s.label}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: theme.text }}>All registered users</Text>
          <Chip label={`${counts.total} total`} tone="gold" />
        </View>
        {users.map((u) => (
          <View key={u.email} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
            <View>
              <Text style={{ fontSize: 12.5, color: theme.text }}>{u.email}</Text>
              <Text style={{ fontSize: 10.5, color: theme.muted }}>{u.plan === "premium" ? "Premium" : "Free"} · joined {new Date(u.created_at).toLocaleDateString()}</Text>
            </View>
            <Chip label={isActive(u) ? "Active" : "Inactive"} tone={isActive(u) ? "success" : "danger"} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
