import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/config';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Colors } from '@/constants/theme';

interface Outfit {
  id: number;
  image_url: string;
  style_data: any;
  liked: boolean;
  created_at: string;
}

export default function ProfileScreen() {
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token, isAuthenticated, logout } = useAuth();

  const fetchSavedOutfits = async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      console.log('[ProfileScreen] Fetching outfits from:', `${API_BASE_URL}/outfits/history`);
      const response = await fetch(`${API_BASE_URL}/outfits/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[ProfileScreen] Response:', data);
      
      if (data.status === 'success') {
        console.log('[ProfileScreen] Number of outfits:', data.outfits.length);
        if (data.outfits.length > 0) {
          console.log('[ProfileScreen] First outfit:', data.outfits[0]);
          console.log('[ProfileScreen] First outfit image_url:', data.outfits[0].image_url);
        }
        setSavedOutfits(data.outfits);
      } else {
        Alert.alert('Eroare', data.message || 'Nu s-au putut încărca ținutele');
      }
    } catch (error) {
      console.error('[ProfileScreen] Fetch outfits error:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca ținutele');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedOutfits();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-a putut actualiza statusul');
    }
  };

  const deleteOutfit = async (outfitId: number) => {
    Alert.alert('Șterge ținuta', 'Sigur vrei să ștergi această ținută?', [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Șterge',
        style: 'destructive',
        onPress: async () => {
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
              Alert.alert('Succes', 'Ținută ștearsă');
            }
          } catch (error) {
            Alert.alert('Eroare', 'Nu s-a putut șterge ținuta');
          }
        },
      },
    ]);
  };

  const renderOutfitCard = ({ item }: { item: Outfit }) => {
    // Handle image URL - if it already contains http, use as is, otherwise prepend API_BASE_URL
    let fullImageUrl = item.image_url;
    
    if (!item.image_url.startsWith('http')) {
      // Remove leading slash if present to avoid double slashes
      const cleanPath = item.image_url.startsWith('/') ? item.image_url.substring(1) : item.image_url;
      fullImageUrl = `${API_BASE_URL}/${cleanPath}`;
    }
    
    console.log('[ProfileScreen] Rendering outfit:', item.id, 'Image URL:', fullImageUrl);

    return (
      <TouchableOpacity 
        style={styles.outfitCard}
        onPress={() => router.push(`/(tabs)/outfit-detail?id=${item.id}`)}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: fullImageUrl }} 
          style={styles.outfitImage} 
          resizeMode="cover"
          onError={(error) => console.error('[ProfileScreen] Image load error:', error.nativeEvent.error)}
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
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(item.id);
              }} 
              style={styles.actionButton}
            >
              <Ionicons
                name={item.liked ? 'heart' : 'heart-outline'}
                size={24}
                color={item.liked ? '#ff4444' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                deleteOutfit(item.id);
              }} 
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.outfitDate}>
          {new Date(item.created_at).toLocaleDateString('ro-RO')}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleLogout = async () => {
    try {
      console.log('Logout button pressed');
      await logout();
      console.log('Logout successful, redirecting...');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Eroare', 'Nu s-a putut deconecta. Încearcă din nou.');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header */}
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
          <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
            <ThemedButton 
              title="Setări Profil" 
              onPress={() => Alert.alert("Setări", "Configurarea contului va fi disponibilă în curând.")}
              type="tertiary"
              icon="settings-outline"
            />
            <ThemedButton 
              title="Deconectare" 
              onPress={handleLogout}
              type="secondary"
              icon="log-out-outline"
            />
          </View>
        </View>

        {/* Saved Outfits Section */}
        <View style={styles.outfitsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Ținutele mele salvate</ThemedText>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#115740" />
              <Text style={styles.loadingText}>Se încarcă...</Text>
            </View>
          ) : savedOutfits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shirt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nicio ținută salvată</Text>
              <Text style={styles.emptySubtitle}>
                Generează și salvează ținute pentru a le vedea aici
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedOutfits}
              renderItem={renderOutfitCard}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.outfitsList}
            />
          )}
        </View>
      </ScrollView>
    </ThemedView>
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
  outfitImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
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
});
