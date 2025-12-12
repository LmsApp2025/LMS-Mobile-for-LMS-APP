// In: screens/courses/course.access.tsx (REFACTORED)

import { View, Text, ScrollView, RefreshControl, Alert } from "react-native";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Toast } from "react-native-toast-notifications";
import { getCourseContent, getCourseDetails } from "@/services/course.service";
import Loader from "@/components/loader/loader";
import * as ScreenCapture from 'expo-screen-capture';
import CustomVideoPlayer from '@/components/common/CustomVideoPlayer';
import useUser from '@/hooks/auth/useUser';
import LessonNavigation from "@/components/courses/LessonNavigation";
import LessonContent from "@/components/courses/LessonContent";

const useScreenCaptureProtection = () => {
  useFocusEffect(useCallback(() => {
    const activate = async () => await ScreenCapture.preventScreenCaptureAsync();
    activate();
    return () => ScreenCapture.allowScreenCaptureAsync();
  }, []));
  useEffect(() => {
    const sub = ScreenCapture.addScreenshotListener(() => Alert.alert("Screenshots are not allowed."));
    return () => sub.remove();
  }, []);
};

export default function CourseAccessScreen() {
  useScreenCaptureProtection();
  const { user } = useUser();
  const { lessonId, courseId } = useLocalSearchParams<{ lessonId: string, courseId: string }>();
  
  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [course, setCourse] = useState<CoursesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!courseId || !lessonId) return;
      setIsLoading(true);
      try {
        const [courseDetails, allModules] = await Promise.all([
          getCourseDetails(courseId),
          getCourseContent(courseId),
        ]);
        if (courseDetails) {
            setCourse({ ...courseDetails, modules: allModules });
            let foundLesson: LessonType | null = null;
            for (const module of allModules) {
              let l = module.lessons.find(l => l._id === lessonId);
              if (l) { foundLesson = l; break; }
              let a = module.assignments?.find(a => a.assignmentId === lessonId);
              if (a) { foundLesson = { _id: a.assignmentId, title: a.title, assignment: a, resources: [], quizzes: [] }; break; }
            }
            setLesson(foundLesson);
        }
      } catch (error) { Toast.show("Error loading content.", { type: "danger" }); }
      finally { setIsLoading(false); }
    };
    fetchContent();
  }, [courseId, lessonId]);

  const { prevLessonId, nextLessonId } = useMemo(() => {
      if (!course || !lesson) return { prevLessonId: null, nextLessonId: null };
      const allLessons = course.modules.flatMap(m => m.lessons);
      const currentIndex = allLessons.findIndex(l => l._id === lesson._id);
      if (currentIndex === -1) return { prevLessonId: null, nextLessonId: null };
      const prev = currentIndex > 0 ? allLessons[currentIndex - 1]._id : null;
      const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1]._id : null;
      return { prevLessonId: prev, nextLessonId: next };
  }, [course, lesson]);

  const handleNavigate = (targetLessonId: string) => {
      router.replace({ pathname: "/(routes)/course-access", params: { lessonId: targetLessonId, courseId } });
  };

  if (isLoading) return <Loader />;
  if (!lesson || !course || !user) return <View><Text>Content could not be loaded.</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: '#F6F7F9' }}>
        {lesson.videoUrl && <CustomVideoPlayer hlsUrl={lesson.videoUrl} username={user.username} />}
        <LessonNavigation prevLessonId={prevLessonId} nextLessonId={nextLessonId} onNavigate={handleNavigate} />
        <LessonContent lesson={lesson} course={course} />
      </ScrollView>
    </View>
  );
}