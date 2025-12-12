import { View, Image, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import Swiper from "react-native-swiper";
import { useEffect, useState } from "react";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
// NEW: Import the service function
import { getBanners } from "@/services/layout.service";

type BannerImageType = { _id: string; url: string; width: number; height: number; };
const screenWidth = Dimensions.get('window').width;

export default function HomeBannerSlider() {
  const [bannerImages, setBannerImages] = useState<BannerImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderHeight, setSliderHeight] = useState(200);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      const images = await getBanners(); // Use the service function
      if (images && images.length > 0) {
        setBannerImages(images);
        const firstImage = images[0];
        const imageAspectRatio = firstImage.height / firstImage.width;
        setSliderHeight((screenWidth - 32) * imageAspectRatio);
      }
      setLoading(false);
    };
    fetchBanners();
  }, []);

  const onIndexChanged = (index: number) => {
      if (bannerImages[index]) {
          const currentImage = bannerImages[index];
          const imageAspectRatio = currentImage.height / currentImage.width;
          setSliderHeight((screenWidth - 32) * imageAspectRatio);
      }
  };

  if (loading) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#2467EC"/>
          </View>
      );
  }
  
  if (bannerImages.length === 0) {
      return null;
  }

 return (
    <View style={[styles.container, { height: sliderHeight }]}>
      <Swiper /* ... (Swiper props remain the same) */ >
        {bannerImages.map((item) => (
          <View key={item._id} style={styles.slide}><Image source={{ uri: item.url }} style={styles.image} /></View>
        ))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        height: hp("25%"),
        marginHorizontal: 16,
    },
    slide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    dot: {
        backgroundColor: "#C6C7CC",
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: "#2467EC",
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 3,
    },
});