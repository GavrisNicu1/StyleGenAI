import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/config';
import { ProfileHeader } from '@/components/ProfileHeader';
import { router } from 'expo-router';

interface Outfit {
  id: number;
  image_url: string;
  style_data: any;
  liked: boolean;
  created_at: string;
}

export default function HistoryScreen() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'liked'>('all');
  const { token, isAuthenticated } = useAuth();

  const fetchOutfits = async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      const url = filter === 'liked'
        ? `${API_BASE_URL}/outfits/history?liked_only=true`
        : `${API_BASE_URL}/outfits/history`;

      console.log('[HistoryScreen] Fetching outfits from:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[HistoryScreen] Response:', data);
      
      if (data.status === 'success') {
        console.log('[HistoryScreen] Number of outfits:', data.outfits.length);
        if (data.outfits.length > 0) {
          console.log('[HistoryScreen] First outfit:', data.outfits[0]);
          console.log('[HistoryScreen] First outfit image_url:', data.outfits[0].image_url);
        }
        setOutfits(data.outfits);
      } else {
        Alert.alert('Error', data.message || 'Failed to load outfits');
      }
    } catch (error) {
      console.error('[HistoryScreen] Fetch error:', error);
      Alert.alert('Error', 'Could not fetch outfits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOutfits();
  }, [filter, isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOutfits();
  };

  const toggleLike = async (outfitId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/outfits/${outfitId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        // Update local state
        setOutfits(prev =>
          prev.map(outfit =>
            outfit.id === outfitId ? { ...outfit, liked: data.liked } : outfit
          )
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update like status');
    }
  };

  const deleteOutfit = async (outfitId: number) => {
    // Use window.confirm for web compatibility
    const confirmed = window.confirm('Sigur vrei să ștergi acest outfit?');
    
    if (!confirmed) {
      return;
    }

    try {
      console.log('[HistoryScreen] Deleting outfit:', outfitId);
      const response = await fetch(`${API_BASE_URL}/outfits/${outfitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[HistoryScreen] Delete response:', data);
      
      if (data.status === 'success') {
        console.log('[HistoryScreen] Delete successful, removing from list');
        // Remove from local state
        setOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
        alert('✓ Outfit-ul a fost șters cu succes');
      } else {
        console.log('[HistoryScreen] Delete failed:', data.message);
        alert('Eroare: ' + (data.message || 'Nu s-a putut șterge outfit-ul'));
      }
    } catch (error) {
      console.error('[HistoryScreen] Delete error:', error);
      alert('Eroare: Nu s-a putut șterge outfit-ul');
    }
  };

  const renderOutfit = ({ item }: { item: Outfit }) => {
    // Handle image URL - if it already contains http, use as is, otherwise prepend API_BASE_URL
    let fullImageUrl = item.image_url;
    
    if (!item.image_url.startsWith('http')) {
      // Remove leading slash if present to avoid double slashes
      const cleanPath = item.image_url.startsWith('/') ? item.image_url.substring(1) : item.image_url;
      fullImageUrl = `${API_BASE_URL}/${cleanPath}`;
    }
    
    console.log('[HistoryScreen] Rendering outfit:', item.id, 'Image URL:', fullImageUrl);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/(tabs)/outfit-detail?id=${item.id}`)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: fullImageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => console.error('[HistoryScreen] Image load error:', error.nativeEvent.error)}
        />
        <View style={styles.cardFooter}>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={styles.actions}>
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
                color={item.liked ? '#ff4444' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                deleteOutfit(item.id);
              }} 
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Please login to view your outfit history</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <View style={styles.header}>
        <Text style={styles.title}>My Outfits</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'liked' && styles.filterButtonActive]}
            onPress={() => setFilter('liked')}
          >
            <Text style={[styles.filterText, filter === 'liked' && styles.filterTextActive]}>
              Liked
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text>Loading...</Text>
        </View>
      ) : outfits.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {filter === 'liked' ? 'No liked outfits yet' : 'No saved outfits yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          renderItem={renderOutfit}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 8,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardFooter: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: '#666',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
