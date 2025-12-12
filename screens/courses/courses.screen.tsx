import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import Loader from "@/components/loader/loader";
import { LinearGradient } from "expo-linear-gradient";
import CourseCard from "@/components/cards/course.card";
// NEW: Import the service function
import { getAllCourses } from "@/services/course.service";

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const fetchedCourses = await getAllCourses(); // Use the service function
      setCourses(fetchedCourses);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  let [fontsLoaded, fontError] = useFonts({ Raleway_700Bold });
  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      {loading ? <Loader /> : (
        <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1, paddingTop: 65 }}>
          <Text style={{textAlign: 'center', fontSize: 22, fontFamily: 'Raleway_700Bold', padding: 15}}>All Courses</Text>
          <ScrollView style={{ marginHorizontal: 15 }}>
            {courses?.map((item: CoursesType, index: number) => (
              <CourseCard item={item} key={index} />
            ))}
            {courses?.length === 0 && <Text style={{ textAlign: "center", paddingTop: 50, fontSize: 18 }}>No courses found!</Text>}
          </ScrollView>
        </LinearGradient>
      )}
    </>
  );
}