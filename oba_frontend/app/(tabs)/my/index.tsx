import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/auth/AuthContext";
import { apiClient } from "../../../src/api/apiClient";
import { COLORS, RADIUS, SHADOWS, TYPO, SPACING } from "../../../constants/theme";
import { extractApiData } from "../../../src/utils/learningStats";

type UserProfile = {
  nickname: string;
  email: string;
  profileImage: any;
};

const FEEDBACK_STORAGE_KEY = "oba_feedback_draft";
const LOCAL_PROFILE_PICTURE_KEY = "oba_local_profile_picture";

export default function MyPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isLoading: authLoading, logout } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);

  const MAX_LENGTH = 700;

  const fetchAllData = useCallback(async () => {
    if (authLoading) return;

    try {
      if (isLoggedIn) {
        const res = await apiClient.get("/api/users/me");
        const data = extractApiData<any>(res.data);

        const localPicture = await AsyncStorage.getItem(LOCAL_PROFILE_PICTURE_KEY);

        const profile = {
          nickname: data.nickname || data.displayName || data.name || "User",
          email: data.email || "",
          profileImage: localPicture
            ? { uri: localPicture }
            : data.picture
            ? { uri: data.picture }
            : require("../../../assets/knight/basic_profile.png"),
        };

        setUserProfile(profile);

        try {
          await AsyncStorage.setItem(
            "oba_cached_profile",
            JSON.stringify({
              nickname: profile.nickname,
              email: profile.email,
              picture: localPicture || data.picture || "",
            })
          );
        } catch {}
      } else {
        setUserProfile({
          nickname: "Guest",
          email: "Login required",
          profileImage: require("../../../assets/knight/basic_profile.png"),
        });
      }
    } catch {
      try {
        const cached = await AsyncStorage.getItem("oba_cached_profile");
        const localPicture = await AsyncStorage.getItem(LOCAL_PROFILE_PICTURE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setUserProfile({
            nickname: parsed.nickname,
            email: parsed.email,
            profileImage: localPicture
              ? { uri: localPicture }
              : parsed.picture
              ? { uri: parsed.picture }
              : require("../../../assets/knight/basic_profile.png"),
          });
        } else {
          setUserProfile({
            nickname: "User",
            email: "",
            profileImage: require("../../../assets/knight/basic_profile.png"),
          });
        }
      } catch {
        setUserProfile({
          nickname: "User",
          email: "",
          profileImage: require("../../../assets/knight/basic_profile.png"),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, authLoading]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const saveFeedbackDraft = async (text: string) => {
    try {
      await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, text);
    } catch {}
  };

  const loadFeedbackDraft = async (): Promise<string> => {
    try {
      return (await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY)) || "";
    } catch {
      return "";
    }
  };

  const deleteFeedbackDraft = async () => {
    try {
      await AsyncStorage.removeItem(FEEDBACK_STORAGE_KEY);
    } catch {}
  };

  useEffect(() => {
    if (feedbackModalVisible) {
      setIsLoadingFeedback(true);
      loadFeedbackDraft().then((s) => {
        setFeedbackText(s);
        setIsLoadingFeedback(false);
      });
    }
  }, [feedbackModalVisible]);

  const handleFeedbackModalClose = () => {
    if (feedbackText.trim() !== "") {
      saveFeedbackDraft(feedbackText);
    } else {
      deleteFeedbackDraft();
    }
    setFeedbackModalVisible(false);
  };

  const openEditModal = () => {
    if (!userProfile) return;
    setInputText(userProfile.nickname);
    setModalVisible(true);
  };

  const handleSaveNickname = async () => {
    if (inputText.trim() === "") {
      Alert.alert("\uC54C\uB9BC", "\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }

    try {
      await apiClient.put("/api/users/nickname", { nickname: inputText.trim() });
      setUserProfile((p) => (p ? { ...p, nickname: inputText.trim() } : null));

      try {
        const cached = await AsyncStorage.getItem("oba_cached_profile");
        const current = cached ? JSON.parse(cached) : {};
        await AsyncStorage.setItem(
          "oba_cached_profile",
          JSON.stringify({ ...current, nickname: inputText.trim() })
        );
      } catch {}

      setModalVisible(false);
    } catch {
      Alert.alert("\uC624\uB958", "\uB2C9\uB124\uC784 \uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    }
  };

  const handlePickProfileImage = async () => {
    if (!isLoggedIn) {
      Alert.alert("\uC54C\uB9BC", "\uB85C\uADF8\uC778 \uD6C4 \uD504\uB85C\uD544 \uC0AC\uC9C4\uC744 \uBCC0\uACBD\uD560 \uC218 \uC788\uC5B4\uC694.");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("\uAD8C\uD55C \uD544\uC694", "\uC568\uBC94 \uC811\uADFC \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const selectedUri = result.assets[0].uri;

      setUserProfile((prev) => (prev ? { ...prev, profileImage: { uri: selectedUri } } : prev));
      await AsyncStorage.setItem(LOCAL_PROFILE_PICTURE_KEY, selectedUri);

      try {
        const cached = await AsyncStorage.getItem("oba_cached_profile");
        const current = cached ? JSON.parse(cached) : {};
        await AsyncStorage.setItem(
          "oba_cached_profile",
          JSON.stringify({ ...current, picture: selectedUri })
        );
      } catch {}
    } catch {
      Alert.alert("\uC624\uB958", "\uD504\uB85C\uD544 \uC0AC\uC9C4 \uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    }
  };

  const handleResetProfileImage = async () => {
    try {
      await AsyncStorage.removeItem(LOCAL_PROFILE_PICTURE_KEY);

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              profileImage: require("../../../assets/knight/basic_profile.png"),
            }
          : prev
      );

      try {
        const cached = await AsyncStorage.getItem("oba_cached_profile");
        const current = cached ? JSON.parse(cached) : {};
        await AsyncStorage.setItem("oba_cached_profile", JSON.stringify({ ...current, picture: "" }));
      } catch {}
    } catch {
      Alert.alert("오류", "기본 사진으로 되돌리는 중 오류가 발생했습니다.");
    }
  };

  const showThankYouToast = () => {
    setToastVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, 2000);
  };

  const handleSubmitFeedback = async () => {
    if (feedbackText.trim() === "") {
      Alert.alert("\uC54C\uB9BC", "\uD53C\uB4DC\uBC31 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      await apiClient.post("/api/feedback", { content: feedbackText });
      await deleteFeedbackDraft();
      setFeedbackModalVisible(false);
      setFeedbackText("");
      showThankYouToast();
    } catch {
      Alert.alert("\uC624\uB958", "\uD53C\uB4DC\uBC31 \uC804\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?")) {
        logout().then(() => router.replace("/(auth)/login"));
      }
      return;
    }

    Alert.alert("\uB85C\uADF8\uC544\uC6C3", "\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?", [
      { text: "\uCDE8\uC18C", style: "cancel" },
      {
        text: "\uB85C\uADF8\uC544\uC6C3",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>{"\uD504\uB85C\uD544\uC744 \uBD88\uB7EC\uC624\uB294 \uC911..."}</Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {userProfile && (
          <View style={[s.headerSection, { paddingTop: insets.top }]}>
            <View style={s.navBar}>
              <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={s.navTitle}>{"\uB9C8\uC774\uD398\uC774\uC9C0"}</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={s.profileCard}>
              <TouchableOpacity style={s.profileLeft} activeOpacity={0.8} onPress={handlePickProfileImage}>
                <Image source={userProfile.profileImage} style={s.profileImage} />
                <View style={s.cameraBadge}>
                  <Ionicons name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={s.profileRight}>
                <TouchableOpacity style={s.nameRow} activeOpacity={0.8} onPress={openEditModal}>
                  <Text style={s.userName}>{userProfile.nickname}</Text>
                  <Ionicons name="pencil" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
                <Text style={s.userEmail}>{userProfile.email}</Text>
                <Text style={s.profileHint}>{"\uD504\uB85C\uD544 \uC0AC\uC9C4\uC744 \uB204\uB974\uBA74 \uBCC0\uACBD\uD560 \uC218 \uC788\uC5B4\uC694"}</Text>
                <TouchableOpacity onPress={handleResetProfileImage} activeOpacity={0.8} style={s.resetPhotoBtn}>
                  <Ionicons name="refresh" size={13} color={COLORS.primaryLight} />
                  <Text style={s.resetPhotoText}>기본 사진으로 되돌리기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={[s.section, s.firstSection]}>
          <Text style={s.sectionTitle}>{"\uBB38\uC758\uD558\uAE30 \uBC0F \uD53C\uB4DC\uBC31"}</Text>
          <Text style={s.sectionDesc}>{"\uC11C\uBE44\uC2A4 \uAC1C\uC120\uC744 \uC704\uD574 \uC758\uACAC\uC744 \uBCF4\uB0B4\uC8FC\uC138\uC694."}</Text>
          <TouchableOpacity style={s.menuButton} activeOpacity={0.8} onPress={() => setFeedbackModalVisible(true)}>
            <View style={s.menuIcon}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primaryLight} />
            </View>
            <Text style={s.menuText}>{"\uD53C\uB4DC\uBC31 \uBCF4\uB0B4\uAE30"}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textPlaceholder} />
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          {isLoggedIn ? (
            <TouchableOpacity style={s.menuButton} activeOpacity={0.8} onPress={handleLogout}>
              <View style={[s.menuIcon, { backgroundColor: COLORS.errorSurface }]}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              </View>
              <Text style={[s.menuText, { color: COLORS.errorLight }]}>{"\uB85C\uADF8\uC544\uC6C3"}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPlaceholder} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.menuButton} activeOpacity={0.8} onPress={() => router.push("/(auth)/login")}>
              <View style={s.menuIcon}>
                <Ionicons name="log-in-outline" size={20} color={COLORS.primaryLight} />
              </View>
              <Text style={[s.menuText, { color: COLORS.primaryLight }]}>{"\uB85C\uADF8\uC778"}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPlaceholder} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{"\uB2C9\uB124\uC784 \uBCC0\uACBD"}</Text>
            <TextInput
              style={s.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="\uC0C8 \uB2C9\uB124\uC784\uC744 \uC785\uB825\uD558\uC138\uC694"
              placeholderTextColor={COLORS.textPlaceholder}
              autoFocus
            />
            <View style={s.modalButtons}>
              <TouchableOpacity style={[s.modalBtn, s.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelText}>{"\uCDE8\uC18C"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.saveBtn]} onPress={handleSaveNickname}>
                <Text style={s.saveText}>{"\uC800\uC7A5"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={feedbackModalVisible} onRequestClose={handleFeedbackModalClose}>
        <View style={s.modalOverlay}>
          <View style={s.feedbackModal}>
            <View style={s.feedbackHeader}>
              <Text style={s.feedbackTitle}>{"\uD53C\uB4DC\uBC31 \uBCF4\uB0B4\uAE30"}</Text>
              <TouchableOpacity onPress={handleFeedbackModalClose} disabled={isSubmittingFeedback}>
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={s.feedbackDesc}>{"불편했던 점이나 개선 아이디어를 알려주세요.\n여러분의 의견이 서비스 개선에 큰 도움이 됩니다."}</Text>

            {isLoadingFeedback ? (
              <View style={s.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <TextInput
                style={s.feedbackInput}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="이곳에 입력해주세요."
                placeholderTextColor={COLORS.textPlaceholder}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                editable={!isSubmittingFeedback && !isLoadingFeedback}
                maxLength={MAX_LENGTH}
              />
            )}

            <View style={s.charCountContainer}>
              <Text style={[s.charCount, feedbackText.length >= MAX_LENGTH && { color: COLORS.error }]}> 
                {feedbackText.length} / {MAX_LENGTH}
              </Text>
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity style={[s.modalBtn, s.cancelBtn]} onPress={handleFeedbackModalClose} disabled={isSubmittingFeedback}>
                <Text style={s.cancelText}>{"\uCDE8\uC18C"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.saveBtn, (isSubmittingFeedback || feedbackText.trim() === "") && { opacity: 0.5 }]}
                onPress={handleSubmitFeedback}
                disabled={isSubmittingFeedback || feedbackText.trim() === ""}
              >
                {isSubmittingFeedback ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveText}>{"\uBCF4\uB0B4\uAE30"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toastVisible && (
        <Animated.View style={[s.toastContainer, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} style={{ marginRight: 8 }} />
          <Text style={s.toastText}>{"\uC18C\uC911\uD55C \uC758\uACAC\uC774 \uC804\uB2EC\uB418\uC5C8\uC5B4\uC694!"}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: SPACING.md, ...TYPO.bodySm, color: COLORS.textTertiary },

  headerSection: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  navTitle: { ...TYPO.h3, color: COLORS.textPrimary },
  backButton: { padding: 4, marginLeft: -4 },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCardElevated,
    padding: SPACING.xxl,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.md,
  },
  profileLeft: { marginRight: SPACING.xl, position: "relative" },
  profileImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 2,
    borderColor: COLORS.primary + "50",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  profileRight: { flex: 1, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  userName: { ...TYPO.h2, color: COLORS.textPrimary, marginRight: 6 },
  userEmail: { ...TYPO.bodySm, color: COLORS.textTertiary },
  profileHint: { ...TYPO.caption, color: COLORS.textPlaceholder, marginTop: 6 },
  resetPhotoBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  resetPhotoText: { ...TYPO.caption, color: COLORS.primaryLight, marginLeft: 4, fontWeight: "700" },

  section: { marginTop: SPACING.xxxl, marginHorizontal: SPACING.xl },
  firstSection: { marginTop: SPACING.lg },
  sectionTitle: { ...TYPO.h3, color: COLORS.textPrimary, marginBottom: 4 },
  sectionDesc: { ...TYPO.bodySm, color: COLORS.textTertiary, marginBottom: SPACING.lg },

  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCardElevated,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.sm,
  },
  menuIcon: {
    marginRight: SPACING.md,
    padding: 6,
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADIUS.sm,
  },
  menuText: { ...TYPO.label, color: COLORS.textPrimary, flex: 1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.card,
    padding: SPACING.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.lg,
  },
  modalTitle: { ...TYPO.h3, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...TYPO.body,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
  },
  modalButtons: { flexDirection: "row", width: "100%", gap: SPACING.md },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.button,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder },
  saveBtn: { backgroundColor: COLORS.primary, ...SHADOWS.glow },
  cancelText: { ...TYPO.button, color: COLORS.textSecondary },
  saveText: { ...TYPO.button, color: "#FFFFFF" },

  feedbackModal: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    paddingBottom: 28,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.lg,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  feedbackTitle: { ...TYPO.h1, color: COLORS.textPrimary },
  feedbackDesc: {
    ...TYPO.bodySm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  feedbackInput: {
    width: "100%",
    minHeight: 180,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...TYPO.body,
    backgroundColor: COLORS.bgPrimary,
    color: COLORS.textPrimary,
    textAlignVertical: "top",
  },
  charCountContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: SPACING.xxl,
    paddingHorizontal: 2,
  },
  charCount: { ...TYPO.caption, color: COLORS.textTertiary },

  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.bgCardElevated,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.lg,
  },
  toastText: { color: COLORS.textPrimary, ...TYPO.label },
});



