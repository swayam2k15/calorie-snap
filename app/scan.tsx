import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';
import { setPendingImageUrl } from '@/lib/scanState';
import { COLORS } from '@/lib/constants';

export default function ScanScreen() {
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    const granted = await requestPermission(source);
    if (!granted) {
      Alert.alert(
        'Permission required',
        `Please allow ${source === 'camera' ? 'camera' : 'photo library'} access in Settings.`,
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
    }
  };

  const uploadAndNavigate = async () => {
    if (!selectedUri) return;
    setUploading(true);
    try {
      const deviceId = await getDeviceId();
      const fileName = `${deviceId}/${Date.now()}.jpg`;

      let uploadResult;

      if (Platform.OS === 'web') {
        // On web, selectedUri is a blob URL — fetch it directly
        const response = await fetch(selectedUri);
        const blob = await response.blob();
        uploadResult = await supabase.storage
          .from('meal-images')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
      } else {
        // On native, read via FileSystem then convert to binary
        const base64 = await FileSystem.readAsStringAsync(selectedUri, {
          encoding: 'base64' as const,
        });
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        uploadResult = await supabase.storage
          .from('meal-images')
          .upload(fileName, bytes.buffer, { contentType: 'image/jpeg', upsert: false });
      }

      const { data: uploadData, error: uploadError } = uploadResult;
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(uploadData.path);

      setPendingImageUrl(urlData.publicUrl);
      router.push('/result');
    } catch (err: any) {
      Alert.alert(
        'Upload failed',
        err.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={18}
            tintColor={COLORS.text}
          />
        </Pressable>
        <Text style={styles.title}>Snap Your Meal</Text>
        <View style={{ width: 40 }} />
      </View>

      {selectedUri ? (
        /* Preview */
        <View style={styles.preview}>
          <Image
            source={{ uri: selectedUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.previewActions}>
            <Pressable
              style={styles.retakeBtn}
              onPress={() => setSelectedUri(null)}
              disabled={uploading}
            >
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable
              style={[styles.analyzeBtn, uploading && styles.analyzeBtnDisabled]}
              onPress={uploadAndNavigate}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <SymbolView
                  name={{
                    ios: 'sparkles',
                    android: 'auto_awesome',
                    web: 'auto_awesome',
                  }}
                  size={20}
                  tintColor="#fff"
                />
              )}
              <Text style={styles.analyzeText}>
                {uploading ? 'Uploading...' : 'Analyze Calories'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Picker */
        <View style={styles.picker}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationEmoji}>🍽️</Text>
            <Text style={styles.illustrationTitle}>How do you want to add?</Text>
            <Text style={styles.illustrationSubtitle}>
              Take a photo or choose from your gallery
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
            ]}
            onPress={() => pickImage('camera')}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#f0fdf4' }]}>
              <SymbolView
                name={{
                  ios: 'camera.fill',
                  android: 'photo_camera',
                  web: 'camera',
                }}
                size={30}
                tintColor={COLORS.primary}
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Take a Photo</Text>
              <Text style={styles.optionSubtitle}>Use your camera</Text>
            </View>
            <SymbolView
              name={{
                ios: 'chevron.right',
                android: 'chevron_right',
                web: 'chevron_right',
              }}
              size={18}
              tintColor={COLORS.textMuted}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
            ]}
            onPress={() => pickImage('gallery')}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#eff6ff' }]}>
              <SymbolView
                name={{
                  ios: 'photo.on.rectangle',
                  android: 'photo_library',
                  web: 'photo_library',
                }}
                size={30}
                tintColor="#3b82f6"
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Choose from Gallery</Text>
              <Text style={styles.optionSubtitle}>Pick an existing photo</Text>
            </View>
            <SymbolView
              name={{
                ios: 'chevron.right',
                android: 'chevron_right',
                web: 'chevron_right',
              }}
              size={18}
              tintColor={COLORS.textMuted}
            />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  // Picker
  picker: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  illustration: { alignItems: 'center', paddingVertical: 28 },
  illustrationEmoji: { fontSize: 72, marginBottom: 16 },
  illustrationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  illustrationSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardPressed: { opacity: 0.8 },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionSubtitle: { fontSize: 13, color: COLORS.textMuted },
  // Preview
  preview: { flex: 1 },
  previewImage: {
    flex: 1,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  retakeText: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
  analyzeBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeBtnDisabled: { opacity: 0.7 },
  analyzeText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
