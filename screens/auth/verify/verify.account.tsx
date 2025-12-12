import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "@/utils/axios.instance";
import { Toast } from "react-native-toast-notifications";
import { refreshUserSession } from "@/hooks/auth/useUser";

export default function VerifyAccountScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [code, setCode] = useState(new Array(4).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleInput = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 3) { inputs.current[index + 1]?.focus(); }
    if (text === "" && index > 0) { inputs.current[index - 1]?.focus(); }
  };

  const handleVerify = async () => {
    const otp = code.join("");
    if (otp.length !== 4) { Toast.show("Please enter the 4-digit code.", { type: "danger" }); return; }
    
    setIsLoading(true);
    try {
      const res = await axiosInstance.post(`/student-verify-otp`, { userId, otp });

      await AsyncStorage.setItem("access_token", res.data.accessToken);
      await AsyncStorage.setItem("refresh_token", res.data.refreshToken);

       // Step 2: Manually trigger a refresh of the user session globally.
      // The useUser hook will now refetch the user data with the new tokens.
      refreshUserSession();

      Toast.show("Login Successful!", { type: "success" });
      router.replace("/(tabs)");
      
    } catch (error: any) {
      Toast.show(error.response?.data?.message || "Verification failed!", { type: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Verify Your Login</Text>
      <Text style={styles.subText}>We have sent a verification code to your registered email address.</Text>
      <View style={styles.inputContainer}>
        {code.map((_, index) => (
          <TextInput
            key={index}
            style={styles.inputBox}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleInput(text, index)}
            value={code[index]}
            // FIXED: The callback function now correctly assigns the ref without returning a value.
            ref={(ref) => { inputs.current[index] = ref; }}
            autoFocus={index === 0}
          />
        ))}
      </View>
      <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleVerify} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
      <View style={styles.loginLink}><Text style={styles.backText}>Entered wrong credentials?</Text><TouchableOpacity onPress={() => router.back()}><Text style={styles.loginText}>Go Back</Text></TouchableOpacity></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "#F6F7F9" },
  headerText: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subText: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  inputContainer: { flexDirection: "row", marginBottom: 20 },
  inputBox: { width: 60, height: 60, borderWidth: 1, borderColor: "#ddd", textAlign: "center", marginRight: 10, borderRadius: 10, fontSize: 20, backgroundColor: '#fff' },
  button: { backgroundColor: "#2467EC", width: '100%', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginTop: 20 },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loginLink: { flexDirection: "row", marginTop: 30 },
  loginText: { color: "#2467EC", marginLeft: 5, fontSize: 16, fontWeight: 'bold' },
  backText: { fontSize: 16 },
});