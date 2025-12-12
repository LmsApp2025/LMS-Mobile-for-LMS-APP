import axiosInstance from "@/utils/axios.instance";

export const getAllCourses = async (): Promise<CoursesType[]> => {
    try {
        const response = await axiosInstance.get('/get-courses');
        return response.data.courses || [];
    } catch (error) {
        console.error("Failed to fetch all courses:", error);
        return []; // Return an empty array on error
    }
};

/**
 * Fetches the detailed content of a single course.
 * @param courseId The ID of the course to fetch.
 */
export const getCourseDetails = async (courseId: string): Promise<CoursesType | null> => {
    try {
        const response = await axiosInstance.get(`/get-course/${courseId}`);
        return response.data.course;
    } catch (error) {
        console.error(`Failed to fetch course details for ${courseId}:`, error);
        return null;
    }
};

/**
 * Fetches the protected content (modules, lessons) for an enrolled user.
 * @param courseId The ID of the course content to fetch.
 */
export const getCourseContent = async (courseId: string): Promise<ModuleType[]> => {
    try {
        const response = await axiosInstance.get(`/get-course-content/${courseId}`);
        return response.data.content || [];
    } catch (error) {
        console.error(`Failed to fetch course content for ${courseId}:`, error);
        return [];
    }
};