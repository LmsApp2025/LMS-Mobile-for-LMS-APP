// In: components/courses/LessonContent.tsx (FINAL CORRECTED VERSION)

import React, { FC, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Toast } from 'react-native-toast-notifications'; // FIXED: Correct import for mobile toasts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/utils/axios.instance';
import { SERVER_URI } from '@/utils/uri';
import useGetSubmission from '@/hooks/submissions/useGetSubmission';
import Loader from '@/components/loader/loader';

type Props = {
    lesson: LessonType;
    course: CoursesType;
};

const LessonContent: FC<Props> = ({ lesson, course }) => {
    const assignment = lesson?.assignment;
    const { submission, loading: submissionLoading, doRefetch } = useGetSubmission(assignment?.assignmentId!);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionLink, setSubmissionLink] = useState("");

    const handleDownload = async (resource: any) => {
        const currentModule = course.modules.find(m => m.lessons.some(l => l._id === lesson._id));
        if (!currentModule) { Toast.show("Module for this resource not found.", { type: "danger" }); return; }
        try {
            const refreshToken = await AsyncStorage.getItem("refresh_token");
            if (!refreshToken) { Toast.show("Please log in to download resources.", { type: "warning" }); return; }
            const downloadUrl = `${SERVER_URI}/resource/${course._id}/${currentModule._id}/${lesson._id}/${resource._id}?token=${refreshToken}`;
            await Linking.openURL(downloadUrl);
        } catch (error) { Toast.show("Could not open download link.", { type: "danger" }); }
    };

    const handleAssignmentSubmit = async () => {
        if (!assignment || submissionLink.trim() === "") return;
        setIsSubmitting(true);
        const submissionData = { courseId: course?._id, assignmentId: assignment.assignmentId, content: { format: "link", url: submissionLink } };
        try {
            await axiosInstance.post(`/submit-assignment`, submissionData);
            Toast.show("Assignment submitted successfully!", { type: "success" }); // FIXED: Use capital 'T' Toast
            setSubmissionLink("");
            doRefetch();
        } catch (error: any) {
            Toast.show(error.response?.data?.message || "An error occurred", { type: "danger" }); // FIXED: Use capital 'T' Toast
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <View style={{paddingHorizontal: 15}}>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            {lesson.resources?.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resources</Text>
                    {lesson.resources.map((res, index) => (
                        <TouchableOpacity key={index} style={styles.resourceItem} onPress={() => handleDownload(res)}>
                            <FontAwesome name="file-pdf-o" size={20} color="#2467EC" />
                            <Text style={styles.resourceTitle}>{res.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {assignment && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Assignment</Text>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <Text style={styles.assignmentDescription}>{assignment.description}</Text>
                    {submissionLoading ? <Loader /> : (
                        <>
                            <TextInput style={[styles.submissionInput, submission && styles.disabledInput]} placeholder="https://github.com/your-repo" value={submissionLink} onChangeText={setSubmissionLink} editable={!submission} />
                            <TouchableOpacity style={[styles.button, (isSubmitting || submission) && styles.disabledButton]} disabled={isSubmitting || !!submission} onPress={handleAssignmentSubmit}>
                                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{submission ? 'Submitted' : 'Submit'}</Text>}
                            </TouchableOpacity>
                            {submission && (
                                <View style={styles.resultsContainer}>
                                    <Text style={styles.resultsTitle}>Your Submission Status</Text>
                                    <Text style={styles.statusText}>Status: <Text style={{fontWeight: 'bold', textTransform: 'capitalize'}}>{submission.status}</Text></Text>
                                    {submission.grade && <Text style={styles.statusText}>Grade: {submission.grade}</Text>}
                                    {submission.feedback && <Text style={styles.statusText}>Feedback: {submission.feedback}</Text>}
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

// FIXED: Added the full, necessary StyleSheet object
const styles = StyleSheet.create({
    lessonTitle: { fontSize: 22, fontWeight: "bold", paddingVertical: 15, fontFamily: 'Raleway_700Bold', color: '#333' },
    section: { marginTop: 10, padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, elevation: 2 },
    sectionTitle: { fontSize: 20, fontFamily: 'Raleway_600SemiBold', marginBottom: 10, color: '#333' },
    resourceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    resourceTitle: { marginLeft: 10, fontSize: 16, color: '#2467EC', fontFamily: 'Nunito_400Regular' },
    assignmentTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', marginBottom: 5, color: '#333' },
    assignmentDescription: { fontSize: 16, color: '#555', marginBottom: 15, fontFamily: 'Nunito_400Regular', lineHeight: 22 },
    button: { height: 45, backgroundColor: "#2467EC", borderRadius: 8, alignItems: "center", justifyContent: "center" },
    disabledButton: { backgroundColor: '#A9A9A9' },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
    submissionInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15 },
    disabledInput: { backgroundColor: '#f0f0f0', color: '#888' },
    resultsContainer: { marginTop: 20, padding: 15, backgroundColor: '#E5ECF9', borderRadius: 8 },
    resultsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    statusText: { fontSize: 16, marginVertical: 4, textTransform: 'capitalize' }
});

export default LessonContent;