import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Heart, Bookmark } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { fonts } from "../theme/colors";
import { Card } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("book_id, books(*)")
      .eq("user_id", user.id);
    setFavorites((data || []).map((row) => row.books).filter(Boolean));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const removeFavorite = async (bookId) => {
    setFavorites((f) => f.filter((b) => b.id !== bookId));
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("book_id", bookId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Text style={{ fontFamily: fonts.serif, fontSize: 20, color: theme.text, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 }}>
        Favorites
      </Text>

      {favorites.length === 0 ? (
        <View style={{ alignItems: "center", padding: 60 }}>
          <Bookmark size={30} color={theme.muted} />
          <Text style={{ fontSize: 13, color: theme.muted, marginTop: 12, textAlign: "center" }}>
            No favorites yet. Tap the heart on any book to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          renderItem={({ item: book }) => (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 44, height: 60, borderRadius: 8, backgroundColor: theme.surface2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: theme.text }}>{book.title}</Text>
                <Text style={{ fontSize: 11.5, color: theme.muted }}>{book.author}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFavorite(book.id)}>
                <Heart size={18} color={theme.rust} fill={theme.rust} />
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
    </View>
  );
}
