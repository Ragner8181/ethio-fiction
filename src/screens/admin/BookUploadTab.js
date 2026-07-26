import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { UploadCloud, FileText, Pencil, Trash2 } from "lucide-react-native";

import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/colors";
import { Card, Input, PrimaryButton } from "../../components/UI";
import { supabase, supabaseUrl, supabaseAnonKey } from "../../lib/supabase";

const EXT_FOR_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

// Uploads a file to Supabase Storage. On the web, the browser's native
// fetch/blob support works fine for this. On phones, we stream straight
// from disk instead — reading a large PDF into memory first (the web
// approach) crashes with out-of-memory errors on native devices.
async function uploadToBucket(bucket, uri, pathPrefix, contentType) {
  const fileExt = EXT_FOR_TYPE[contentType] || "bin";
  const path = `${pathPrefix}/${Date.now()}.${fileExt}`;

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType });
    if (error) throw error;
  } else {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("You need to be logged in to upload.");

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    const result = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
        "Content-Type": contentType,
      },
    });
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed (${result.status}): ${result.body?.slice(0, 200) || "unknown error"}`);
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Pulls the storage path back out of a public URL so we can delete the
// underlying file when a book is removed (keeps storage usage tidy).
function extractStoragePath(url, bucket) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function EditBookModal({ book, onClose, onSaved }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [genre, setGenre] = useState(book.genre || "");
  const [isFree, setIsFree] = useState(!!book.is_free);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert("Missing info", "Title and author can't be empty.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("books")
      .update({ title: title.trim(), author: author.trim(), genre: genre.trim() || "Fiction", is_free: isFree })
      .eq("id", book.id);
    setSaving(false);
    if (error) {
      Alert.alert("Couldn't save", error.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "#0000009c", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 22, width: "100%", maxWidth: 380, borderWidth: 1, borderColor: theme.border, gap: 12 }}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: theme.text }}>Edit book</Text>
          <Input placeholder="Book title" value={title} onChangeText={setTitle} style={{ marginBottom: 0 }} />
          <Input placeholder="Author name" value={author} onChangeText={setAuthor} style={{ marginBottom: 0 }} />
          <Input placeholder="Genre" value={genre} onChangeText={setGenre} style={{ marginBottom: 0 }} />
          <TouchableOpacity onPress={() => setIsFree((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: theme.gold, backgroundColor: isFree ? theme.gold : "transparent" }} />
            <Text style={{ fontSize: 12.5, color: theme.text }}>Free-plan book</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surface2, alignItems: "center" }}>
              <Text style={{ color: theme.text, fontFamily: fonts.bodySemibold }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={saving} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.gold, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
              <Text style={{ color: "#241609", fontFamily: fonts.bodySemibold }}>{saving ? "Saving…" : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteBookModal({ book, step, onCancel, onConfirmStep, deleting }) {
  const { theme } = useTheme();
  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "#0000009c", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 22, width: "100%", maxWidth: 340, borderWidth: 1, borderColor: theme.border }}>
          {step === 1 ? (
            <>
              <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: theme.text, marginBottom: 8 }}>Delete "{book.title}"?</Text>
              <Text style={{ fontSize: 12.5, color: theme.muted, marginBottom: 18 }}>This removes it from the library and deletes its cover and PDF file.</Text>
            </>
          ) : (
            <>
              <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: theme.rust, marginBottom: 8 }}>Are you sure?</Text>
              <Text style={{ fontSize: 12.5, color: theme.muted, marginBottom: 18 }}>This can't be undone — the book will be permanently deleted.</Text>
            </>
          )}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.surface2, alignItems: "center" }}>
              <Text style={{ color: theme.text, fontFamily: fonts.bodySemibold }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirmStep} disabled={deleting} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.danger, alignItems: "center", opacity: deleting ? 0.6 : 1 }}>
              <Text style={{ color: "#fff", fontFamily: fonts.bodySemibold }}>{deleting ? "Deleting…" : step === 1 ? "Delete" : "Yes, Delete"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function BookUploadTab() {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [coverUri, setCoverUri] = useState(null);
  const [coverType, setCoverType] = useState("image/jpeg");
  const [pdfFile, setPdfFile] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const loadBooks = useCallback(async () => {
    const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    setAllBooks(data || []);
  }, []);

  useFocusEffect(useCallback(() => { loadBooks(); }, [loadBooks]));

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      setCoverUri(result.assets[0].uri);
      setCoverType(result.assets[0].mimeType || "image/jpeg");
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.assets?.[0]) setPdfFile(result.assets[0]);
  };

  const reset = () => {
    setTitle(""); setAuthor(""); setGenre(""); setIsFree(false);
    setCoverUri(null); setCoverType("image/jpeg"); setPdfFile(null);
  };

  const publish = async () => {
    if (!title.trim() || !author.trim() || !coverUri || !pdfFile) {
      Alert.alert("Missing info", "Title, author, cover image, and PDF are all required.");
      return;
    }
    setPublishing(true);
    try {
      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const coverUrl = await uploadToBucket("covers", coverUri, slug, coverType);
      const pdfUrl = await uploadToBucket("pdfs", pdfFile.uri, slug, "application/pdf");

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
      loadBooks();
    } catch (err) {
      Alert.alert("Couldn't publish", err.message);
    } finally {
      setPublishing(false);
    }
  };

  const confirmDeleteStep = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    setDeleting(true);
    try {
      const coverPath = extractStoragePath(deletingBook.cover_url, "covers");
      const pdfPath = extractStoragePath(deletingBook.pdf_url, "pdfs");
      if (coverPath) await supabase.storage.from("covers").remove([coverPath]);
      if (pdfPath) await supabase.storage.from("pdfs").remove([pdfPath]);

      const { error } = await supabase.from("books").delete().eq("id", deletingBook.id);
      if (error) throw error;

      setDeletingBook(null);
      setDeleteStep(0);
      loadBooks();
    } catch (err) {
      Alert.alert("Couldn't delete", err.message);
    } finally {
      setDeleting(false);
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, textTransform: "uppercase", color: theme.muted }}>
              All books ({allBooks.length})
            </Text>
          </View>
          {allBooks.map((b) => (
            <Card key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10 }}>
              <View style={{ width: 34, height: 46, borderRadius: 6, backgroundColor: theme.surface2 }} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: fonts.bodySemibold, color: theme.text }}>{b.title}</Text>
                <Text style={{ fontSize: 11, color: theme.muted }}>{b.author}{b.is_free ? " · Free" : ""}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingBook(b)} style={{ padding: 6 }}>
                <Pencil size={16} color={theme.goldSoft} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setDeletingBook(b); setDeleteStep(1); }} style={{ padding: 6 }}>
                <Trash2 size={16} color={theme.danger} />
              </TouchableOpacity>
            </Card>
          ))}
          {allBooks.length === 0 && (
            <Text style={{ fontSize: 12.5, color: theme.muted }}>No books uploaded yet.</Text>
          )}
        </View>
      </View>

      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSaved={() => { setEditingBook(null); loadBooks(); }}
        />
      )}

      {deletingBook && (
        <DeleteBookModal
          book={deletingBook}
          step={deleteStep}
          deleting={deleting}
          onCancel={() => { setDeletingBook(null); setDeleteStep(0); }}
          onConfirmStep={confirmDeleteStep}
        />
      )}
    </ScrollView>
  );
}
