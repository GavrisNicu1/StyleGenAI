import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/constants/config';
import { router, useLocalSearchParams } from 'expo-router';

interface Outfit {
  id: number;
  image_url: string;
  style_data: {
    style?: string;
    season?: string;
    gender?: string;
    silhouette?: string;
    pieces?: {
      top?: any;
      bottom?: any;
      shoes?: any;
    };
    analysis?: {
      piece_colors?: any[];
      dominant_colors?: string[];
      summary?: string;
    };
  };
  liked: boolean;
  created_at: string;
}

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchOutfitDetail();
  }, [id]);

  const fetchOutfitDetail = async () => {
    try {
      console.log('[OutfitDetail] Fetching outfit:', id);
      const response = await fetch(`${API_BASE_URL}/outfits/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[OutfitDetail] Response:', data);

      if (data.status === 'success' && data.outfit) {
        setOutfit(data.outfit);
      } else {
        Alert.alert('Eroare', 'Nu s-a putut încărca outfit-ul');
        router.back();
      }
    } catch (error) {
      console.error('[OutfitDetail] Error:', error);
      Alert.alert('Eroare', 'Nu s-a putut încărca outfit-ul');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!outfit) return;

    try {
      const response = await fetch(`${API_BASE_URL}/outfits/${outfit.id}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setOutfit(prev => prev ? { ...prev, liked: data.liked } : null);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-a putut actualiza statusul');
    }
  };

  const deleteOutfit = () => {
    if (!outfit) return;

    const confirmed = window.confirm('Sigur vrei să ștergi această ținută?');
    
    if (confirmed) {
      handleDelete();
    }
  };

  const handleDelete = async () => {
    if (!outfit) return;

    try {
      console.log('[OutfitDetail] Deleting outfit:', outfit.id);
      const response = await fetch(`${API_BASE_URL}/outfits/${outfit.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[OutfitDetail] Delete response:', data);
      
      if (data.status === 'success') {
        alert('Ținută ștearsă cu succes!');
        router.back();
      } else {
        alert('Eroare: ' + (data.message || 'Nu s-a putut șterge ținuta'));
      }
    } catch (error) {
      console.error('[OutfitDetail] Delete error:', error);
      alert('Eroare: Nu s-a putut șterge ținuta');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalii Outfit</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#115740" />
        </View>
      </View>
    );
  }

  if (!outfit) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalii Outfit</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Outfit-ul nu a fost găsit</Text>
        </View>
      </View>
    );
  }

  // Handle image URL
  let fullImageUrl = outfit.image_url;
  if (!outfit.image_url.startsWith('http')) {
    const cleanPath = outfit.image_url.startsWith('/') ? outfit.image_url.substring(1) : outfit.image_url;
    fullImageUrl = `${API_BASE_URL}/${cleanPath}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalii Outfit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Outfit Pieces Display */}
        <View style={styles.imageContainer}>
          <View style={styles.outfitDisplay}>
            {/* Top */}
            {outfit.style_data.pieces?.top?.path && (
              <View style={styles.pieceImageContainer}>
                <Image
                  source={{ 
                    uri: outfit.style_data.pieces.top.path.startsWith('http') 
                      ? outfit.style_data.pieces.top.path 
                      : `${API_BASE_URL}/${outfit.style_data.pieces.top.path.replace(/^\//, '')}`
                  }}
                  style={styles.pieceImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            {/* Bottom */}
            {outfit.style_data.pieces?.bottom?.path && (
              <View style={styles.pieceImageContainer}>
                <Image
                  source={{ 
                    uri: outfit.style_data.pieces.bottom.path.startsWith('http') 
                      ? outfit.style_data.pieces.bottom.path 
                      : `${API_BASE_URL}/${outfit.style_data.pieces.bottom.path.replace(/^\//, '')}`
                  }}
                  style={styles.pieceImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            {/* Shoes */}
            {outfit.style_data.pieces?.shoes?.path && (
              <View style={styles.pieceImageContainer}>
                <Image
                  source={{ 
                    uri: outfit.style_data.pieces.shoes.path.startsWith('http') 
                      ? outfit.style_data.pieces.shoes.path 
                      : `${API_BASE_URL}/${outfit.style_data.pieces.shoes.path.replace(/^\//, '')}`
                  }}
                  style={styles.pieceImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
            <Ionicons
              name={outfit.liked ? 'heart' : 'heart-outline'}
              size={32}
              color={outfit.liked ? '#ff4444' : '#666'}
            />
            <Text style={styles.actionText}>
              {outfit.liked ? 'Favorite' : 'Adaugă la Favorite'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteOutfit} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={32} color="#ff4444" />
            <Text style={styles.actionTextDelete}>Șterge</Text>
          </TouchableOpacity>
        </View>

        {/* Style Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informații Stil</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data salvării:</Text>
            <Text style={styles.infoValue}>
              {new Date(outfit.created_at).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {outfit.style_data.style && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stil:</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{outfit.style_data.style}</Text>
              </View>
            </View>
          )}

          {outfit.style_data.season && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sezon:</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{outfit.style_data.season}</Text>
              </View>
            </View>
          )}

          {outfit.style_data.gender && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gen:</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{outfit.style_data.gender}</Text>
              </View>
            </View>
          )}

          {outfit.style_data.silhouette && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Siluetă:</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{outfit.style_data.silhouette}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Pieces Information */}
        {outfit.style_data.pieces && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Piese Outfit</Text>
            
            {outfit.style_data.pieces.top && (
              <View style={styles.pieceCard}>
                <Text style={styles.pieceTitle}>👕 Top</Text>
                {outfit.style_data.pieces.top.name && (
                  <Text style={styles.pieceText}>{outfit.style_data.pieces.top.name}</Text>
                )}
                {outfit.style_data.pieces.top.dominant_color && (
                  <View style={styles.colorRow}>
                    <Text style={styles.pieceLabel}>Culoare dominantă:</Text>
                    <Text style={styles.pieceText}>{outfit.style_data.pieces.top.dominant_color}</Text>
                  </View>
                )}
              </View>
            )}

            {outfit.style_data.pieces.bottom && (
              <View style={styles.pieceCard}>
                <Text style={styles.pieceTitle}>👖 Bottom</Text>
                {outfit.style_data.pieces.bottom.name && (
                  <Text style={styles.pieceText}>{outfit.style_data.pieces.bottom.name}</Text>
                )}
                {outfit.style_data.pieces.bottom.dominant_color && (
                  <View style={styles.colorRow}>
                    <Text style={styles.pieceLabel}>Culoare dominantă:</Text>
                    <Text style={styles.pieceText}>{outfit.style_data.pieces.bottom.dominant_color}</Text>
                  </View>
                )}
              </View>
            )}

            {outfit.style_data.pieces.shoes && (
              <View style={styles.pieceCard}>
                <Text style={styles.pieceTitle}>👞 Shoes</Text>
                {outfit.style_data.pieces.shoes.name && (
                  <Text style={styles.pieceText}>{outfit.style_data.pieces.shoes.name}</Text>
                )}
                {outfit.style_data.pieces.shoes.dominant_color && (
                  <View style={styles.colorRow}>
                    <Text style={styles.pieceLabel}>Culoare dominantă:</Text>
                    <Text style={styles.pieceText}>{outfit.style_data.pieces.shoes.dominant_color}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Analysis Summary */}
        {outfit.style_data.analysis?.summary && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Analiză</Text>
            <Text style={styles.summaryText}>{outfit.style_data.analysis.summary}</Text>
          </View>
        )}

        {/* Color Analysis */}
        {outfit.style_data.analysis?.dominant_colors && outfit.style_data.analysis.dominant_colors.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Culori Dominante</Text>
            <View style={styles.colorsContainer}>
              {outfit.style_data.analysis.dominant_colors.map((color, index) => (
                <View key={index} style={styles.colorChip}>
                  <Text style={styles.colorText}>{color}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    minHeight: 500,
  },
  outfitDisplay: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  pieceImageContainer: {
    width: '100%',
    maxWidth: 300,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  likeButton: {
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  actionTextDelete: {
    marginTop: 8,
    fontSize: 14,
    color: '#ff4444',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  badge: {
    backgroundColor: '#115740',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#F7F5F0',
    fontSize: 12,
    fontWeight: '500',
  },
  pieceCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#C5A059',
  },
  pieceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#115740',
    marginBottom: 8,
  },
  pieceText: {
    fontSize: 14,
    color: '#666',
  },
  pieceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 4,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#115740',
  },
  colorText: {
    fontSize: 12,
    color: '#115740',
    fontWeight: '500',
  },
});
