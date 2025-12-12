import React, { FC, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useGetQuizSubmission from '@/hooks/submissions/useGetQuizSubmission';
import useGetSubmission from '@/hooks/submissions/useGetSubmission';

const QuizItem: FC<{ quiz: IQuiz; course: CoursesType; isEnrolled: boolean }> = ({ quiz, course, isEnrolled }) => {
    const { submission, loading } = useGetQuizSubmission(quiz.quizId);
    const hasSubmitted = !!submission;

    const handlePress = () => {
        if (!isEnrolled) { Alert.alert("Access Denied", "Please enroll to take quizzes."); return; }
        router.push({
            pathname: "/(routes)/quiz-session",
            params: { quizData: JSON.stringify(quiz), courseId: course._id, submissionData: submission ? JSON.stringify(submission) : undefined },
        });
    };
    return (
        <TouchableOpacity style={[styles.itemContainer, styles.quizContainer, hasSubmitted && styles.disabledItem]} onPress={handlePress} disabled={!isEnrolled}>
            <Ionicons name={isEnrolled ? (hasSubmitted ? "checkmark-circle" : "help-circle-outline") : "lock-closed-outline"} size={22} color={isEnrolled && !hasSubmitted ? "#9B59B6" : "#A9A9A9"} />
            <View style={{flex: 1, marginLeft: 10}}>
                <Text style={[styles.itemText, styles.quizText, (!isEnrolled || hasSubmitted) && { color: '#A9A9A9' }]}>{quiz.title}</Text>
                {loading && <ActivityIndicator size="small" />}
                {hasSubmitted && <Text style={styles.scoreText}>Score: {submission.score}/{submission.totalQuestions}</Text>}
            </View>
        </TouchableOpacity>
    );
};

const AssignmentItem: FC<{ assignment: AssignmentType; course: CoursesType; isEnrolled: boolean }> = ({ assignment, course, isEnrolled }) => {
    const { submission, loading } = useGetSubmission(assignment.assignmentId);
    const hasSubmitted = !!submission;
    const getStatusColor = (status: string) => status === 'graded' ? '#4CAF50' : status === 'needs revision' ? '#f44336' : '#FFC107';

    const handlePress = () => {
        if (!isEnrolled) { Alert.alert("Access Denied", "Please enroll to access assignments."); return; }
        router.push({ pathname: "/(routes)/course-access", params: { lessonId: assignment.assignmentId, courseId: course._id } });
    };

    return (
         <TouchableOpacity style={[styles.itemContainer, styles.assignmentContainer, hasSubmitted && styles.disabledItem]} onPress={handlePress} disabled={!isEnrolled}>
            <Ionicons name={isEnrolled ? (hasSubmitted ? "checkmark-circle" : "document-text-outline") : "lock-closed-outline"} size={22} color={isEnrolled && !hasSubmitted ? "#c35214" : "#A9A9A9"} />
             <View style={{flex: 1, marginLeft: 10}}>
                <Text style={[styles.itemText, styles.assignmentText, (!isEnrolled || hasSubmitted) && {color: '#A9A9A9'}]}>{assignment.title}</Text>
                {loading && <ActivityIndicator size="small" />}
                {hasSubmitted && <Text style={[styles.scoreText, { color: getStatusColor(submission.status), textTransform: 'capitalize' }]}>Status: {submission.status}</Text>}
            </View>
        </TouchableOpacity>
    );
};

// --- MAIN COMPONENT ---

const CourseCurriculum: FC<{ course: CoursesType; isEnrolled: boolean }> = ({ course, isEnrolled }) => {
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set());
  
  const toggleAccordion = (key: string) => {
    const newActiveState = new Set(activeModules);
    if (newActiveState.has(key)) newActiveState.delete(key);
    else newActiveState.add(key);
    setActiveModules(newActiveState);
  };

  const handleLessonPress = (lesson: LessonType) => {
    if (!isEnrolled) { Alert.alert("Access Denied", "Please enroll to access lessons."); return; }
    router.push({ pathname: "/(routes)/course-access", params: { lessonId: lesson._id, courseId: course._id } });
  };

  return (
    <View>
      {(course.modules || []).map((module) => {
        const moduleKey = module._id || module.moduleId;
        return (
          <View key={moduleKey} style={styles.moduleContainer}>
            <TouchableOpacity style={styles.moduleHeader} onPress={() => toggleAccordion(moduleKey)}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Ionicons name={activeModules.has(moduleKey) ? "chevron-up-outline" : "chevron-down-outline"} size={24} color="#333" />
            </TouchableOpacity>
            {activeModules.has(moduleKey) && (
              <View style={styles.itemsWrapper}>
                {(module.lessons || []).map((lesson) => (
                    <View key={lesson._id}>
                        <TouchableOpacity style={styles.itemContainer} onPress={() => handleLessonPress(lesson)} disabled={!isEnrolled}>
                            <Ionicons name={isEnrolled ? "play-circle-outline" : "lock-closed-outline"} size={22} color={isEnrolled ? "#2467EC" : "#A9A9A9"} />
                            <Text style={[styles.itemText, !isEnrolled && { color: '#A9A9A9' }]}>{lesson.title}</Text>
                        </TouchableOpacity>
                        {(lesson.quizzes || []).map((quiz) => <QuizItem key={quiz.quizId} quiz={quiz} course={course} isEnrolled={isEnrolled} />)}
                    </View>
                ))}
                {(module.assignments || []).map((assignment) => <AssignmentItem key={assignment.assignmentId} assignment={assignment} course={course} isEnrolled={isEnrolled} />)}
                {(module.quizzes || []).map((quiz) => <QuizItem key={quiz.quizId} quiz={quiz} course={course} isEnrolled={isEnrolled} />)}
              </View>
            )}
          </View>
        );
      })}
      {/* ... (Final Assignments and Final Quizzes rendering) ... */}
    </View>
  );
};

const styles = StyleSheet.create({
    moduleContainer: { marginBottom: 15, backgroundColor: '#fff', borderRadius: 8, elevation: 2, overflow: 'hidden' },
    moduleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
    moduleTitle: { fontSize: 20, fontFamily: "Raleway_700Bold", flex: 1, color: '#333' },
    itemsWrapper: { borderTopWidth: 1, borderTopColor: '#eee' },
    itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
    itemText: { fontSize: 16, fontFamily: "Nunito_600SemiBold", color: '#555', marginLeft: 10, flexShrink: 1 },
    quizContainer: { marginLeft: 20 },
    assignmentContainer: { borderTopWidth: 1, borderTopColor: '#eee' },
    quizText: { fontFamily: "Nunito_700Bold", color: '#9B59B6' },
    assignmentText: { fontFamily: "Nunito_700Bold", color: '#c35214' },
    disabledItem: { backgroundColor: '#f0f0f0' },
    scoreText: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
});

export default CourseCurriculum;