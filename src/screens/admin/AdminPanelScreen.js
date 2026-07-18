import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ShieldCheck, UploadCloud, BarChart3, BookOpen } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/colors";

import PaymentApprovalTab from "./PaymentApprovalTab";
import BookUploadTab from "./BookUploadTab";
import StatisticsTab from "./StatisticsTab";

const TABS = [
  { key: "payments", label: "Payment Approval", icon: ShieldCheck },
  { key: "upload", label: "Book Upload", icon: UploadCloud },
  { key: "stats", label: "Statistics", icon: BarChart3 },
];

export default function AdminPanelScreen() {
  const { theme } = useTheme();
  const [tab, setTab] = useState("payments");

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <BookOpen size={18} color={theme.goldSoft} />
          <Text style={{ fontFamily: fonts.serifBold, fontSize: 15, color: theme.text }}>
            Ethio Fiction <Text style={{ color: theme.muted, fontFamily: fonts.body, fontSize: 11 }}>Admin</Text>
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTab(key)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
                    backgroundColor: active ? theme.gold + "22" : "transparent",
                  }}
                >
                  <Icon size={15} color={active ? theme.goldSoft : theme.muted} />
                  <Text style={{ fontSize: 12.5, fontFamily: fonts.bodySemibold, color: active ? theme.goldSoft : theme.muted }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {tab === "payments" && <PaymentApprovalTab />}
      {tab === "upload" && <BookUploadTab />}
      {tab === "stats" && <StatisticsTab />}
    </View>
  );
}
