import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { UploadCloud, FileText } from "lucide-react-native";

import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/colors";
import { Card, Input, PrimaryButton } from "../../components/UI";
import { supabase } from "../../lib/supabase";

async function uploadToBucket(bucket, uri, pathPrefix) {
  const fileExt = uri.split(".").pop().split("?")[0];
  const path = `${pathPrefix}/${Date.now()}.${fileExt}`;
  const response = await fetch(uri);
  const blob = await response.blob();
  const { error } = await supabase.storage.from(bucket).upload(path, blob);
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export default function BookUploadTab() {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [coverUri, setCoverUri] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [recent, setRecent] = useState([]);

  const loadRecent = useCallback(async () => {
    const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false }).limit(6);
    setRecent(data || []);
  }, []);

  useFocusEffect(useCallback(() => { loadRecent(); }, [loadRecent]));

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) setCoverUri(result.assets[0].uri);
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.assets?.[0]) setPdfFile(result.assets[0]);
  };

  const reset = () => {
    setTitle(""); setAuthor(""); setGenre(""); setIsFree(false); setCoverUri(null); setPdfFile(null);
  };

  const publish = async () => {
    if (!title.trim() || !author.trim() || !coverUri || !pdfFile) {
      Alert.alert("Missing info", "Title, author, cover image, and PDF are all required.");
      return;
    }
    setPublishing(true);
    try {
      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const coverUrl = await uploadToBucket("covers", coverUri, slug);
      const pdfUrl = await uploadToBucket("pdfs", pdfFile.uri, slug);

      const { error } = await supabase.from("books").insert({
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim() || "Fiction",
        cover_url: coverUrl,
        pdf_url: pdfUrl,
        is_free: isFree,
      });
      if (error) throw error;

      Alert.alert("Published", `"${title.trim()}" is now live in the library.`);
      reset();
      loadRecent();
    } catch (err) {
      Alert.alert("Couldn't publish", err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
      <View>
        <Text style={{ fontFamily: fonts.serif, fontSize: 19, color: theme.text }}>Book Upload Center</Text>
        <Text style={{ fontSize: 12.5, color: theme.muted, marginTop: 4 }}>Add a new title to the library.</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 300, gap: 12 }}>
          <Input placeholder="Book title" value={title} onChangeText={setTitle} style={{ marginBottom: 0 }} />
          <Input placeholder="Author name" value={author} onChangeText={setAuthor} style={{ marginBottom: 0 }} />
          <Input placeholder="Genre (optional)" value={genre} onChangeText={setGenre} style={{ marginBottom: 0 }} />

          <TouchableOpacity onPress={pickCover} style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border, paddingVertical: 12, borderRadius: 10 }}>
            <UploadCloud size={15} color={theme.text} />
            <Text style={{ color: theme.text, fontFamily: fonts.bodySemibold, fontSize: 13 }}>
              {coverUri ? "Cover selected ✓" : "Upload cover (JPG/PNG)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickPdf} style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border, paddingVertical: 12, borderRadius: 10 }}>
            <FileText size={15} color={theme.text} />
            <Text style={{ color: theme.text, fontFamily: fonts.bodySemibold, fontSize: 13 }}>
              {pdfFile ? "PDF selected ✓" : "Upload PDF file"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsFree((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: theme.gold, backgroundColor: isFree ? theme.gold : "transparent" }} />
            <Text style={{ fontSize: 12.5, color: theme.text }}>Make this one of the free-plan books</Text>
          </TouchableOpacity>

          <PrimaryButton title="Publish Book" onPress={publish} loading={publishing} />
        </Card>

        <View style={{ flex: 1, minWidth: 260, gap: 8 }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, textTransform: "uppercase", color: theme.muted }}>Recently uploaded</Text>
          {recent.map((b) => (
            <Card key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10 }}>
              <View style={{ width: 34, height: 46, borderRadius: 6, backgroundColor: theme.surface2 }} />
              <View>
                <Text style={{ fontSize: 12.5, fontFamily: fonts.bodySemibold, color: theme.text }}>{b.title}</Text>
                <Text style={{ fontSize: 11, color: theme.muted }}>{b.author}</Text>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
