// In: components/courses/LessonNavigation.tsx

import React, { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    prevLessonId: string | null;
    nextLessonId: string | null;
    onNavigate: (lessonId: string) => void;
};

const LessonNavigation: FC<Props> = ({ prevLessonId, nextLessonId, onNavigate }) => {
    return (
        <View style={styles.navButtonContainer}>
            <TouchableOpacity
                style={[styles.navButton, !prevLessonId && styles.disabledButton]}
                disabled={!prevLessonId}
                onPress={() => prevLessonId && onNavigate(prevLessonId)}
            >
                <Ionicons name="chevron-back" size={24} color="white" />
                <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.navButton, !nextLessonId && styles.disabledButton]}
                disabled={!nextLessonId}
                onPress={() => nextLessonId && onNavigate(nextLessonId)}
            >
                <Text style={styles.navButtonText}>Next</Text>
                <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    navButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 10 },
    navButton: { flexDirection: 'row', backgroundColor: '#2467EC', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
    navButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginHorizontal: 5 },
    disabledButton: { backgroundColor: '#A9A9A9' },
});

export default LessonNavigation;