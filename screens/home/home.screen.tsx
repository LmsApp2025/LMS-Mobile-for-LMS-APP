import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "@/components/header/header";
import HomeBannerSlider from "@/components/home/home.banner.slider";
import { useEffect, useState, useMemo, useCallback } from "react";
import Loader from "@/components/loader/loader";
import CourseCard from "@/components/cards/course.card";
import { router, useFocusEffect } from "expo-router";
import { useFonts as useRalewayFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts as useNunitoFonts, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import useUser from "@/hooks/auth/useUser";
import Categories from "@/components/home/Categories";
// NEW: Import the service function
import { getAllCourses } from "@/services/course.service";
import axiosInstance from "@/utils/axios.instance"; // Still needed for avatar

export default function HomeScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const { user, loading: userLoading, refetch: refetchUser } = useUser();
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(null);

  const [ralewayLoaded] = useRalewayFonts({ Raleway_700Bold });
  const [nunitoLoaded] = useNunitoFonts({ Nunito_600SemiBold });
  const fontsLoaded = ralewayLoaded && nunitoLoaded;

  useFocusEffect(useCallback(() => { refetchUser(); }, [refetchUser]));

  useEffect(() => {
    const getAvatarUrl = async () => {
      if (user?.avatar?.public_id) {
        try {
          const res = await axiosInstance.get(`/get-avatar-url`, { params: { objectName: user.avatar.public_id } });
          setDisplayAvatarUrl(res.data.url);
        } catch (error) {
          setDisplayAvatarUrl(null);
        }
      } else {
        setDisplayAvatarUrl(user?.avatar?.url || null);
      }
    };
    getAvatarUrl();
  }, [user]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      const fetchedCourses = await getAllCourses(); // Use the service function
      setCourses(fetchedCourses);
      setLoadingCourses(false);
    };
    fetchCourses();
  }, []);
  
  // Filtered courses memoization remains the same
  const filteredCourses = useMemo(() => courses, [courses]);

  if (userLoading || loadingCourses || !fontsLoaded) {
    return <Loader />;
  }
  
  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
      <Header user={user} avatarUrl={displayAvatarUrl} />
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <HomeBannerSlider />
            <TouchableOpacity onPress={() => router.push("/(tabs)/courses")} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All Courses</Text>
            </TouchableOpacity>
            <Categories />
          </>
        }
        ListEmptyComponent={<View style={{alignItems: 'center', marginTop: 50}}><Text>No courses found.</Text></View>}
        renderItem={({ item }) => <CourseCard item={item} />}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  seeAllButton: { marginHorizontal: 16, marginVertical: 20, padding: 14, backgroundColor: '#2467EC', borderRadius: 8, alignItems: 'center' },
  seeAllText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_600SemiBold' }
});