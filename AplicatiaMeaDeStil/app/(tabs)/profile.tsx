import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, resolveBackendAssetUrl } from '@/constants/config';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

interface Outfit {
  id: number;
  image_url: string;
  style_data: any;
  liked: boolean;
  created_at: string;
}

const getProfileImageUrl = (imageUrl: string) => {
  return resolveBackendAssetUrl(imageUrl, API_BASE_URL);
};

type ProfileOutfitCardProps = {
  item: Outfit;
  onOpen: (id: number) => void;
  onToggleLike: (id: number) => void;
  onDelete: (id: number) => void;
};

type ProfileActionButtonProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: 'neutral' | 'danger';
};

const ProfileActionButton: React.FC<ProfileActionButtonProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  tone = 'neutral',
}) => {
  const isDanger = tone === 'danger';
  return (
    <TouchableOpacity
      style={[
        styles.profileActionButton,
        isDanger ? styles.profileActionDanger : styles.profileActionNeutral,
      ]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.profileActionLeft}>
        <View style={[
          styles.profileActionIconWrap,
          isDanger ? styles.profileActionIconDanger : styles.profileActionIconNeutral,
        ]}>
          <Ionicons
            name={icon}
            size={20}
            color={isDanger ? '#B01824' : '#115740'}
          />
        </View>
        <View style={styles.profileActionTextWrap}>
          <Text style={[styles.profileActionTitle, isDanger && styles.profileActionTitleDanger]}>{title}</Text>
          <Text style={styles.profileActionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={isDanger ? '#B01824' : '#4A5A68'} />
    </TouchableOpacity>
  );
};

const ProfileOutfitCard: React.FC<ProfileOutfitCardProps> = ({ item, onOpen, onToggleLike, onDelete }) => {
  const fullImageUrl = getProfileImageUrl(item.image_url);

  const handleLikePress = (e: any) => {
    e.stopPropagation();
    onToggleLike(item.id);
  };

  const handleDeletePress = (e: any) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  return (
    <TouchableOpacity
      style={styles.outfitCard}
      onPress={() => onOpen(item.id)}
      activeOpacity={0.9}
    >
      {/* CUȘCA PENTRU IMAGINE: Ține imaginea fixă și responsivă */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: fullImageUrl }}
          style={styles.outfitImage}
          resizeMode="cover"
          onError={(error) => {
            console.warn('[ProfileScreen] Image load warning:', fullImageUrl, error.nativeEvent.error);
          }}
        />
        <View style={styles.outfitOverlay}>
          <View style={styles.outfitInfo}>
            {item.style_data?.style && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.style_data.style}</Text>
              </View>
            )}
            {item.style_data?.season && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.style_data.season}</Text>
              </View>
            )}
          </View>
          <View style={styles.outfitActions}>
            <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
              <Ionicons
                name={item.liked ? 'heart' : 'heart-outline'}
                size={24}
                color={item.liked ? '#ff4444' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeletePress} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text style={styles.outfitDate}>
        {new Date(item.created_at).toLocaleDateString('ro-RO')}
      </Text>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token, isAuthenticated, logout } = useAuth();

  const fetchSavedOutfits = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/outfits/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setSavedOutfits(data.outfits);
      } else {
        if (Platform.OS === 'web') globalThis.alert(data.message || 'Nu s-au putut încărca ținutele');
        else Alert.alert('Eroare', data.message || 'Nu s-au putut încărca ținutele');
      }
    } catch (error) {
      if (Platform.OS === 'web') globalThis.alert('Nu s-au putut încărca ținutele');
      else Alert.alert('Eroare', 'Nu s-au putut încărca ținutele');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedOutfits();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchSavedOutfits]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchSavedOutfits();
      }
    }, [isAuthenticated, fetchSavedOutfits])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedOutfits();
  };

  const toggleLike = async (outfitId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/outfits/${outfitId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSavedOutfits(prev =>
          prev.map(outfit =>
            outfit.id === outfitId ? { ...outfit, liked: data.liked } : outfit
          )
        );
      }
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Eroare', 'Nu s-a putut actualiza statusul');
    }
  };

  const executeDeleteOutfit = async (outfitId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/outfits/${outfitId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSavedOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
        if (Platform.OS === 'web') globalThis.alert('Ținută ștearsă cu succes!');
        else Alert.alert('Succes', 'Ținută ștearsă');
      }
    } catch {
      if (Platform.OS === 'web') globalThis.alert('Nu s-a putut șterge ținuta');
      else Alert.alert('Eroare', 'Nu s-a putut șterge ținuta');
    }
  };

  const deleteOutfit = async (outfitId: number) => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Sigur vrei să ștergi această ținută?')) {
        void executeDeleteOutfit(outfitId);
      }
      return;
    }

    Alert.alert('Șterge ținuta', 'Sigur vrei să ștergi această ținută?', [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Șterge',
        style: 'destructive',
        onPress: () => {
          void executeDeleteOutfit(outfitId);
        },
      },
    ]);
  };

  const openOutfit = (outfitId: number) => {
    router.push(`/(tabs)/outfit-detail?id=${outfitId}`);
  };

  const renderOutfitCard = ({ item }: { item: Outfit }) => {
    return (
      <ProfileOutfitCard
        item={item}
        onOpen={openOutfit}
        onToggleLike={toggleLike}
        onDelete={deleteOutfit}
      />
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      if (Platform.OS === 'web') globalThis.alert('Nu s-a putut deconecta.');
      else Alert.alert('Eroare', 'Nu s-a putut deconecta. Încearcă din nou.');
    }
  };

  const renderOutfitsSectionContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#115740" />
          <Text style={styles.loadingText}>Se încarcă...</Text>
        </View>
      );
    }

    if (savedOutfits.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Nicio ținută salvată</Text>
          <Text style={styles.emptySubtitle}>
            Generează și salvează ținute pentru a le vedea aici
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={savedOutfits}
        renderItem={renderOutfitCard}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.outfitsList}
      />
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="person-circle-outline" size={100} color="#ccc" />
          <Text style={styles.emptyTitle}>Nu ești autentificat</Text>
          <Text style={styles.emptySubtitle}>
            Autentifică-te pentru a-ți vedea profilul și ținutele salvate
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Autentificare</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    // AM INLOCUIT ThemedView cu SafeAreaView PENTRU A REZOLVA PROBLEMA CU CAMERA / NOTCH-UL
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.profileHeader, { backgroundColor: Colors.light.card }]}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color={Colors.light.primary} />
          </View>
          <ThemedText type="gucciTitle" style={styles.userEmail}>{user?.email}</ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{savedOutfits.length}</Text>
              <Text style={styles.statLabel}>Ținute</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {savedOutfits.filter(o => o.liked).length}
              </Text>
              <Text style={styles.statLabel}>Favorite</Text>
            </View>
          </View>
          <View style={styles.profileActionsContainer}>
            <ProfileActionButton
              title="Detalii cont"
              subtitle="Email, statistici si preferinte"
              icon="settings-outline"
              onPress={() => setSettingsModalVisible(true)}
              tone="neutral"
            />
            <ProfileActionButton
              title="Deconectare"
              subtitle="Iesi din contul curent"
              icon="log-out-outline"
              onPress={handleLogout}
              tone="danger"
            />
          </View>
        </View>
        <Modal
          isVisible={isSettingsModalVisible}
          onBackdropPress={() => setSettingsModalVisible(false)}
          onBackButtonPress={() => setSettingsModalVisible(false)}
        >
          <View style={styles.settingsModalCard}>
            <Text style={styles.settingsModalTitle}>Contul tău</Text>
            <Text style={styles.settingsModalText}>Email: {user?.email ?? '-'}</Text>
            <Text style={styles.settingsModalText}>Ținute salvate: {savedOutfits.length}</Text>
            <Text style={styles.settingsModalText}>Favorite: {savedOutfits.filter(o => o.liked).length}</Text>
            <TouchableOpacity style={styles.settingsModalButton} onPress={() => setSettingsModalVisible(false)}>
              <Text style={styles.settingsModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <View style={styles.outfitsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Ținutele mele salvate</ThemedText>
          {renderOutfitsSectionContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileActionsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  profileActionButton: {
    minHeight: 64,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  profileActionNeutral: {
    backgroundColor: '#F8F4E8',
    borderColor: '#CDBA8A',
  },
  profileActionDanger: {
    backgroundColor: '#FFF1F2',
    borderColor: '#E9A2A9',
  },
  profileActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  profileActionIconNeutral: {
    backgroundColor: '#E8EFEA',
  },
  profileActionIconDanger: {
    backgroundColor: '#FFE3E6',
  },
  profileActionTextWrap: {
    flex: 1,
  },
  profileActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#213547',
  },
  profileActionTitleDanger: {
    color: '#B01824',
  },
  profileActionSubtitle: {
    fontSize: 12,
    color: '#4A5A68',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  outfitsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  outfitsList: {
    gap: 12,
  },
  outfitCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  outfitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 10,
  },
  outfitInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  outfitActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
  },
  outfitDate: {
    padding: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  settingsModalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#115740',
    marginBottom: 10,
  },
  settingsModalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  settingsModalButton: {
    backgroundColor: '#115740',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  settingsModalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});