import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Users, ShieldCheck, BookOpen, Ban, RotateCcw } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/colors";
import { Card, Chip } from "../../components/UI";
import { supabase } from "../../lib/supabase";

export default function StatisticsTab() {
  const { theme } = useTheme();
  const [counts, setCounts] = useState({ total: 0, premium: 0, free: 0 });
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, plan_expires_at, created_at, banned, role")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    const total = data?.length || 0;
    const premium = data?.filter((u) => u.plan === "premium").length || 0;
    setCounts({ total, premium, free: total - premium });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isActive = (u) => u.plan !== "premium" || !u.plan_expires_at || new Date(u.plan_expires_at) > new Date();

  const toggleBan = (u) => {
    const willBan = !u.banned;
    Alert.alert(
      willBan ? "Ban this user?" : "Unban this user?",
      willBan
        ? `${u.email} will be immediately signed out and blocked from logging back in.`
        : `${u.email} will be able to log in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: willBan ? "Ban" : "Unban",
          style: willBan ? "destructive" : "default",
          onPress: async () => {
            setBusyId(u.id);
            const { error } = await supabase.from("profiles").update({ banned: willBan }).eq("id", u.id);
            setBusyId(null);
            if (error) {
              Alert.alert("Couldn't update", error.message);
              return;
            }
            load();
          },
        },
      ]
    );
  };

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
        {users.length === 0 && (
          <Text style={{ fontSize: 12.5, color: theme.muted, paddingVertical: 10 }}>No registered users yet.</Text>
        )}
        {users.map((u) => {
          const premium = u.plan === "premium";
          const active = isActive(u);
          const isSelf = u.role === "admin";
          return (
            <View key={u.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.border, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.bodySemibold, color: theme.text, flex: 1 }}>
                  {u.full_name || "(no name)"}
                </Text>
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                  {u.banned && <Chip label="Banned" tone="danger" />}
                  <Chip label={active ? "Active" : "Expired"} tone={active ? "success" : "danger"} />
                </View>
              </View>
              <Text style={{ fontSize: 12, color: theme.muted }}>{u.email}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <View>
                  <Text style={{ fontSize: 10.5, color: theme.muted }}>
                    {premium ? "Premium" : "Free"} · joined {new Date(u.created_at).toLocaleDateString()}
                  </Text>
                  {premium && u.plan_expires_at && (
                    <Text style={{ fontSize: 10.5, color: theme.goldSoft }}>
                      Expires {new Date(u.plan_expires_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                {!isSelf && (
                  <TouchableOpacity
                    onPress={() => toggleBan(u)}
                    disabled={busyId === u.id}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 5,
                      paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
                      backgroundColor: u.banned ? theme.success + "22" : theme.danger + "22",
                      opacity: busyId === u.id ? 0.5 : 1,
                    }}
                  >
                    {u.banned ? <RotateCcw size={13} color={theme.success} /> : <Ban size={13} color={theme.danger} />}
                    <Text style={{ fontSize: 11, fontFamily: fonts.bodySemibold, color: u.banned ? theme.success : theme.danger }}>
                      {u.banned ? "Unban" : "Ban"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}
