import React, { useEffect, useState } from 'react';

import {

  ActivityIndicator,

  Alert,

  Image,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
  Platform,
} from 'react-native';

import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { LinearGradient } from 'expo-linear-gradient';

import * as WebBrowser from 'expo-web-browser';

import { Camera } from 'expo-camera';

import Modal from 'react-native-modal';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { FontAwesome, Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import { ThemedView } from '@/components/themed-view';

import { Colors } from '@/constants/theme';

import { API_BASE_URL, resolveBackendAssetUrl } from '@/constants/config';

import SilhouetteSuplu from './assets/silhouette_suplu.png';

import SilhouetteMediu from './assets/silhouette_mediu.png';

import SilhouetteRobust from './assets/silhouette_robust.png';

import WebOutfitList, { WebItem } from '../../components/WebOutfitList';



const DEFAULT_BACKEND_URL = API_BASE_URL;

type ActionButtonThemeName = 'luxury' | 'minimal';

// Schimbă între 'luxury' și 'minimal' pentru stilul butoanelor principale.
const ACTION_BUTTON_THEME: ActionButtonThemeName = 'luxury';



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



const MEN_CATEGORY_PRESETS: Record<StyleOption, { vara: readonly string[]; rece: readonly string[] }> = {

  Casual: {

    vara: [

      'Vesta',

      'Cămașă',

      'Compleuri și Treninguri',

      'Bluze și Hanorace',

      'Tricou',

      'Pantalon',

      'Blugi',

      'Pantaloni scurți',

    ],

    rece: [

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

    ],

  },

  Elegant: {

    vara: [

      'Costume',

      'Sacouri',

      'Cămăși',

      'Pantalon',

    ],

    rece: [

      'Paltoane',

      'Geci',

      'Costume',

      'Sacouri',

      'Cămăși',

      'Malete și Pulovere',

      'Pantalon',

    ],

  },

  Sport: {

    vara: [

      'Veste',

      'Treninguri',

      'Tricouri',

      'Bluze',

      'Pantalon',

      'Colanți',

      'Pantaloni scurți',

    ],

    rece: [

      'Geci',

      'Veste',

      'Treninguri',

      'Tricouri',

      'Bluze',

      'Pantalon',

      'Colanți',

      'Pantaloni scurți',

    ],

  },

};





function getCategories({ categoryType, season, style, gender }: {

  categoryType: CategoryType;

  season: SeasonOption;

  style: StyleOption;

  gender: GenderOption;

}): readonly string[] {

  if (categoryType === 'încălțăminte') {

    return FOOTWEAR_CATEGORIES;

  }

  if (gender === 'Barbati') {

    const seasonGroup = season === 'Vara' ? 'vara' : 'rece';

    return MEN_CATEGORY_PRESETS[style][seasonGroup];

  }

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

  category: string;

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

  outerwear?: OutfitPiece;

  analysis: OutfitAnalysis;

};



type OutfitResult = OutfitSuggestion | { error: string };

type FeedbackStatus = 'liked' | 'disliked' | null;

type PreferenceSummary = {
  total: number;
  liked: number;
  disliked: number;
  top_categories: Array<{ name: string; score: number }>;
  top_colors: Array<{ name: string; score: number }>;
};



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

  outerwear?: OutfitPiece;

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

  // Mapping for complete suits (sus+jos)
  if (lowerCategory.includes('costum')) {
    return 'Costum';
  }

 

  // Mapping for clothing items (îmbrăcăminte) -> "Top"

  if (lowerCategory.includes('tricou') || lowerCategory.includes('bluză') ||

      lowerCategory.includes('cămașă') || lowerCategory.includes('geacă') ||

      lowerCategory.includes('sacou') || lowerCategory.includes('palton') ||

      lowerCategory === 'altul') {

    return 'Top';

  }

 

  // Mapping for bottoms (pantaloni/fuste) -> "Pantalon"

  if (lowerCategory.includes('pantalon') || lowerCategory.includes('fustă') ||

      lowerCategory.includes('shorts') || lowerCategory.includes('scurți') ||

      lowerCategory.includes('blugi') || lowerCategory.includes('jeans')) {

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

  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>(null);

  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [preferenceSummary, setPreferenceSummary] = useState<PreferenceSummary | null>(null);

  const [webOutfit, setWebOutfit] = useState<WebOutfitSuggestion | null>(null);

  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const [isSourceModalVisible, setSourceModalVisible] = useState(false);

  const [currentCategoryType, setCurrentCategoryType] = useState<CategoryType>('îmbrăcăminte');

  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

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



  const onCategorySelect = (category: string) => {

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

        mediaTypes: ImagePicker.MediaTypeOptions.Images,

        quality: 1,

        allowsMultipleSelection: true,

        selectionLimit: 0,

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



  // Heuristici robuste: costumele sunt set complet (sus+jos).

  const isSuit = (cat: string) => /costum/i.test(String(cat));

  const isBottom = (cat: string) => /pantalon|fustă|fusta|blugi|jeans/i.test(String(cat));

  const isOuterwear = (cat: string) => /geac|jachet|palto|coat|trench|mantou/i.test(String(cat));

  const winterRequiresOuterwear = selectedSeason === 'Iarna';

  const isTop = (cat: string) => !isBottom(cat) || isSuit(cat);

  const isBottomLike = (cat: string) => isBottom(cat) || isSuit(cat);

  const topsCount = selectedItems.filter(i => i.categoryType === 'îmbrăcăminte' && isTop(i.category)).length;

  const bottomsCount = selectedItems.filter(i => i.categoryType === 'îmbrăcăminte' && isBottomLike(i.category)).length;

  const outerwearCount = selectedItems.filter(i => i.categoryType === 'îmbrăcăminte' && isOuterwear(i.category)).length;

  const shoesCount = selectedItems.filter(i => i.categoryType === 'încălțăminte').length;

  const canGenerateOutfit = topsCount >= 5 && bottomsCount >= 5 && shoesCount >= 5 && (!winterRequiresOuterwear || outerwearCount >= 3);



  const getMissingInventoryMessages = () => {

    const missing: string[] = [];

    if (topsCount < 5) missing.push(`mai ai nevoie de ${5 - topsCount} top-uri (Tricou/Bluză/Geacă/Costum)`);

    if (bottomsCount < 5) missing.push(`mai ai nevoie de ${5 - bottomsCount} piese jos (Pantalon/Fustă/Costum)`);

    if (shoesCount < 5) missing.push(`mai ai nevoie de ${5 - shoesCount} perechi încălțăminte`);

    if (winterRequiresOuterwear && outerwearCount < 3) {
      missing.push(`mai ai nevoie de ${3 - outerwearCount} articole geci/paltoane (minim 3 iarna)`);
    }

    return missing;

  };



  const appendNativeFilesToFormData = (formData: FormData) => {

    selectedItems.forEach((item, index) => {

      const fileType = item.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';

      const file = {

        uri: item.uri,

        name: `photo_${index}.${fileType}`,

        type: `image/${fileType}`,

      } as const;

      formData.append('files', file as unknown as Blob);

      formData.append('categories', mapCategoryToBackend(item.category));

      formData.append('category_labels', item.category);

    });

  };



  const appendWebFilesToFormData = async (formData: FormData) => {

    for (let index = 0; index < selectedItems.length; index++) {

      const item = selectedItems[index];

      try {

        const resp = await fetch(item.uri);

        const blob = await resp.blob();

        const mime = blob.type || 'image/jpeg';

        const ext = (mime.split('/')[1] || 'jpg').toLowerCase();

        const file = new File([blob], `photo_${index}.${ext}`, { type: mime });

        formData.append('files', file);

        formData.append('categories', mapCategoryToBackend(item.category));

        formData.append('category_labels', item.category);

      } catch (e) {

        console.warn('Failed to make File from URI', item.uri, e);

      }

    }

  };



  const buildGenerateFormData = async () => {

    const formData = new FormData();

    formData.append('style_filter', selectedStyle.toLowerCase());

    formData.append('season', selectedSeason.toLowerCase());

    formData.append('gender', selectedGender.toLowerCase());

    formData.append('silhouette', selectedSilhouette.toLowerCase());



    if (Platform.OS === 'web') {

      await appendWebFilesToFormData(formData);

    } else {

      appendNativeFilesToFormData(formData);

    }

    return formData;

  };



  const applyGenerateResult = (result: BackendResponse) => {

    if (isBackendSuccess(result)) {

      const normalized: OutfitSuggestion = {

        top: normalizePiece(result.outfit_suggestion.top),

        bottom: normalizePiece(result.outfit_suggestion.bottom),

        shoes: normalizePiece(result.outfit_suggestion.shoes),

        outerwear: result.outfit_suggestion.outerwear ? normalizePiece(result.outfit_suggestion.outerwear) : undefined,

        analysis: result.outfit_suggestion.analysis,

      };

      setOutfitSuggestion(normalized);

      setOutfitSaved(false);

      setFeedbackStatus(null);

      setPreferenceSummary(null);

      fetchWebAlternative({

        style: selectedStyle,

        season: selectedSeason,

        gender: selectedGender,

        trendColors: normalized.analysis?.trend_colors_used,

        pieceColors: normalized.analysis?.piece_colors,

      });

      return;

    }

    if (isBackendError(result)) {

      setOutfitSuggestion({ error: result.message ?? 'Eroare de la server.' });

      return;

    }

    setOutfitSuggestion({ error: 'Răspuns neașteptat de la server.' });

  };



  const handleGenerateOutfit = async () => {

    if (!canGenerateOutfit) {

      const missing = getMissingInventoryMessages();

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



    console.log('[DEBUG] sending', selectedItems.length, 'items');

    const formData = await buildGenerateFormData();

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

      applyGenerateResult(result);

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

              .map(([key, value]) => [key, String(value).toLowerCase()])

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

    setFeedbackStatus(null);

    setPreferenceSummary(null);

  };



  const loadPreferenceSummary = async (token: string) => {

    try {

      const response = await fetch(`${backendUrl}/feedback/preferences`, {

        method: 'GET',

        headers: {

          'Authorization': `Bearer ${token}`,

        },

      });

      const payload = await response.json();

      if (payload?.status === 'success' && payload?.summary) {

        setPreferenceSummary(payload.summary as PreferenceSummary);

      }

    } catch (error) {

      console.warn('feedback/preferences failed', error);

    }

  };



  const submitOutfitFeedback = async (liked: boolean) => {

    if (!isAuthenticated || !outfitSuggestion || 'error' in outfitSuggestion || feedbackLoading) {

      return;

    }



    try {

      const token = await AsyncStorage.getItem('auth_token');

      if (!token) {

        Alert.alert('Eroare', 'Trebuie să fii autentificat pentru feedback.');

        return;

      }



      setFeedbackLoading(true);



      const response = await fetch(`${backendUrl}/feedback/outfit`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`,

        },

        body: JSON.stringify({

          is_liked: liked,

          style: selectedStyle,

          season: selectedSeason,

          gender: selectedGender,

          top_category: String(outfitSuggestion.top?.category || ''),

          bottom_category: String(outfitSuggestion.bottom?.category || ''),

          shoes_category: String(outfitSuggestion.shoes?.category || ''),

          top_color: String(outfitSuggestion.top?.color_name || outfitSuggestion.top?.color || ''),

          bottom_color: String(outfitSuggestion.bottom?.color_name || outfitSuggestion.bottom?.color || ''),

          shoes_color: String(outfitSuggestion.shoes?.color_name || outfitSuggestion.shoes?.color || ''),

        }),

      });



      const payload = await response.json();

      if (response.ok && payload?.status === 'success') {

        setFeedbackStatus(liked ? 'liked' : 'disliked');

        await loadPreferenceSummary(token);

      } else {

        Alert.alert('Eroare', payload?.message || 'Nu s-a putut salva feedback-ul.');

      }

    } catch (error) {

      Alert.alert('Eroare', 'Nu s-a putut salva feedback-ul.');

    } finally {

      setFeedbackLoading(false);

    }

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

      if (!firstPiece?.path) {

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

          outerwear: outfitSuggestion.outerwear,

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

    <ThemedView style={{ flex: 1 }}>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.container}>

        {/* Auth Header */}

        <View style={styles.authHeader}>

          {isAuthenticated && user ? (

            <TouchableOpacity

              onPress={() => router.push('/(tabs)/profile')}

              style={styles.profileButton}

            >

              <Ionicons name="person-circle" size={24} color="#115740" />

            </TouchableOpacity>

          ) : (

            <TouchableOpacity

              onPress={() => router.push('/auth/login')}

              style={styles.loginButton}

            >

              <Ionicons name="person-outline" size={20} color="#115740" />

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

                {winterRequiresOuterwear ? ` | Geci/Paltoane: ${outerwearCount} / 3` : ''}

              </Text>

              {!canGenerateOutfit && (

                <Text style={{ fontSize: 12, color: '#e74c3c' }}>

                  {winterRequiresOuterwear
                    ? 'Adaugă suficiente articole: minim 5 Top, 5 piese jos, 5 încălțăminte și 3 Geci/Paltoane (iarna).'
                    : 'Adaugă suficiente articole (minim 5 în fiecare categorie) pentru a genera o ținută bazată pe tendințe.'}

                </Text>

              )}

            </View>

            <ActionButton
              title="Generează ținuta"
              onPress={handleGenerateOutfit}
              disabled={isLoading || !canGenerateOutfit}
              loading={isLoading}
              icon="sparkles-outline"
              variant="primary"
              style={styles.generateButton}
            />

          </>

        )}



        {isLoading && <ActivityIndicator size="large" color={Colors.light.primary} style={styles.loading} />}

        {outfitSuggestion && !isLoading && (

          <View style={[styles.resultContainer, { backgroundColor: Colors.light.card }]}>

            {'error' in outfitSuggestion ? (

              <>

                <Text style={styles.resultTitle}>{outfitSuggestion.error}</Text>

                <ActionButton
                  title="Încearcă din nou"
                  onPress={resetApp}
                  variant="sunset"
                  icon="refresh-outline"
                  style={styles.resultActionButton}
                />

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

                  <ActionButton
                    title={outfitSaved ? 'Salvat ✓' : 'Salvează în Profil'}
                    onPress={handleSaveToHistory}
                    disabled={outfitSaved}
                    icon={outfitSaved ? 'checkmark-circle' : 'heart-outline'}
                    variant={outfitSaved ? 'outline' : 'sunset'}
                    style={styles.resultActionButton}
                  />

                )}



                <ActionButton
                  title="Creează o altă ținută"
                  onPress={resetApp}
                  icon="shuffle-outline"
                  variant="outline"
                  style={[styles.resultActionButton, styles.resultSecondaryButton]}
                />

              </>

            )}

          </View>

        )}

      </View>

      </ScrollView>

    </ThemedView>

  );

                {isAuthenticated && (

                  <View style={styles.feedbackRow}>

                    <ActionButton
                      title={feedbackStatus === 'liked' ? 'Îți place ✓' : 'Îmi place'}
                      onPress={() => submitOutfitFeedback(true)}
                      disabled={feedbackLoading}
                      icon="thumbs-up-outline"
                      variant={feedbackStatus === 'liked' ? 'sunset' : 'outline'}
                      style={styles.feedbackButton}
                    />

                    <ActionButton
                      title={feedbackStatus === 'disliked' ? 'Nu-ți place ✓' : 'Nu îmi place'}
                      onPress={() => submitOutfitFeedback(false)}
                      disabled={feedbackLoading}
                      icon="thumbs-down-outline"
                      variant={feedbackStatus === 'disliked' ? 'sunset' : 'outline'}
                      style={styles.feedbackButton}
                    />

                  </View>

                )}

                {isAuthenticated && ((preferenceSummary?.total ?? 0) > 0) && (

                  <View style={styles.feedbackSummaryCard}>

                    <Text style={styles.feedbackSummaryTitle}>Preferințele tale (din feedback)</Text>

                    <Text style={styles.feedbackSummaryText}>
                      {`Total: ${preferenceSummary!.total} | Like: ${preferenceSummary!.liked} | Dislike: ${preferenceSummary!.disliked}`}
                    </Text>

                    {preferenceSummary!.top_categories?.length ? (
                      <Text style={styles.feedbackSummaryText}>
                        {`Categorii preferate: ${preferenceSummary!.top_categories.map(c => c.name).join(', ')}`}
                      </Text>
                    ) : null}

                    {preferenceSummary!.top_colors?.length ? (
                      <Text style={styles.feedbackSummaryText}>
                        {`Culori preferate: ${preferenceSummary!.top_colors.map(c => c.name).join(', ')}`}
                      </Text>
                    ) : null}

                  </View>

                )}

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

type ActionButtonVariant = 'primary' | 'sunset' | 'outline';

type ActionButtonThemePalette = {
  shadowColor: string;
  gradients: Record<Exclude<ActionButtonVariant, 'outline'>, readonly [string, string]>;
  outlineBackground: string;
  outlineBorder: string;
  fillText: string;
  outlineText: string;
};

const ACTION_BUTTON_THEMES: Record<ActionButtonThemeName, ActionButtonThemePalette> = {
  luxury: {
    shadowColor: '#4A3512',
    gradients: {
      primary: ['#75521E', '#C8A867'],
      sunset: ['#9A2E2E', '#D8B165'],
    },
    outlineBackground: '#FFF9EE',
    outlineBorder: '#9B7B45',
    fillText: '#FFF8EE',
    outlineText: '#6E4B1E',
  },
  minimal: {
    shadowColor: '#102A43',
    gradients: {
      primary: ['#0F4C81', '#1B7CC7'],
      sunset: ['#3E5366', '#6E879C'],
    },
    outlineBackground: '#FFFFFF',
    outlineBorder: '#0F4C81',
    fillText: '#FFFFFF',
    outlineText: '#0F4C81',
  },
};

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ActionButtonVariant;
  style?: StyleProp<ViewStyle>;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  variant = 'primary',
  style,
}) => {
  const isDisabled = disabled || loading;
  const palette = ACTION_BUTTON_THEMES[ACTION_BUTTON_THEME];

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={isDisabled ? undefined : onPress}
        activeOpacity={isDisabled ? 1 : 0.85}
        style={[
          styles.actionButtonBase,
          styles.actionButtonOutline,
          { shadowColor: palette.shadowColor, backgroundColor: palette.outlineBackground, borderColor: palette.outlineBorder },
          isDisabled && styles.primaryBtnDisabled,
          style,
        ]}
      >
        <View style={styles.actionButtonContent}>
          {loading ? (
            <ActivityIndicator size="small" color={palette.outlineText} />
          ) : (
            <>
              {icon && <Ionicons name={icon} size={18} color={palette.outlineText} style={styles.actionButtonIcon} />}
              <Text style={[styles.actionButtonText, styles.actionButtonOutlineText, { color: palette.outlineText }]}>{title}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={isDisabled ? 1 : 0.85}
      style={[styles.actionButtonBase, { shadowColor: palette.shadowColor }, isDisabled && styles.primaryBtnDisabled, style]}
    >
      <LinearGradient
        colors={palette.gradients[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.actionButtonGradient}
      >
        <View style={styles.actionButtonContent}>
          {loading ? (
            <ActivityIndicator size="small" color={palette.fillText} />
          ) : (
            <>
              {icon && <Ionicons name={icon} size={18} color={palette.fillText} style={styles.actionButtonIcon} />}
              <Text style={[styles.actionButtonText, { color: palette.fillText }]}>{title}</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};



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

  return resolveBackendAssetUrl(path, baseUrl) || null;

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

    ...(suggestion.outerwear ? [{ key: 'outerwear' as const, piece: suggestion.outerwear, containerStyle: styles.layerOuterwear }] : []),

    { key: 'bottom' as const, piece: suggestion.bottom, containerStyle: styles.layerBottom },

    { key: 'shoes' as const, piece: suggestion.shoes, containerStyle: styles.layerShoes },

  ];



  const recommendedCards = [

    { label: 'Top', piece: suggestion.top },

    ...(suggestion.outerwear ? [{ label: 'Strat exterior', piece: suggestion.outerwear }] : []),

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

    ...(left.outerwear ? [{ label: 'Strat exterior', piece: left.outerwear }] : []),

    { label: 'Pantaloni/ Fustă', piece: left.bottom },

    { label: 'Încălțăminte', piece: left.shoes },

  ];

  const rightCards = [

    { label: 'Top', piece: right.top },

    ...(right.outerwear ? [{ label: 'Strat exterior', piece: right.outerwear }] : []),

    { label: 'Pantaloni/ Fustă', piece: right.bottom },

    { label: 'Încălțăminte', piece: right.shoes },

  ];



  const openSource = (url?: string | null) => {

    if (url) {

      WebBrowser.openBrowserAsync(String(url));

    }

  };



  const renderAlternatives = (piece?: OutfitPiece) => {

    const alternatives = Array.isArray((piece as any)?.alternatives)

      ? ((piece as any).alternatives as OutfitPiece[]).slice(0, 2)

      : [];



    if (alternatives.length === 0) {

      return null;

    }



    return (

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>

        {alternatives.map((alt) => {

          const altSrc = getPieceImageSource(alt, baseUrl);

          const altKey = String(alt.source_url ?? alt.path ?? alt.title ?? 'alternative');

          return altSrc ? (

            <TouchableOpacity key={altKey} onPress={() => openSource(alt.source_url)}>

              <Image source={altSrc} style={{ width: 64, height: 64, borderRadius: 8 }} />

            </TouchableOpacity>

          ) : (

            <View key={altKey} style={[{ width: 64, height: 64, borderRadius: 8 }, styles.recommendedPlaceholder]} />

          );

        })}

      </View>

    );

  };



  const renderCompareCard = ({ label, piece }: { label: string; piece?: OutfitPiece }) => {

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

            onPress={() => openSource(piece.source_url)}

            style={styles.sourceLink}

          >

            <Text style={styles.sourceLinkText}>

              Sursă: {piece.source_domain ?? 'link'}

            </Text>

          </TouchableOpacity>

        ) : null}

        {renderAlternatives(piece)}

      </View>

    );

  };



  const renderColumn = (title: string, cards: { label: string; piece?: OutfitPiece }[]) => (

    <View style={styles.compareColumn}>

      <Text style={styles.resultSectionTitle}>{title}</Text>

      {cards.map(renderCompareCard)}

    </View>

  );



  return (

    <View style={styles.compareContainer}>

      {renderColumn('Din garderoba ta', leftCards)}

      {webSuggestion && (right.top || right.bottom || right.shoes || right.outerwear) ? renderColumn('Propuneri din Web', rightCards) : null}

    </View>

  );

};



const styles = StyleSheet.create({

  page: {

    flex: 1,

    backgroundColor: '#F7F5F0', // Gucci Cream

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

    color: '#115740', // Gucci Green Title

  },

  instructions: {

    fontSize: 18,

    marginBottom: 15,

    alignSelf: 'flex-start',

    color: '#1E2A3B', // Gucci Navy

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

    borderColor: '#D4AF37', // Auriu puțin mai intens decât fundalul crem

    alignItems: 'center',

    minWidth: 100,

  },

  filterButtonSelected: {

    backgroundColor: '#115740', // Gucci Green Selected

    borderColor: '#115740',

  },

  filterButtonDisabled: {

    backgroundColor: '#e0e0e0',

    borderColor: '#d0d0d0',

  },

  filterText: {

    color: '#115740', // Gucci Green Text

  },

  filterTextSelected: {

    color: '#F7F5F0', // Cream Text

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

    backgroundColor: '#115740', // Gucci Green

    padding: 15,

    borderRadius: 8,

  },

  addButtonText: {

    color: '#F7F5F0',

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
  layerOuterwear: {
    top: 62,
    height: 130,
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

  actionButtonBase: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },

  actionButtonGradient: {
    minHeight: 54,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtonIcon: {
    marginRight: 8,
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  actionButtonOutline: {
    borderWidth: 1.5,
  },

  actionButtonOutlineText: {
    fontWeight: '800',
  },

  generateButton: {
    width: '100%',
    marginTop: 4,
    marginBottom: 6,
  },

  resultActionButton: {
    marginTop: 16,
  },

  resultSecondaryButton: {
    marginBottom: 24,
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

  feedbackRow: {

    marginTop: 16,

    width: '100%',

    flexDirection: 'row',

    gap: 10,

  },

  feedbackButton: {

    flex: 1,

  },

  feedbackSummaryCard: {

    marginTop: 12,

    width: '100%',

    backgroundColor: '#f7f8fa',

    borderRadius: 12,

    paddingVertical: 10,

    paddingHorizontal: 12,

    borderWidth: 1,

    borderColor: '#e3e6eb',

  },

  feedbackSummaryTitle: {

    fontSize: 14,

    fontWeight: '700',

    color: '#1d2a35',

    marginBottom: 4,

  },

  feedbackSummaryText: {

    fontSize: 12,

    color: '#46535f',

    marginTop: 2,

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

    backgroundColor: '#115740', // Gucci Green

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

    justifyContent: 'center',

    padding: 6,

    backgroundColor: '#fff',

    borderRadius: 20, // Smaller circle

    borderWidth: 1,

    borderColor: '#C5A059', // Gucci Gold

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,

    minWidth: 36,

    minHeight: 36,

  },

  profileButtonText: {

    display: 'none', // Hide text style just in case

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

    borderColor: '#C5A059', // Gucci Gold

  },

  loginText: {

    color: '#115740', // Gucci Green

    fontWeight: '600',

  },

});