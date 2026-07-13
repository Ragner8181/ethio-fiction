import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from "react-native";
import { Search, Heart, Download, Lock } from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/colors";
import { Card, Chip } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function BookCover({ book, theme }) {
  return (
    <View style={{ width: 54, height: 74, borderRadius: 10, backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center", padding: 4 }}>
      <Text style={{ fontFamily: fonts.serifBold, fontSize: 10, color: theme.goldSoft, textAlign: "center" }} numberOfLines={4}>
        {book.title}
      </Text>
    </View>
  );
}

export default function BooksScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, isPremium } = useAuth();
  const [books, setBooks] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState(null); // { id, progress }

  const loadData = useCallback(async () => {
    const { data: bookRows } = await supabase.from("books").select("*").order("created_at", { ascending: true });
    setBooks(bookRows || []);

    if (user) {
      const { data: favRows } = await supabase.from("favorites").select("book_id").eq("user_id", user.id);
      setFavoriteIds((favRows || []).map((r) => r.book_id));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFavorite = async (bookId) => {
    const isFav = favoriteIds.includes(bookId);
    setFavoriteIds((ids) => (isFav ? ids.filter((id) => id !== bookId) : [...ids, bookId]));
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("book_id", bookId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, book_id: bookId });
    }
  };

  const canAccess = (book) => book.is_free || isPremium;

  const handleDownload = async (book) => {
    if (!canAccess(book)) {
      navigation.navigate("Settings", { initialTab: "payment" });
      return;
    }
    try {
      setDownloading({ id: book.id, progress: 0 });
      const dest = FileSystem.documentDirectory + book.title.replace(/[^a-z0-9]/gi, "_") + ".pdf";
      const downloadResumable = FileSystem.createDownloadResumable(
        book.pdf_url,
        dest,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          const progress = Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100);
          setDownloading({ id: book.id, progress });
        }
      );
      const result = await downloadResumable.downloadAsync();
      setDownloading({ id: book.id, progress: 100 });

      await supabase.from("downloads").insert({ user_id: user.id, book_id: book.id });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri); // lets the person open it in their PDF reader of choice
      }
      setTimeout(() => setDownloading(null), 1200);
    } catch (err) {
      setDownloading(null);
      Alert.alert("Download failed", err.message);
    }
  };

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 20, color: theme.text }}>Books</Text>
        <Chip label={`${books.length} titles`} tone="gold" />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Search size={15} color={theme.muted} />
          <TextInput
            placeholder="Search by title or author…"
            placeholderTextColor={theme.muted}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, marginLeft: 8, color: theme.text, fontFamily: fonts.body }}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        renderItem={({ item: book }) => {
          const isFav = favoriteIds.includes(book.id);
          const unlocked = canAccess(book);
          const isDownloadingThis = downloading?.id === book.id;

          return (
            <Card style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <BookCover book={book} theme={theme} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: theme.text }}>{book.title}</Text>
                <Text style={{ fontSize: 11.5, color: theme.muted, marginVertical: 3 }}>{book.author}</Text>
                <Chip label={book.genre || "Fiction"} />
                {isDownloadingThis && (
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: theme.goldSoft, marginTop: 4 }}>
                    Downloading… {downloading.progress}%
                  </Text>
                )}
              </View>
              <View style={{ gap: 10, alignItems: "center" }}>
                <TouchableOpacity onPress={() => toggleFavorite(book.id)}>
                  <Heart size={18} color={isFav ? theme.rust : theme.muted} fill={isFav ? theme.rust : "none"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDownload(book)}
                  style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: unlocked ? theme.gold : theme.surface2 }}
                >
                  {unlocked ? <Download size={15} color="#241609" /> : <Lock size={15} color={theme.rust} />}
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}
