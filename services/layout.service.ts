import axiosInstance from "@/utils/axios.instance";

type CategoryType = {
  _id: string;
  title: string;
};

type BannerImageType = {
    _id: string;
    url: string;
    width: number;
    height: number;
}

/**
 * Fetches the list of categories from the layout.
 */
export const getCategories = async (): Promise<CategoryType[]> => {
    try {
        const response = await axiosInstance.get('/get-layout/Categories');
        return response.data.layout?.categories || [];
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
};

/**
 * Fetches the list of banner images for the home screen slider.
 */
export const getBanners = async (): Promise<BannerImageType[]> => {
    try {
        const response = await axiosInstance.get('/get-banners');
        return response.data.bannerImages || [];
    } catch (error) {
        console.error("Failed to fetch banner images:", error);
        return [];
    }
};