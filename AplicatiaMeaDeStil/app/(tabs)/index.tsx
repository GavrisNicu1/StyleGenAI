import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { Camera } from 'expo-camera';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import SilhouetteSuplu from './assets/silhouette_suplu.png';
import SilhouetteMediu from './assets/silhouette_mediu.png';
import SilhouetteRobust from './assets/silhouette_robust.png';
import WebOutfitList, { WebItem } from '../../components/WebOutfitList';

const DEFAULT_BACKEND_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://192.168.100.182:5000';

const BASE_CLOTHING_CATEGORIES = ['Geacă', 'Tricou', 'Bluză', 'Pantalon', 'Fustă', 'Altul'] as const;
const CLOTHING_CATEGORIES = BASE_CLOTHING_CATEGORIES; // Alias for type compatibility
const SHORTS = 'Pantaloni scurți';
const SHIRT = 'Cămașă';
const JACKET = 'Sacou';
const COAT = 'Palton';
const SUIT = 'Costum';
const FOOTWEAR_CATEGORIES = ['Adidași', 'Pantofi', 'Ghete', 'Altele'] as const;

type ClothingCategory = (typeof CLOTHING_CATEGORIES)[number];
type FootwearCategory = (typeof FOOTWEAR_CATEGORIES)[number];
type CategoryType = 'îmbrăcăminte' | 'încălțăminte';
type WardrobeCategory = ClothingCategory | FootwearCategory;


function getCategories({ categoryType, season, style, gender }: {
  categoryType: CategoryType;
  season: SeasonOption;
  style: StyleOption;
  gender: GenderOption;
}): readonly WardrobeCategory[] {
  if (categoryType === 'încălțăminte') return FOOTWEAR_CATEGORIES;

  // Implementare finală pentru Casual, bărbați
  if (style === 'Casual' && gender === 'Barbati') {
    if (season === 'Vara') {
      return [
        'Vesta',
        'Cămașă',
        'Compleuri și Treninguri',
        'Bluze și Hanorace',
        'Tricou',
        'Pantalon',
        'Blugi',
        'Pantaloni scurți',
      ];
    } else {
      // Toamna/Primavara, Iarna
      return [
        'Geacă',
        'Palton',
        'Vesta',
        'Cămașă',
        'Compleuri și Treninguri',
        'Pulovere și cardigane',
        'Bluze și Hanorace',
        'Tricou',
        'Pantalon',
        'Blugi',
      ];
    }
  }
  // Elegant, bărbați
  if (style === 'Elegant' && gender === 'Barbati') {
    if (season === 'Vara') {
      return [
        'Costume',
        'Sacouri',
        'Cămăși',
        'Pantalon',
      ];
    } else {
      // Toamnă/Primăvară, Iarna
      return [
        'Paltoane',
        'Geci',
        'Costume',
        'Sacouri',
        'Cămăși',
        'Malete și Pulovere',
        'Pantalon',
      ];
    }
  }
  // Sport, bărbați
  if (style === 'Sport' && gender === 'Barbati') {
    if (season === 'Vara') {
      return [
        'Veste',
        'Treninguri',
        'Bluze',
        'Pantalon',
        'Colanți',
        'Pantaloni scurți',
      ];
    } else {
      // Toamnă/Primăvară, Iarna
      return [
        'Geci',
        'Veste',
        'Treninguri',
        'Bluze',
        'Pantalon',
        'Colanți',
        'Pantaloni scurți',
      ];
    }
  }
  
  // Default fallback pentru alte combinații de style/gender
  return BASE_CLOTHING_CATEGORIES;
}

const PIECE_COLOR_LABELS: Record<string, string> = {
  top: 'Top',
  bottom: 'Pantalon',
  shoes: 'Pantofi',
  outerwear: 'Strat exterior',
};

const STILURI = ['Casual', 'Elegant', 'Sport'] as const;
const SEZOANE = ['Vara', 'Toamna/Primavara', 'Iarna'] as const;
const GENURI = ['Barbati', 'Femei', 'Copii'] as const;
const SILUETE = ['Suplu', 'Mediu', 'Robust'] as const;

type StyleOption = (typeof STILURI)[number];
type SeasonOption = (typeof SEZOANE)[number];
type GenderOption = (typeof GENURI)[number];
type SilhouetteOption = (typeof SILUETE)[number];

type WardrobeItem = {
  id: string;
  uri: string;
  category: WardrobeCategory;
  categoryType: CategoryType;
};

type OutfitPiece = {
  color?: string | null;
  color_name?: string | null;
  text_logo?: string | null;
  path?: string | null;
  category?: string | null;
  source_url?: string | null;
  source_domain?: string | null;
  title?: string | null;
};

type OutfitAnalysis = {
  verdict: string;
  message: string;
  is_trending: boolean;
  score?: number; // scorul total calculat de generator (opțional)
  missing_recommendations?: string[]; // recomandări pentru articole lipsă față de tendințe
  trend_colors_used?: string[]; // ce culori din tendințe au fost folosite
  piece_colors?: Record<string, string | undefined>;
};

