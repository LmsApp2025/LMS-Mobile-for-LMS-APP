import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
// NEW: Import the service function
import { getCategories } from '@/services/layout.service';

type CategoryType = { _id: string; title: string; };

const categoryIcons = [
    require('@/assets/icons/development.png'),
    require('@/assets/icons/marketing.png'),
];

export default function Categories() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  let [fontsLoaded, fontError] = useFonts({ Raleway_700Bold });

  useEffect(() => {
    const fetchCategories = async () => {
      const fetchedCategories = await getCategories(); // Use the service function
      setCategories(fetchedCategories);
    };
    fetchCategories();
  }, []);

  const handleCategoryPress = (category: CategoryType) => {
    router.push({
      pathname: '/(routes)/courses-by-category',
      params: { categoryId: category._id, categoryName: category.title }
    });
  };

  if (!fontsLoaded || fontError || categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { fontFamily: 'Raleway_700Bold' }]}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((item, index) => (
          <TouchableOpacity key={item._id} style={styles.categoryItem} onPress={() => handleCategoryPress(item)}>
            <Image source={categoryIcons[index % categoryIcons.length]} style={styles.icon} />
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, marginHorizontal: 16 },
  header: { fontSize: 20, marginBottom: 10 },
  categoryItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginRight: 10, alignItems: 'center', width: 100 },
  icon: { width: 40, height: 40, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '600' }
});