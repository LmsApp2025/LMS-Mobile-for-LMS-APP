// In new-client/app/(routes)/enrolled-courses/index.tsx
import { useEffect, useState, useCallback } from "react"; // <-- Import useCallback
import CourseCard from "@/components/cards/course.card";
import Loader from "@/components/loader/loader";
import useUser from "@/hooks/auth/useUser";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, View, Text, RefreshControl } from "react-native"; // <-- Import RefreshControl
//import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import axiosInstance from "@/utils/axios.instance";

export default function EnrolledCoursesScreen() {
  // THE FIX: Get the refetch function from the useUser hook
  const { loading: userLoading, user, refetch: refetchUser } = useUser();
  const [fullCourses, setFullCourses] = useState<CoursesType[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // <-- State for the refresh control

  const fetchFullCourseDetails = useCallback(async () => {
    if (user && user.courses && user.courses.length > 0) {
      try {
        const courseDetailPromises = user.courses.map(enrolledCourse =>
          axiosInstance.get(`${SERVER_URI}/get-course/${enrolledCourse._id}`)
        );
        const responses = await Promise.all(courseDetailPromises);
        const fetchedCourses = responses.map(res => res.data.course);
        setFullCourses(fetchedCourses);
      } catch (error) {
        console.error("Failed to fetch details for enrolled courses:", error);
        setFullCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    } else {
      setLoadingCourses(false);
    }
  }, [user]); // <-- useCallback dependency

  useEffect(() => {
    if (!userLoading) {
      fetchFullCourseDetails();
    }
  }, [user, userLoading, fetchFullCourseDetails]);

  // THE FIX: Create the onRefresh function
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchUser(); // Refetch the core user data
    // The useEffect will automatically re-run and fetch the full course details
    setIsRefreshing(false);
  }, [refetchUser]);

  const isLoading = userLoading || loadingCourses;

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1 }}>
          <FlatList
            data={fullCourses}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => <CourseCard item={item} />}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                <Text style={{ fontSize: 18, color: '#666' }}>You are not enrolled in any courses yet.</Text>
              </View>
            }
            // THE FIX: Add the RefreshControl component
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          />
        </LinearGradient>
      )}
    </>
  );
}
