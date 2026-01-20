import * as React from 'react';
import { Image } from 'expo-image';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobSide]} />
        <View style={[styles.blob, styles.blobBottom]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.overline}>User</Text>
        <Text style={styles.title}>Your Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Image source={require('@/assets/images/icon.png')} style={styles.avatar} />
        </View>
        <Text style={styles.name}>Sunny</Text>
        <Text style={styles.nicknameLabel}>Nickname</Text>
        <View style={styles.nicknamePill}>
          <Text style={styles.nicknameText}>Sunny</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Feather name="map-pin" size={18} color="#1F2937" />
          <Text style={styles.infoValue}>Shanghai</Text>
          <Text style={styles.infoLabel}>City</Text>
        </View>
        <View style={styles.infoCard}>
          <Feather name="heart" size={18} color="#1F2937" />
          <Text style={styles.infoValue}>Cat friendly</Text>
          <Text style={styles.infoLabel}>Preference</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF7F0',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.65,
  },
  blobTop: {
    top: -80,
    left: -40,
    backgroundColor: '#FCE7CF',
  },
  blobSide: {
    top: 80,
    right: -60,
    backgroundColor: '#DFF3E5',
  },
  blobBottom: {
    bottom: -70,
    left: '30%',
    backgroundColor: '#D9EEF7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  overline: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  profileCard: {
    marginTop: 8,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE3D6',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F7EFE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EADBC8',
  },
  avatar: {
    width: 68,
    height: 68,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  nicknameLabel: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  nicknamePill: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#CDE8D9',
  },
  nicknameText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginHorizontal: 20,
  },
  infoCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFE3D6',
    alignItems: 'flex-start',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  infoValue: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
});
