import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { User as UserIcon, Wallet, BarChart3, LogOut, Sun, Moon, UploadCloud } from "lucide-react-native";

import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/colors";
import { Card, Input, PrimaryButton, OutlineButton } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const TABS = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "payment", label: "Payment", icon: Wallet },
  { key: "stats", label: "Statistics", icon: BarChart3 },
];

function Row({ k, v }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={{ fontSize: 12.5, color: theme.muted }}>{k}</Text>
      <Text style={{ fontSize: 12.5, fontFamily: fonts.bodySemibold, color: theme.text }}>{v}</Text>
    </View>
  );
}

export default function SettingsScreen({ route, navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, user, signOut } = useAuth();
  const [tab, setTab] = useState(route?.params?.initialTab || "profile");
  const [logoutStep, setLogoutStep] = useState(0);
  const [accounts, setAccounts] = useState({ birr: null, usdt: null });
  const [txid, setTxid] = useState("");
  const [proofUri, setProofUri] = useState(null);
  const [chosenPlan, setChosenPlan] = useState("1yr");
  const [stats, setStats] = useState({ downloaded: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (route?.params?.initialTab) setTab(route.params.initialTab);
  }, [route?.params?.initialTab]);

  useEffect(() => {
    supabase
      .from("payment_accounts")
      .select("*")
      .then(({ data }) => {
        const birr = data?.find((a) => a.method === "birr");
        const usdt = data?.find((a) => a.method === "usdt");
        setAccounts({ birr, usdt });
      });

    if (user) {
      supabase
        .from("downloads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => setStats({ downloaded: count || 0 }));
    }
  }, [user]);

  const pickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) setProofUri(result.assets[0].uri);
  };

  const submitPayment = async () => {
    if (!txid.trim() && !proofUri) {
      Alert.alert("Add proof", "Enter a transaction ID/reference or attach a screenshot.");
      return;
    }
    setSubmitting(true);
    try {
      let proofImageUrl = null;
      if (proofUri) {
        const fileExt = proofUri.split(".").pop();
        const path = `${user.id}/${Date.now()}.${fileExt}`;
        const response = await fetch(proofUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, blob);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
        proofImageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        plan: chosenPlan,
        proof_text: txid.trim() || null,
        proof_image_url: proofImageUrl,
        status: "pending",
      });
      if (error) throw error;

      Alert.alert("Submitted", "We'll unlock your full library once it's approved.");
      setTxid("");
      setProofUri(null);
    } catch (err) {
      Alert.alert("Couldn't submit", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Text style={{ fontFamily: fonts.serif, fontSize: 20, color: theme.text, paddingTop: 56, paddingHorizontal: 20 }}>Settings</Text>

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 14 }}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 10,
                backgroundColor: active ? theme.gold + "22" : theme.surface2,
                borderWidth: 1, borderColor: active ? theme.gold : theme.border,
              }}
            >
              <Icon size={15} color={active ? theme.goldSoft : theme.muted} style={{ marginBottom: 3 }} />
              <Text style={{ fontSize: 10.5, fontFamily: fonts.bodySemibold, color: active ? theme.goldSoft : theme.muted }}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {tab === "profile" && (
          <Card style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: theme.gold, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 18, color: "#241609" }}>
                  {(profile?.full_name || "R")[0]}
                </Text>
              </View>
              <View>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: theme.text }}>{profile?.full_name}</Text>
                <Text style={{ fontSize: 11.5, color: theme.muted }}>{user?.email}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
              <Text style={{ fontSize: 13, color: theme.text }}>{isDark ? "Dark mode" : "Light mode"}</Text>
              <TouchableOpacity onPress={toggleTheme} style={{ width: 44, height: 24, borderRadius: 99, backgroundColor: isDark ? theme.gold : theme.surface2, justifyContent: "center", paddingHorizontal: 3 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff", alignSelf: isDark ? "flex-end" : "flex-start" }} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {tab === "payment" && (
          <>
            <Card>
              <Text style={{ fontSize: 11.5, color: theme.muted }}>Current plan</Text>
              <Text style={{ fontFamily: fonts.serif, fontSize: 15, color: theme.goldSoft }}>
                {profile?.plan === "premium" ? "Premium" : "Free plan · 3 books unlocked"}
              </Text>
            </Card>

            {accounts.birr && (
              <Card style={{ gap: 4 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: theme.text, marginBottom: 4 }}>Pay by bank</Text>
                <Row k="Bank name" v={accounts.birr.bank_name} />
                <Row k="Account name" v={accounts.birr.account_name} />
                <Row k="Account number" v={accounts.birr.account_number} />
                <Row k="Amount" v={`${accounts.birr.amount_1yr} / ${accounts.birr.amount_2yr} ETB`} />
              </Card>
            )}

            {accounts.usdt && (
              <Card style={{ gap: 4 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: theme.text, marginBottom: 4 }}>Pay with USDT</Text>
                <Row k="Network" v={accounts.usdt.usdt_network} />
                <Row k="Address" v={accounts.usdt.usdt_address} />
                <Row k="Amount" v={`${accounts.usdt.amount_1yr} / ${accounts.usdt.amount_2yr} USDT`} />
              </Card>
            )}

            <Card style={{ gap: 10 }}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: theme.text }}>Submit your proof</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[["1yr", "1 Year — 1,400 ETB"], ["2yr", "2 Years — 2,500 ETB"]].map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setChosenPlan(key)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                      backgroundColor: chosenPlan === key ? theme.gold : theme.surface2,
                      borderWidth: 1, borderColor: chosenPlan === key ? theme.gold : theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontFamily: fonts.bodySemibold, color: chosenPlan === key ? "#241609" : theme.muted }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input placeholder="Transaction ID / reference" value={txid} onChangeText={setTxid} style={{ marginBottom: 0 }} />
              <OutlineButton title={proofUri ? "Screenshot attached ✓" : "Upload screenshot"} onPress={pickProof} />
              <PrimaryButton title="Submit for Approval" onPress={submitPayment} loading={submitting} />
              <Text style={{ fontSize: 10.5, color: theme.muted, textAlign: "center" }}>
                We'll unlock your full library once it's approved.
              </Text>
            </Card>
          </>
        )}

        {tab === "stats" && (
          <>
            <Card style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 22, color: theme.goldSoft }}>{stats.downloaded}</Text>
              <Text style={{ fontSize: 11, color: theme.muted }}>Books downloaded</Text>
            </Card>
            <Card style={{ gap: 6 }}>
              <Row k="Member since" v={new Date(user?.created_at).toLocaleDateString()} />
              <Row k="Current plan" v={profile?.plan === "premium" ? "Premium" : "Free"} />
              {profile?.plan_expires_at && <Row k="Renews / expires" v={new Date(profile.plan_expires_at).toLocaleDateString()} />}
            </Card>
          </>
        )}

        <Card style={{ borderColor: theme.danger }}>
          <TouchableOpacity
            onPress={() => setLogoutStep(1)}
            style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: theme.danger, paddingVertical: 12, borderRadius: 10 }}
          >
            <LogOut size={15} color="#fff" />
            <Text style={{ color: "#fff", fontFamily: fonts.bodySemibold }}>Log Out</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <Modal visible={logoutStep > 0} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#0000009c", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 22, width: "100%", maxWidth: 320, borderWidth: 1, borderColor: theme.border }}>
            {logoutStep === 1 ? (
              <>
                <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: theme.text, marginBottom: 8 }}>Log out of Ethio Fiction?</Text>
                <Text style={{ fontSize: 12.5, color: theme.muted, marginBottom: 18 }}>You'll need your email and password to log back in.</Text>
              </>
            ) : (
              <>
                <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: theme.rust, marginBottom: 8 }}>Are you sure?</Text>
                <Text style={{ fontSize: 12.5, color: theme.muted, marginBottom: 18 }}>This is your final confirmation — you'll be signed out now.</Text>
              </>
            )}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setLogoutStep(0)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surface2, alignItems: "center" }}>
                <Text style={{ color: theme.text, fontFamily: fonts.bodySemibold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => (logoutStep === 1 ? setLogoutStep(2) : (setLogoutStep(0), signOut()))}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.danger, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontFamily: fonts.bodySemibold }}>{logoutStep === 1 ? "Log Out" : "Yes, Log Out"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