type OutfitSuggestion = {
  top: OutfitPiece;
  bottom: OutfitPiece;
  shoes: OutfitPiece;
  analysis: OutfitAnalysis;
};

type OutfitResult = OutfitSuggestion | { error: string };

type BackendSuccessResponse = {
  status: 'success';
  outfit_suggestion: OutfitSuggestion;
};

type BackendErrorResponse = {
  status: 'error';
  message?: string;
};

type BackendResponse = BackendSuccessResponse | BackendErrorResponse | Record<string, unknown>;

// Răspuns opțional pentru o ținută alternativă din web
type WebOutfitSuggestion = {
  top?: OutfitPiece;
  bottom?: OutfitPiece;
  shoes?: OutfitPiece;
};
type WebOutfitSuccessResponse = {
  status: 'success';
  web_outfit: WebOutfitSuggestion;
};
type WebOutfitResponse = WebOutfitSuccessResponse | BackendErrorResponse | Record<string, unknown>;

const getSilhouetteAsset = (silhouette: SilhouetteOption): ImageSourcePropType => {
  switch (silhouette) {
    case 'Suplu':
      return SilhouetteSuplu;
    case 'Robust':
      return SilhouetteRobust;
    default:
      return SilhouetteMediu;
  }
};

const isBackendSuccess = (payload: BackendResponse): payload is BackendSuccessResponse => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'status' in payload &&
    (payload as { status?: unknown }).status === 'success' &&
    'outfit_suggestion' in payload
  );
};

const isBackendError = (payload: BackendResponse): payload is BackendErrorResponse => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'status' in payload &&
    (payload as { status?: unknown }).status === 'error'
  );
};

// Map Romanian categories to backend categories
const mapCategoryToBackend = (category: string): string => {
  const lowerCategory = category.toLowerCase();
  
  // Mapping for clothing items (îmbrăcăminte) -> "Top"
  if (lowerCategory.includes('tricou') || lowerCategory.includes('bluză') || 
      lowerCategory.includes('cămașă') || lowerCategory.includes('geacă') ||
      lowerCategory.includes('sacou') || lowerCategory.includes('palton') ||
      lowerCategory.includes('costum') || lowerCategory === 'altul') {
    return 'Top';
  }
  
  // Mapping for bottoms (pantaloni/fuste) -> "Pantalon"
  if (lowerCategory.includes('pantalon') || lowerCategory.includes('fustă') ||
      lowerCategory.includes('shorts') || lowerCategory.includes('scurți')) {
    return 'Pantalon';
  }
  
  // Mapping for footwear (încălțăminte) -> "Pantof"
  if (lowerCategory.includes('adidași') || lowerCategory.includes('pantofi') ||
      lowerCategory.includes('ghete') || lowerCategory.includes('încălțăminte') ||
      lowerCategory === 'altele') {
    return 'Pantof';
  }
  
  // Fallback
  return 'Top';
};

// Helper: transform WebOutfitSuggestion to WebOutfitList expected format
function transformWebOutfit(
  webOutfit: WebOutfitSuggestion,
  style: StyleOption,
  season: SeasonOption
): {
  outerwear?: WebItem;
  top?: WebItem;
  bottom?: WebItem;
  shoes?: WebItem;
} {
  // Helper to coerce OutfitPiece to WebItem
  function toWebItem(piece?: OutfitPiece): WebItem | undefined {
    if (!piece) return undefined;
    return {
      path: typeof piece.path === 'string' ? piece.path : '',
      title: piece.title ?? '',
      source_url: piece.source_url ?? '',
      source_domain: piece.source_domain ?? '',
      alternatives: (piece as any).alternatives ?? [],
      category: piece.category ?? '',
    };
  }
  let result = {
    outerwear: toWebItem((webOutfit as any).outerwear),
    top: toWebItem(webOutfit.top),
    bottom: toWebItem(webOutfit.bottom),
    shoes: toWebItem(webOutfit.shoes),
  };

  // Adăugare automată geacă/palton la propuneri web pentru sezon rece dacă lipsește
  // Folosim parametrii primiți
  if ((season === 'Toamna/Primavara' || season === 'Iarna') && !result.outerwear) {
    if (style === 'Elegant') {
      // Palton elegant
      result.outerwear = {
        path: '',
        title: 'Palton elegant de sezon',
        source_url: 'https://www.fashiondays.ro/g/barbati/paltoane',
        source_domain: 'fashiondays.ro',
        alternatives: [],
        category: 'Palton',
      };
    } else {
      // Geacă universală
      result.outerwear = {
        path: '',
        title: 'Geacă de sezon rece',
        source_url: 'https://www.aboutyou.ro/c/barbati/haine/geci-20320',
        source_domain: 'aboutyou.ro',
        alternatives: [],
        category: 'Geacă',
      };
    }
  }
  return result;
}

