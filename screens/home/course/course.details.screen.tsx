"use client";
import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Nunito_400Regular } from "@expo-google-fonts/nunito";
import React, { useEffect, useState, useMemo } from "react";
import useUser from "@/hooks/auth/useUser";
import Loader from "@/components/loader/loader";
// NEW: Import the service function and the new component
import { getCourseContent } from "@/services/course.service";
import CourseCurriculum from "@/components/courses/CourseCurriculum";

export default function CourseDetailScreen() {
  const { user, loading: userLoading } = useUser();
  const { item } = useLocalSearchParams();
  const initialCourseData: CoursesType | null = item ? JSON.parse(item as string) : null;

  const [courseData, setCourseData] = useState<CoursesType | null>(initialCourseData);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const isEnrolled = useMemo(() => 
    user?.courses?.some((c: { _id: string }) => c._id === initialCourseData?._id)
  , [user, initialCourseData]);

  useEffect(() => {
    if (!isEnrolled) {
      setIsLoadingContent(false);
      return;
    }
    const fetchFullCourseContent = async () => {
      if (!initialCourseData?._id) { setIsLoadingContent(false); return; }
      const content = await getCourseContent(initialCourseData._id);
      setCourseData(prevData => ({ ...prevData!, modules: content }));
      setIsLoadingContent(false);
    };
    fetchFullCourseContent();
  }, [isEnrolled, initialCourseData]);

  let [fontsLoaded, fontError] = useFonts({ Raleway_700Bold, Nunito_400Regular });

  if (userLoading || isLoadingContent || !fontsLoaded || !courseData) {
    return <Loader />;
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1, paddingTop: 15 }}>
      <ScrollView>
        <View style={{ marginHorizontal: 16 }}>
          <Image source={{ uri: courseData.thumbnail.url! }} style={{ width: "100%", height: 230, borderRadius: 6 }} />
        </View>
        <Text style={styles.courseName}>{courseData.name}</Text>
        <View style={{ padding: 10 }}>
          <Text style={styles.heading}>Description</Text>
          <Text style={styles.descriptionText}>{courseData.description}</Text>
        </View>
        <View style={{ padding: 10 }}>
          <Text style={styles.heading}>Course Curriculum</Text>
          <CourseCurriculum course={courseData} isEnrolled={!!isEnrolled} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    courseName: { marginHorizontal: 16, marginTop: 15, fontSize: 24, fontFamily: "Raleway_700Bold" },
    heading: { fontSize: 20, fontFamily: "Raleway_700Bold", marginBottom: 10 },
    descriptionText: { fontSize: 16, color: '#525258', fontFamily: "Nunito_400Regular", lineHeight: 24 },
});