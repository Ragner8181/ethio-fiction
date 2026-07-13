import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/colors";
import { Card, Input } from "../../components/UI";
import { supabase } from "../../lib/supabase";

const PLAN_DAYS = { "1yr": 365, "2yr": 730 };

function AccountForm() {
  const { theme } = useTheme();
  const [method, setMethod] = useState("birr");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("payment_accounts")
      .select("*")
      .eq("method", method)
      .maybeSingle()
      .then(({ data }) => setForm(data || {}));
  }, [method]);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    const payload = { method, ...form, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("payment_accounts").upsert(payload, { onConflict: "method" });
    setSaving(false);
    if (error) Alert.alert("Couldn't save", error.message);
    else Alert.alert("Saved", "This appears instantly to every user under Settings → Payment.");
  };

  return (
    <Card style={{ maxWidth: 440, gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {["birr", "usdt"].map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMethod(m)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: method === m ? theme.gold : theme.surface2 }}
          >
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: method === m ? "#241609" : theme.text }}>
              By {m === "birr" ? "Birr" : "USDT"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {method === "birr" ? (
        <>
          <Input placeholder="Bank name" value={form.bank_name || ""} onChangeText={set("bank_name")} style={{ marginBottom: 0 }} />
          <Input placeholder="Account name" value={form.account_name || ""} onChangeText={set("account_name")} style={{ marginBottom: 0 }} />
          <Input placeholder="Account number" value={form.account_number || ""} onChangeText={set("account_number")} style={{ marginBottom: 0 }} />
        </>
      ) : (
        <>
          <Input placeholder="USDT network (e.g. TRC20)" value={form.usdt_network || ""} onChangeText={set("usdt_network")} style={{ marginBottom: 0 }} />
          <Input placeholder="USDT address" value={form.usdt_address || ""} onChangeText={set("usdt_address")} style={{ marginBottom: 0 }} />
        </>
      )}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Input placeholder="Amount (1 year)" value={form.amount_1yr || ""} onChangeText={set("amount_1yr")} style={{ flex: 1, marginBottom: 0 }} keyboardType="numeric" />
        <Input placeholder="Amount (2 years)" value={form.amount_2yr || ""} onChangeText={set("amount_2yr")} style={{ flex: 1, marginBottom: 0 }} keyboardType="numeric" />
      </View>

      <TouchableOpacity onPress={save} disabled={saving} style={{ backgroundColor: theme.gold, paddingVertical: 12, borderRadius: 10, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
        <Text style={{ fontFamily: fonts.bodySemibold, color: "#241609" }}>{saving ? "Saving…" : "Save Payment Details"}</Text>
      </TouchableOpacity>
    </Card>
  );
}

export default function PaymentApprovalTab() {
  const { theme } = useTheme();
  const [pending, setPending] = useState([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("payments")
      .select("*, profiles(full_name, email)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPending(data || []);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decide = async (payment, approve) => {
    if (approve) {
      const days = PLAN_DAYS[payment.plan] || 365;
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plan: "premium", plan_expires_at: expires })
        .eq("id", payment.user_id);
      if (profileError) return Alert.alert("Error", profileError.message);
    }
    const { error } = await supabase
      .from("payments")
      .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", payment.id);
    if (error) return Alert.alert("Error", error.message);
    setPending((p) => p.filter((x) => x.id !== payment.id));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
      <View>
        <Text style={{ fontFamily: fonts.serif, fontSize: 19, color: theme.text }}>Payment Approval Center</Text>
        <Text style={{ fontSize: 12.5, color: theme.muted, marginTop: 4 }}>
          Review proof of payment, then approve to unlock the full library for that user.
        </Text>
      </View>

      {pending.length === 0 ? (
        <Card><Text style={{ color: theme.muted, fontSize: 13 }}>No pending payments right now.</Text></Card>
      ) : (
        pending.map((p) => (
          <Card key={p.id} style={{ gap: 6 }}>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: theme.text }}>{p.profiles?.email}</Text>
            <Text style={{ fontSize: 11.5, color: theme.muted }}>Plan: {p.plan === "2yr" ? "2 Years — 2,500 ETB" : "1 Year — 1,400 ETB"}</Text>
            {p.proof_text && <Text style={{ fontSize: 11.5, color: theme.muted }}>Reference: {p.proof_text}</Text>}
            {p.proof_image_url && <Text style={{ fontSize: 11.5, color: theme.goldSoft }}>Screenshot attached</Text>}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <TouchableOpacity onPress={() => decide(p, true)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.success + "22", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                <CheckCircle2 size={14} color={theme.success} /><Text style={{ color: theme.success, fontFamily: fonts.bodySemibold, fontSize: 12 }}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => decide(p, false)} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.danger + "22", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                <XCircle size={14} color={theme.danger} /><Text style={{ color: theme.danger, fontFamily: fonts.bodySemibold, fontSize: 12 }}>Reject</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      <View>
        <Text style={{ fontFamily: fonts.serif, fontSize: 15, color: theme.text, marginBottom: 10 }}>Manage payment accounts</Text>
        <AccountForm />
      </View>
    </ScrollView>
  );
}