const App = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('Casual');
  const [selectedSeason, setSelectedSeason] = useState<SeasonOption>('Toamna/Primavara');
  const [selectedGender, setSelectedGender] = useState<GenderOption>('Barbati');
  const [selectedSilhouette, setSelectedSilhouette] = useState<SilhouetteOption>('Mediu');
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [outfitSuggestion, setOutfitSuggestion] = useState<OutfitResult | null>(null);
  const [outfitSaved, setOutfitSaved] = useState(false); // Track if current outfit is saved
  const [webOutfit, setWebOutfit] = useState<WebOutfitSuggestion | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isSourceModalVisible, setSourceModalVisible] = useState(false);
  const [currentCategoryType, setCurrentCategoryType] = useState<CategoryType>('îmbrăcăminte');
  const [currentCategory, setCurrentCategory] = useState<WardrobeCategory | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>(DEFAULT_BACKEND_URL);

  // Redirect to login if not authenticated (with safety check)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('backend_url');
        if (saved && /^https?:\/\//i.test(saved)) {
          setBackendUrl(saved.replace(/\/$/, ''));
        }
      } catch {
        // ignore
      }
    })();
  }, []);
  // Am eliminat conceptul de manechin; nu mai stocăm preview compus.

  const openCategoryModal = (type: CategoryType) => {
    setCurrentCategoryType(type);
    setCategoryModalVisible(true);
  };

  const onCategorySelect = (category: WardrobeCategory) => {
    setCurrentCategory(category);
    setCategoryModalVisible(false);
    setSourceModalVisible(true);
  };

  const handleImagePick = async (source: 'gallery' | 'camera') => {
    setSourceModalVisible(false);

    const category = currentCategory;
    if (!category) {
      Alert.alert('Eroare', 'Alege o categorie înainte de a adăuga un articol.');
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    if (source === 'gallery') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Atenție!', 'Permite accesul la galerie pentru a continua.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsMultipleSelection: Platform.OS === 'web',
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });
    } else {
      const permission = await Camera.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Atenție!', 'Permite accesul la cameră pentru a continua.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ quality: 1 });
    }

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const timestamp = Date.now();
    const newItems: WardrobeItem[] = result.assets.map((asset, index) => ({
      id: `${timestamp}-${index}`,
      uri: asset.uri,
      category,
      categoryType: currentCategoryType,
    }));

    setSelectedItems(prevItems => [...prevItems, ...newItems]);
    setCurrentCategory(null);
  };

  const handleDeleteItem = (idToDelete: string) => {
    setSelectedItems(prevItems => prevItems.filter(item => item.id !== idToDelete));
  };

  // Heuristici robuste: dacă e îmbrăcăminte și NU e "pantalon"/"fustă" => tratăm ca top (tricou/bluză/geacă/altul)
  const isBottom = (cat: WardrobeCategory) => /pantalon|fustă/i.test(String(cat));
  const isTop = (cat: WardrobeCategory) => !isBottom(cat);
  const topsCount = selectedItems.filter(i => i.categoryType === 'îmbrăcăminte' && isTop(i.category)).length;
  const bottomsCount = selectedItems.filter(i => i.categoryType === 'îmbrăcăminte' && isBottom(i.category)).length;
  const shoesCount = selectedItems.filter(i => i.categoryType === 'încălțăminte').length;
  const canGenerateOutfit = topsCount >= 5 && bottomsCount >= 5 && shoesCount >= 5;

  const handleGenerateOutfit = async () => {
    if (!canGenerateOutfit) {
      const missing: string[] = [];
      if (topsCount < 5) missing.push(`mai ai nevoie de ${5 - topsCount} top-uri (Tricou/Bluză/Geacă)`);
      if (bottomsCount < 5) missing.push(`mai ai nevoie de ${5 - bottomsCount} piese jos (Pantalon/Fustă)`);
      if (shoesCount < 5) missing.push(`mai ai nevoie de ${5 - shoesCount} perechi încălțăminte`);
      Alert.alert('Inventar insuficient', missing.join('\n'));
      return;
    }

    // Debug: counters and category distribution
    console.log('[DEBUG] counts', { topsCount, bottomsCount, shoesCount, total: selectedItems.length });
    const catStats = selectedItems.reduce<Record<string, number>>((acc, it) => {
      const k = `${it.categoryType}:${it.category}`;
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    console.log('[DEBUG] category histogram', catStats);

    const formData = new FormData();
    formData.append('style_filter', selectedStyle.toLowerCase());
    formData.append('season', selectedSeason.toLowerCase());
    formData.append('gender', selectedGender.toLowerCase());
    formData.append('silhouette', selectedSilhouette.toLowerCase());

    // Debug verificare ordonare & număr
    console.log('[DEBUG] sending', selectedItems.length, 'items');

    if (Platform.OS === 'web') {
      // Pe web, FormData trebuie să primească un File/Blob real
      for (let index = 0; index < selectedItems.length; index++) {
        const item = selectedItems[index];
        try {
          const resp = await fetch(item.uri);
          const blob = await resp.blob();
          const mime = blob.type || 'image/jpeg';
          const ext = (mime.split('/')[1] || 'jpg').toLowerCase();
          const file = new File([blob], `photo_${index}.${ext}`, { type: mime });
          formData.append('files', file);
          formData.append('categories', item.category); // Send original Romanian category
        } catch (e) {
          console.warn('Failed to make File from URI', item.uri, e);
        }
      }
    } else {
      // Pe nativ, obiectul { uri, name, type } este acceptat de fetch cu FormData
      selectedItems.forEach((item, index) => {
        const fileType = item.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
        const file = {
          uri: item.uri,
          name: `photo_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as const;
        formData.append('files', file as unknown as Blob);
        formData.append('categories', item.category); // Send original Romanian category
      });
    }
    // Mismatch warning (should be equal)
    const categoriesCount = selectedItems.length;
    if (categoriesCount !== selectedItems.length) {
      console.warn('[WARN] files/categories length mismatch', {
        files: selectedItems.length,
        categories: categoriesCount,
      });
    }

    setIsLoading(true);
  setOutfitSuggestion(null);
  setWebOutfit(null);

    try {
  const response = await fetch(`${backendUrl}/get_suggestion`, {
        method: 'POST',
        body: formData,
      });

      const result: BackendResponse = await response.json();
      console.log('Backend response:', result);

      if (isBackendSuccess(result)) {
        console.log('Success! Processing outfit...');
        // Normalizăm piesele: dacă path lipsește, folosim transparent_path sau original_path
        const normalized: OutfitSuggestion = {
          top: normalizePiece(result.outfit_suggestion.top),
          bottom: normalizePiece(result.outfit_suggestion.bottom),
          shoes: normalizePiece(result.outfit_suggestion.shoes),
          analysis: result.outfit_suggestion.analysis,
        };
        console.log('Normalized outfit:', normalized);
        setOutfitSuggestion(normalized);
        setOutfitSaved(false); // Reset saved state when new outfit is generated
        // Cerem și alternativa din web, opțional
        fetchWebAlternative({
          style: selectedStyle,
          season: selectedSeason,
          gender: selectedGender,
          trendColors: normalized.analysis?.trend_colors_used,
          pieceColors: normalized.analysis?.piece_colors,
        });
      } else if (isBackendError(result)) {
        console.log('Backend error:', result.message);
        setOutfitSuggestion({ error: result.message ?? 'Eroare de la server.' });
      } else {
        setOutfitSuggestion({ error: 'Răspuns neașteptat de la server.' });
      }
    } catch (error) {
      console.error('generate outfit', error);
      Alert.alert('Eroare de rețea', 'Nu m-am putut conecta la serverul AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebAlternative = async ({
    style,
    season,
    gender,
    trendColors,
    pieceColors,
  }: {
    style: StyleOption;
    season: SeasonOption;
    gender: GenderOption;
    trendColors?: string[] | null;
    pieceColors?: Record<string, string | undefined> | null;
  }) => {
    try {
      const normalizedPieceColors = pieceColors
        ? Object.fromEntries(
            Object.entries(pieceColors)
              .filter(([, value]) => typeof value === 'string' && value.trim().length)
              .map(([key, value]) => [key, value!.toLowerCase()])
          )
        : undefined;

      const res = await fetch(`${backendUrl}/web_outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style_filter: style.toLowerCase(),
          season: season.toLowerCase(),
          gender: gender.toLowerCase(),
          trend_colors: Array.isArray(trendColors) ? trendColors.filter(Boolean) : undefined,
          piece_colors: normalizedPieceColors,
        }),
      });
      const payload: WebOutfitResponse = await res.json();
      if (typeof payload === 'object' && payload && 'status' in payload && (payload as any).status === 'success' && 'web_outfit' in payload) {
        setWebOutfit((payload as WebOutfitSuccessResponse).web_outfit);
      } else {
        setWebOutfit(null);
      }
    } catch (e) {
      console.warn('web_outfit fetch failed', e);
      setWebOutfit(null);
    }
  };

  const resetApp = () => {
    setSelectedItems([]);
    setOutfitSuggestion(null);
    setIsLoading(false);
    setSelectedStyle('Casual');
    setSelectedSeason('Toamna/Primavara');
    setSelectedGender('Barbati');
    setSelectedSilhouette('Mediu');
    setCurrentCategory(null);
  };

  const handleSaveToHistory = async () => {
    console.log('[SAVE] Starting save process...');
    console.log('[SAVE] isAuthenticated:', isAuthenticated);
    console.log('[SAVE] outfitSuggestion exists:', !!outfitSuggestion);
    console.log('[SAVE] outfitSaved:', outfitSaved);
    
    // Check if outfit is already saved
    if (outfitSaved) {
      Alert.alert('Deja salvat', 'Acest outfit a fost deja salvat în Profil.');
      return;
    }
    
    if (!outfitSuggestion || 'error' in outfitSuggestion || !isAuthenticated) {
      Alert.alert('Eroare', 'Nu există outfit de salvat sau nu ești autentificat');
      console.log('[SAVE] Validation failed - missing outfit or not authenticated');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      console.log('[SAVE] Token exists:', !!token);
      
      if (!token) {
        Alert.alert('Eroare', 'Token de autentificare lipsește');
        return;
      }

      // Construiește URL-ul imaginii outfit-ului (folosim prima piesă disponibilă ca reprezentare)
      const firstPiece = outfitSuggestion.top || outfitSuggestion.bottom || outfitSuggestion.shoes;
      
      // Verificăm dacă există o piesă cu path valid
      if (!firstPiece || !firstPiece.path) {
        Alert.alert('Eroare', 'Nu există imagini în outfit pentru salvare');
        console.error('[SAVE] No valid piece with path found:', { top: outfitSuggestion.top, bottom: outfitSuggestion.bottom, shoes: outfitSuggestion.shoes });
        return;
      }

      const imageUrl = toAbsoluteUrl(firstPiece.path, backendUrl);
      
      if (!imageUrl) {
        Alert.alert('Eroare', 'URL imagine invalid');
        console.error('[SAVE] Invalid image URL generated from path:', firstPiece.path);
        return;
      }

      console.log('[SAVE] Saving outfit with image URL:', imageUrl);

      // Construiește datele de stil
      const styleData = {
        style: selectedStyle,
        season: selectedSeason,
        gender: selectedGender,
        silhouette: selectedSilhouette,
        pieces: {
          top: outfitSuggestion.top,
          bottom: outfitSuggestion.bottom,
          shoes: outfitSuggestion.shoes,
        },
        analysis: outfitSuggestion.analysis,
      };

      console.log('[SAVE] Calling API:', `${backendUrl}/outfits/save`);
      const response = await fetch(`${backendUrl}/outfits/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_url: imageUrl,
          style_data: styleData,
        }),
      });

      console.log('[SAVE] Response status:', response.status);
      const result = await response.json();
      console.log('[SAVE] Response data:', result);

      if (response.status === 401) {
        // Token invalid - logout and redirect to login
        Alert.alert('Sesiune expirată', 'Te rugăm să te autentifici din nou.', [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/auth/login');
            },
          },
        ]);
        return;
      }

      if (result.status === 'success') {
        console.log('[SAVE] Outfit saved successfully!');
        setOutfitSaved(true); // Mark outfit as saved
        console.log('[SAVE] outfitSaved set to true');
        Alert.alert(
          '✓ Salvat cu succes!', 
          'Outfit-ul a fost salvat în Profil. Poți să-l vezi accesând profilul tău.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Vezi Profilul', 
              onPress: () => router.push('/(tabs)/profile'),
              style: 'default'
            }
          ]
        );
      } else {
        console.log('[SAVE] Save failed:', result.message);
        Alert.alert('Eroare', result.message || 'Nu s-a putut salva outfit-ul');
      }
    } catch (error) {
      console.error('[SAVE] Error:', error);
      Alert.alert('Eroare', 'Nu s-a putut salva outfit-ul. Verifică conexiunea.');
    }
  };

  // Eliminat: handleComposeOnMannequin (concept manechin).

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Auth Header */}
        <View style={styles.authHeader}>
          {isAuthenticated && user ? (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')} 
              style={styles.profileButton}
            >
              <Ionicons name="person-circle" size={32} color="#007AFF" />
              <Text style={styles.profileButtonText}>{user.email}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => router.push('/auth/login')} 
              style={styles.loginButton}
            >
              <Ionicons name="person-outline" size={20} color="#007AFF" />
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        <Modal isVisible={isCategoryModalVisible} onBackdropPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alege categoria</Text>
            {getCategories({ categoryType: currentCategoryType, season: selectedSeason, style: selectedStyle, gender: selectedGender }).map(category => (
              <TouchableOpacity key={category} style={styles.categoryButton} onPress={() => onCategorySelect(category)}>
                <Text>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>

        <Modal isVisible={isSourceModalVisible} onBackdropPress={() => setSourceModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alege sursa</Text>
            <TouchableOpacity style={styles.categoryButton} onPress={() => handleImagePick('gallery')}>
              <Text>Galerie foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton} onPress={() => handleImagePick('camera')}>
              <Text>Cameră foto</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Text style={styles.title}>Stilistul tău AI</Text>

        {!outfitSuggestion && (
          <>
            <Text style={styles.instructions}>1. Alege stilul:</Text>
            <View style={styles.filterContainer}>
              {STILURI.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.filterButton, selectedStyle === style && styles.filterButtonSelected]}
                  onPress={() => setSelectedStyle(style)}
                >
                  <Text style={selectedStyle === style ? styles.filterTextSelected : styles.filterText}>{style}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.instructions}>2. Alege sezonul:</Text>
            <View style={styles.filterContainer}>
              {SEZOANE.map(season => (
                <TouchableOpacity
                  key={season}
                  style={[styles.filterButton, selectedSeason === season && styles.filterButtonSelected]}
                  onPress={() => setSelectedSeason(season)}
                >
                  <Text style={selectedSeason === season ? styles.filterTextSelected : styles.filterText}>{season}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.instructions}>3. Alege genul:</Text>
            <View style={styles.filterContainer}>
              {GENURI.map(gender => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.filterButton,
                    selectedGender === gender && styles.filterButtonSelected,
                    gender !== 'Barbati' && styles.filterButtonDisabled,
                  ]}
                  disabled={gender !== 'Barbati'}
                  onPress={() => setSelectedGender(gender)}
                >
                  <Text
                    style={[
                      selectedGender === gender ? styles.filterTextSelected : styles.filterText,
                      gender !== 'Barbati' && styles.filterTextDisabled,
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.instructions}>4. Alege silueta:</Text>
            <View style={styles.filterContainer}>
              {SILUETE.map(silhouette => (
                <TouchableOpacity
                  key={silhouette}
                  style={[styles.filterButton, styles.silhouetteButton, selectedSilhouette === silhouette && styles.filterButtonSelected]}
                  onPress={() => setSelectedSilhouette(silhouette)}
                >
                  <Image source={getSilhouetteAsset(silhouette)} style={styles.silhouetteImage} />
                  <Text
                    style={[
                      selectedSilhouette === silhouette ? styles.filterTextSelected : styles.filterText,
                      styles.silhouetteText,
                    ]}
                  >
                    {silhouette}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.instructions}>5. Adaugă articolele:</Text>
            <View style={styles.addButtonsContainer}>
              <TouchableOpacity style={styles.addButton} onPress={() => openCategoryModal('îmbrăcăminte')}>
                <Text style={styles.addButtonText}>+ Îmbrăcăminte</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => openCategoryModal('încălțăminte')}>
                <Text style={styles.addButtonText}>+ Încălțăminte</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
              <View style={styles.gridColumn}>
                <Text style={styles.gridTitle}>Îmbrăcăminte</Text>
                {selectedItems
                  .filter(item => item.categoryType === 'îmbrăcăminte')
                  .map(item => (
                    <View key={item.id} style={styles.itemContainer}>
                      <Image source={{ uri: item.uri }} style={styles.previewImage} />
                      <Text style={styles.itemCategory}>{item.category}</Text>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
                        <FontAwesome name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>

              <View style={styles.gridColumn}>
                <Text style={styles.gridTitle}>Încălțăminte</Text>
                {selectedItems
                  .filter(item => item.categoryType === 'încălțăminte')
                  .map(item => (
                    <View key={item.id} style={styles.itemContainer}>
                      <Image source={{ uri: item.uri }} style={styles.previewImage} />
                      <Text style={styles.itemCategory}>{item.category}</Text>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
                        <FontAwesome name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            </View>

            <View style={styles.separator} />
            <View style={{ width: '100%', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, marginBottom: 4 }}>
                Top-uri: {topsCount} / 5 | Piese jos: {bottomsCount} / 5 | Încălțăminte: {shoesCount} / 5
              </Text>
              {!canGenerateOutfit && (
                <Text style={{ fontSize: 12, color: '#e74c3c' }}>
                  Adaugă suficiente articole (minim 5 în fiecare categorie) pentru a genera o ținută bazată pe tendințe.
                </Text>
              )}
            </View>
            <PrimaryButton
              title="Generează ținuta"
              onPress={handleGenerateOutfit}
              disabled={isLoading || !canGenerateOutfit}
            />
          </>
        )}

        {isLoading && <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />}
        {outfitSuggestion && !isLoading && (
          <View style={styles.resultContainer}>
            {'error' in outfitSuggestion ? (
              <>
                <Text style={styles.resultTitle}>{outfitSuggestion.error}</Text>
                <TouchableOpacity style={styles.resetButton} onPress={resetApp}>
                  <Text style={styles.resetButtonText}>Încearcă din nou</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Garderoba utilizatorului */}
                <View style={{ marginTop: 24 }}>
                  <Text style={styles.resultSectionTitle}>Din garderoba ta:</Text>
                  <CompareOutfits mySuggestion={outfitSuggestion} webSuggestion={null} baseUrl={backendUrl} />
                </View>
                {/* Propuneri din Web cu logo-uri */}
                {webOutfit && (
                  <View style={{ marginTop: 24 }}>
                    <WebOutfitList outfitData={transformWebOutfit(webOutfit, selectedStyle, selectedSeason)} style={selectedStyle} />
                  </View>
                )}
                
                {/* Save to Profile Button */}
                {isAuthenticated && (
                  <TouchableOpacity 
                    style={[styles.saveButton, outfitSaved && styles.saveButtonDisabled]} 
                    onPress={handleSaveToHistory}
                    disabled={outfitSaved}
                  >
                    <Ionicons 
                      name={outfitSaved ? "checkmark-circle" : "heart-outline"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.saveButtonText}>
                      {outfitSaved ? 'Salvat ✓' : 'Salvează în Profil'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.resetButton} onPress={resetApp}>
                  <Text style={styles.resetButtonText}>Creează o altă ținută</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default App;

type AvatarShowcaseProps = {
  suggestion: OutfitSuggestion;
  silhouette: SilhouetteOption;
  baseUrl?: string;
};

type PrimaryButtonProps = {
  title: string;
  disabled?: boolean;
  onPress: () => void;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, disabled, onPress }) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    activeOpacity={disabled ? 1 : 0.7}
    style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
  >
    <Text style={[styles.primaryBtnText, disabled && { opacity: 0.7 }]}>{title}</Text>
  </TouchableOpacity>
);

// Helper: fallback path logic
const normalizePiece = (piece: OutfitPiece): OutfitPiece => {
  if (!piece) return {};
  if (!piece.path && (piece as any).transparent_path) {
    return { ...piece, path: (piece as any).transparent_path };
  }
  if (!piece.path && (piece as any).original_path) {
    return { ...piece, path: (piece as any).original_path };
  }
  return piece;
};

const buildColorSummaryText = (pieceColors?: Record<string, string | undefined>) => {
  if (!pieceColors) return null;
  const segments = Object.entries(PIECE_COLOR_LABELS)
    .map(([key, label]) => {
      const value = pieceColors[key];
      if (!value) return null;
      return `${label} ${value}`;
    })
    .filter(Boolean) as string[];
  return segments.length ? segments.join(' • ') : null;
};

const toAbsoluteUrl = (path: string, baseUrl: string) => {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}/${normalizedPath}`;
};

const getPieceImageSource = (piece: OutfitPiece | undefined, baseUrl: string) => {
  if (!piece?.path) {
    return undefined;
  }
  const absolute = toAbsoluteUrl(piece.path, baseUrl);
  return absolute ? { uri: absolute } : undefined;
};

const AvatarShowcase: React.FC<AvatarShowcaseProps> = ({ suggestion, silhouette, baseUrl = DEFAULT_BACKEND_URL }) => {
  const baseSilhouette = getSilhouetteAsset(silhouette);
  const colorSummary = buildColorSummaryText(suggestion.analysis.piece_colors);

  const layers = [
    { key: 'top' as const, piece: suggestion.top, containerStyle: styles.layerTop },
    { key: 'bottom' as const, piece: suggestion.bottom, containerStyle: styles.layerBottom },
    { key: 'shoes' as const, piece: suggestion.shoes, containerStyle: styles.layerShoes },
  ];

  const recommendedCards = [
    { label: 'Top', piece: suggestion.top },
    { label: 'Bottom', piece: suggestion.bottom },
    { label: 'Încălțăminte', piece: suggestion.shoes },
  ];

  return (
    <>
      <Text style={styles.resultSectionTitle}>Ținuta recomandată:</Text>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCard}>
          <Image source={baseSilhouette} style={styles.avatarSilhouette} resizeMode="contain" />
          {layers.map(({ key, piece, containerStyle }) => {
            const source = getPieceImageSource(piece, baseUrl);

            if (source) {
              return (
                <View key={key} style={[styles.avatarLayer, containerStyle, styles.avatarLayerImageContainer]}>
                  <Image source={source} resizeMode="cover" style={styles.avatarLayerImage} />
                </View>
              );
            }

            if (piece.color) {
              return (
                <View
                  key={key}
                  style={[styles.avatarLayer, containerStyle, styles.avatarLayerColor, { backgroundColor: piece.color }]}
                />
              );
            }

            return null;
          })}

          {suggestion.top.text_logo ? (
            <Text style={[styles.layerTopText, styles.avatarLayerText]}>{suggestion.top.text_logo}</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.resultTitle}>{suggestion.analysis.verdict}</Text>
      <Text style={styles.resultMessage}>{suggestion.analysis.message}</Text>
      {suggestion.analysis.is_trending ? <Text style={styles.trendingText}>🔥 În tendințe!</Text> : null}
      {colorSummary ? (
        <View style={styles.colorSummaryPill}>
          <Text style={styles.colorSummaryText}>{colorSummary}</Text>
        </View>
      ) : null}

      <View style={styles.recommendedList}>
        {recommendedCards.map(card => {
          const source = getPieceImageSource(card.piece, baseUrl);
          const label = card.piece.category ?? card.label;

          return (
            <View key={card.label} style={styles.recommendedItem}>
              {source ? (
                <Image source={source} style={styles.recommendedImage} resizeMode="cover" />
              ) : (
                <View style={[styles.recommendedImage, styles.recommendedPlaceholder]}>
                  <Text style={styles.recommendedPlaceholderText}>Fără imagine</Text>
                </View>
              )}
              <Text style={styles.recommendedLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </>
  );
};

type CompareOutfitsProps = {
  mySuggestion: OutfitSuggestion;
  webSuggestion: WebOutfitSuggestion | null;
  baseUrl?: string;
};

const CompareOutfits: React.FC<CompareOutfitsProps> = ({ mySuggestion, webSuggestion, baseUrl = DEFAULT_BACKEND_URL }) => {
  const left = mySuggestion;
  const right = webSuggestion ?? {};

  const leftCards = [
    { label: 'Top', piece: left.top },
    { label: 'Pantaloni/ Fustă', piece: left.bottom },
    { label: 'Încălțăminte', piece: left.shoes },
  ];
  const rightCards = [
    { label: 'Top', piece: right.top },
    { label: 'Pantaloni/ Fustă', piece: right.bottom },
    { label: 'Încălțăminte', piece: right.shoes },
  ];

  const renderColumn = (title: string, cards: { label: string; piece?: OutfitPiece }[]) => (
    <View style={styles.compareColumn}>
      <Text style={styles.resultSectionTitle}>{title}</Text>
      {cards.map(({ label, piece }) => {
        const source = getPieceImageSource(piece, baseUrl);
        const displayLabel = piece?.category ?? label;
        return (
          <View key={label} style={styles.compareItem}>
            {source ? (
              <Image source={source} style={styles.compareImage} resizeMode="contain" />
            ) : (
              <View style={[styles.compareImage, styles.recommendedPlaceholder]}>
                <Text style={styles.recommendedPlaceholderText}>Fără imagine</Text>
              </View>
            )}
            <Text style={styles.recommendedLabel}>{displayLabel}</Text>
            {piece?.source_url ? (
              <TouchableOpacity
                onPress={() => WebBrowser.openBrowserAsync(String(piece.source_url))}
                style={styles.sourceLink}
              >
                <Text style={styles.sourceLinkText}>
                  Sursă: {piece.source_domain ?? 'link'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {/* Thumbnails pentru alternative (top 3 per categorie) */}
            {Array.isArray((piece as any)?.alternatives) && (piece as any).alternatives.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                {((piece as any).alternatives as OutfitPiece[]).slice(0, 2).map((alt, idx) => {
                  const altSrc = getPieceImageSource(alt, baseUrl);
                  return altSrc ? (
                    <TouchableOpacity key={idx} onPress={() => alt.source_url && WebBrowser.openBrowserAsync(String(alt.source_url))}>
                      <Image source={altSrc} style={{ width: 64, height: 64, borderRadius: 8 }} />
                    </TouchableOpacity>
                  ) : (
                    <View key={idx} style={[{ width: 64, height: 64, borderRadius: 8 }, styles.recommendedPlaceholder]} />
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.compareContainer}>
      {renderColumn('Din garderoba ta', leftCards)}
      {webSuggestion && (right.top || right.bottom || right.shoes) ? renderColumn('Propuneri din Web', rightCards) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 18,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    minWidth: 100,
  },
  filterButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonDisabled: {
    backgroundColor: '#e0e0e0',
    borderColor: '#d0d0d0',
  },
  filterText: {
    color: '#007AFF',
  },
  filterTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterTextDisabled: {
    color: '#909090',
  },
  silhouetteButton: {
    flexDirection: 'column',
    paddingTop: 8,
  },
  silhouetteImage: {
    width: 48,
    height: 72,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  silhouetteText: {
    marginTop: 0,
  },
  addButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  gridColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  itemContainer: {
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    width: '100%',
  },
  previewImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    marginBottom: 5,
    borderRadius: 8,
  },
  itemCategory: {
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
  },
  loading: {
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  resultSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  avatarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCard: {
    width: 220,
    height: 360,
    borderRadius: 20,
    backgroundColor: '#f6f7fb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSilhouette: {
    width: 220,
    height: 360,
  },
  avatarLayer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  avatarLayerImageContainer: {
    overflow: 'hidden',
    borderRadius: 18,
  },
  avatarLayerImage: {
    width: '110%',
    height: '110%',
    marginLeft: '-5%',
  },
  avatarLayerColor: {
    opacity: 0.75,
    borderRadius: 16,
  },
  layerTop: {
    top: 70,
    height: 120,
  },
  layerTopText: {
    top: 125,
  },
  layerBottom: {
    top: 180,
    height: 150,
  },
  layerShoes: {
    bottom: 25,
    height: 90,
  },
  avatarLayerText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#34495e',
  },
  trendingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22',
    marginTop: 10,
  },
  colorSummaryPill: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#eef0f5',
  },
  colorSummaryText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#c7d7ff',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  compareContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginTop: 10,
  },
  compareColumn: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
  },
  compareItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  compareImage: {
    width: '100%',
    height: 96,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#e3e5ec',
  },
  recommendedList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  recommendedItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  recommendedImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginBottom: 8,
  },
  recommendedPlaceholder: {
    backgroundColor: '#e3e5ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedPlaceholderText: {
    color: '#6b6d76',
    fontSize: 12,
    textAlign: 'center',
  },
  recommendedLabel: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  sourceLink: {
    marginTop: 2,
  },
  sourceLinkText: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  categoryButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  composeButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  composeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  mannequinPreviewContainer: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  mannequinPreview: {
    width: 220,
    height: 360,
    borderRadius: 20,
    backgroundColor: '#fafafa',
  },
  authHeader: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
    maxWidth: 150,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  loginText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});