// app/(tabs)/index.tsx (Versiunea 4.2 - Avatarul Digital)
import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Button, Image, Alert, 
  ActivityIndicator, ScrollView, TouchableOpacity 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import Modal from "react-native-modal";
import { FontAwesome } from '@expo/vector-icons';
// --- IMPORT NOU PENTRU AVATAR ---
import Svg, { Rect, Text as SvgText, Image as SvgImage } from 'react-native-svg';

// --- IMPORTURI PENTRU SILUETE ---
// Asigură-te că ai salvat cele 3 imagini în folderul local 'app/(tabs)/assets/'
import SilhouetteSuplu from './assets/silhouette_suplu.png';
import SilhouetteMediu from './assets/silhouette_mediu.png';
import SilhouetteRobust from './assets/silhouette_robust.png';
// --- SFÂRȘIT IMPORTURI ---

// --- VERIFICĂ IP-UL AICI (ex: 'http://192.168.100.182:5000') ---
const BACKEND_URL = 'http://192.168.100.182:5000'; // Asigură-te că IP-ul e corect

// --- DEFINIȚIILE CONSTANTELOR (AICI ERA EROAREA) ---
const CATEGORII = {
  îmbrăcăminte: ['Geacă', 'Tricou', 'Bluză', 'Pantalon', 'Fustă', 'Altul'],
  încălțăminte: ['Adidași', 'Pantofi', 'Ghete', 'Altele'],
};
const STILURI = ['Casual', 'Elegant', 'Sport'];
const SEZOANE = ['Vara', 'Toamna/Primavara', 'Iarna'];
const GENURI = ['Barbati', 'Femei', 'Copii'];
const SILUETE = ['Suplu', 'Mediu', 'Robust'];
// --- SFÂRȘIT DEFINIȚII ---

export default function App() {
  // --- DEFINIȚII STARE ---
  const [selectedStyle, setSelectedStyle] = useState('Casual');
  const [selectedSeason, setSelectedSeason] = useState('Toamna/Primavara');
  const [selectedGender, setSelectedGender] = useState('Barbati');
  const [selectedSilhouette, setSelectedSilhouette] = useState('Mediu');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [outfitSuggestion, setOutfitSuggestion] = useState(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isSourceModalVisible, setSourceModalVisible] = useState(false);
  const [currentCategoryType, setCurrentCategoryType] = useState('îmbrăcăminte');
  const [currentCategory, setCurrentCategory] = useState('');
  // --- SFÂRȘIT DEFINIȚII STARE ---

  const openCategoryModal = (type) => {
    setCurrentCategoryType(type);
    setCategoryModalVisible(true);
  };

  const onCategorySelect = (category) => {
    setCurrentCategory(category);
    setCategoryModalVisible(false);
    setSourceModalVisible(true);
  };

  const handleImagePick = async (source) => {
    setSourceModalVisible(false);
    let result;

    if (source === 'gallery') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Atenție!", "Avem nevoie de permisiunea ta pentru a accesa galeria.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsMultipleSelection: true,
      });
    } else {
      const permission = await Camera.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Atenție!", "Avem nevoie de permisiunea ta pentru a accesa camera.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    }

    if (!result.canceled) {
      const assets = result.assets || [result]; 
      if (!assets || assets.length === 0) return;
      const newItems = assets.map((asset, index) => ({
        id: `${Date.now().toString()}-${index}`, 
        uri: asset.uri,
        category: currentCategory
      }));
      setSelectedItems(prevItems => [...prevItems, ...newItems]);
    }
  };

  const handleDeleteItem = (idToDelete) => {
    setSelectedItems(prevItems => prevItems.filter(item => item.id !== idToDelete));
  };

  const handleGenerateOutfit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Eroare", "Te rog adaugă cel puțin un articol.");
      return;
    }
    const formData = new FormData();
    
    formData.append('style_filter', selectedStyle.toLowerCase());
    formData.append('season', selectedSeason.toLowerCase());
    formData.append('gender', selectedGender.toLowerCase());
    formData.append('silhouette', selectedSilhouette.toLowerCase());

    selectedItems.forEach((item, index) => {
      const uriParts = item.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('files', {
        uri: item.uri,
        name: `photo_${index}.${fileType}`,
        type: `image/${fileType}`,
      });
      formData.append('categories', item.category);
    });

    setIsLoading(true);
    setOutfitSuggestion(null);
    try {
      const response = await fetch(`${BACKEND_URL}/get_suggestion`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = await response.json();
      if (result.status === "success") {
        setOutfitSuggestion(result.outfit_suggestion);
      } else {
        setOutfitSuggestion({ error: result.message || "Eroare de la server." });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Eroare de Rețea", "Nu m-am putut conecta la serverul AI. Verifică IP-ul și dacă serverul Python rulează.");
    } finally {
      setIsLoading(false);
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
  };

  return (
    <ScrollView style={styles.page}>
      <View style={styles.container}>
        {/* --- Popup-uri --- */}
        <Modal isVisible={isCategoryModalVisible} onBackdropPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alege Categoria</Text>
            {CATEGORII[currentCategoryType].map(category => (
              <TouchableOpacity key={category} style={styles.categoryButton} onPress={() => onCategorySelect(category)}>
                <Text>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
        <Modal isVisible={isSourceModalVisible} onBackdropPress={() => setSourceModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alege Sursa</Text>
            <TouchableOpacity style={styles.categoryButton} onPress={() => handleImagePick('gallery')}>
              <Text>Galerie Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton} onPress={() => handleImagePick('camera')}>
              <Text>Cameră Foto</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* --- Ecranul Principal --- */}
        <Text style={styles.title}>Stilistul tău AI</Text>

        {!outfitSuggestion && (
          <>
            <Text style={styles.instructions}>1. Alege Sezonul:</Text>
            <View style={styles.filterContainer}>
              {SEZOANE.map(season => (
                <TouchableOpacity 
                  key={season} 
                  style={[styles.filterButton, selectedSeason === season && styles.filterButtonSelected]} 
                  onPress={() => setSelectedSeason(season)}>
                  <Text style={selectedSeason === season ? styles.filterTextSelected : styles.filterText}>{season}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.instructions}>2. Alege Genul:</Text>
            <View style={styles.filterContainer}>
              {GENURI.map(gender => (
                <TouchableOpacity 
                  key={gender} 
                  style={[
                    styles.filterButton, 
                    selectedGender === gender && styles.filterButtonSelected,
                    gender !== 'Barbati' && styles.filterButtonDisabled
                  ]} 
                  disabled={gender !== 'Barbati'}
                  onPress={() => setSelectedGender(gender)}>
                  <Text style={[
                    selectedGender === gender ? styles.filterTextSelected : styles.filterText,
                    gender !== 'Barbati' && styles.filterTextDisabled
                  ]}>{gender}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* --- Secțiunea de Siluetă (V4.0.2) --- */}
            <Text style={styles.instructions}>3. Alege Silueta:</Text>
            <View style={styles.filterContainer}>
              {SILUETE.map(silhouette => {
                let silhouetteImage;
                if (silhouette === 'Suplu') silhouetteImage = SilhouetteSuplu;
                else if (silhouette === 'Mediu') silhouetteImage = SilhouetteMediu;
                else silhouetteImage = SilhouetteRobust;

                return (
                  <TouchableOpacity 
                    key={silhouette} 
                    style={[styles.filterButton, styles.silhouetteButton, selectedSilhouette === silhouette && styles.filterButtonSelected]} 
                    onPress={() => setSelectedSilhouette(silhouette)}>
                    
                    <Image source={silhouetteImage} style={styles.silhouetteImage} />
                    
                    <Text style={[
                      selectedSilhouette === silhouette ? styles.filterTextSelected : styles.filterText,
                      styles.silhouetteText 
                    ]}>{silhouette}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Text style={styles.instructions}>4. Adaugă articolele:</Text>
            <View style={styles.addButtonsContainer}>
              <TouchableOpacity style={styles.addButton} onPress={() => openCategoryModal('îmbrăcăminte')}>
                <Text style={styles.addButtonText}>+ Îmbrăcăminte</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => openCategoryModal('încălțăminte')}>
                <Text style={styles.addButtonText}>+ Încălțăminte</Text>
              </TouchableOpacity>
            </View>

            {/* --- NOUA GRILĂ V4.0 (COLOANE) --- */}
            <View style={styles.gridContainer}>
              <View style={styles.gridColumn}>  
                <Text style={styles.gridTitle}>Îmbrăcăminte</Text>
                {selectedItems
                  .filter(item => CATEGORII.îmbrăcăminte.includes(item.category))
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
                  .filter(item => CATEGORII.încălțăminte.includes(item.category))
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
            <Button 
              title="Generează Ținuta"
              onPress={handleGenerateOutfit}
              disabled={isLoading}
            />
          </>
        )}
        
        {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />}

      {/* --- Zona de Rezultat (V4.2.1 - Cu Siluetă Reală) --- */}
        {outfitSuggestion && !isLoading && (
          <View style={styles.resultContainer}>
            {outfitSuggestion.error ? (
              <Text style={styles.resultTitle}>{outfitSuggestion.error}</Text>
            ) : (
              <>
                {/* --- AICI ESTE AVATARUL BAZAT PE SILUETĂ --- */}
                <Text style={styles.resultSectionTitle}>Ținuta Recomandată:</Text>
                
                <View style={styles.avatarContainer}>
                  <Svg height="350" width="200" viewBox="0 0 150 260">
                    
                    {/* 1. Imaginea Siluetei (selectată de utilizator) */}
                    <SvgImage
                        href={
                          selectedSilhouette === 'Suplu' ? SilhouetteSuplu :
                          selectedSilhouette === 'Mediu' ? SilhouetteMediu :
                          SilhouetteRobust
                        }
                        width="150"
                        height="260"
                        preserveAspectRatio="xMidYMid meet"
                    />

                    {/* 2. Tricoul (Top) - Culoarea de la AI */}
                    <Rect 
                      x="40" y="55" // Poziția peste trunchi
                      width="70" height="85" // Dimensiunea
                      fill={outfitSuggestion.top.color} 
                      opacity="0.7" // Ușoară transparență pentru a vedea silueta
                    />
                    {/* Afișăm textul dacă AI-ul l-a găsit */}
                    {outfitSuggestion.top.text_logo && (
                      <SvgText 
                        x="75" y="105" // Centrat pe tricou
                        fill="#FFFFFF" 
                        fontSize="18" 
                        fontWeight="bold"
                        textAnchor="middle">
                        {outfitSuggestion.top.text_logo}
                      </SvgText>
                    )}
                    
                    {/* 3. Pantalonii (Bottom) - Culoarea de la AI */}
                    <Rect 
                      x="40" y="140" // Poziția peste picioare
                      width="70" height="80" // Dimensiunea
                      fill={outfitSuggestion.bottom.color} 
                      opacity="0.7"
                    />
                    
                    {/* 4. Pantofii (Shoes) - Culoarea de la AI */}
                    <Rect x="35" y="220" width="35" height="20" fill={outfitSuggestion.shoes.color} opacity="0.8" />
                    <Rect x="80" y="220" width="35" height="20" fill={outfitSuggestion.shoes.color} opacity="0.8" />
                  </Svg>
                </View>
                {/* --- SFÂRȘIT AVATAR --- */}
              
                <Text style={styles.resultTitle}>{outfitSuggestion.analysis.verdict}</Text>
                <Text style={styles.resultMessage}>{outfitSuggestion.analysis.message}</Text>
                {outfitSuggestion.analysis.is_trending && (
                  <Text style={styles.trendingText}>🔥 În Tendințe!</Text>
                )}

                {/* TODO: Aici va veni Sfatul Pro (V4.3) */}
              </>
            )}

            <TouchableOpacity style={styles.resetButton} onPress={resetApp}>
              <Text style={styles.resetButtonText}>CREEAZĂ O ALTĂ ȚINUTĂ</Text>
            </TouchableOpacity>
          </View>
        )}  

            <TouchableOpacity style={styles.resetButton} onPress={resetApp}>
              <Text style={styles.resetButtonText}>CREEAZĂ O ALTĂ ȚINUTĂ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// --- Stiluri (V4.2 - Cu Avatar) ---
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, alignItems: 'center', paddingTop: 80, paddingBottom: 40, paddingHorizontal: 20, minHeight: '100%' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  instructions: { fontSize: 18, marginBottom: 15, alignSelf: 'flex-start' },
  filterContainer: { 
    flexDirection: 'row', 
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
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
    minWidth: 90,
  },
  filterButtonSelected: { 
    backgroundColor: '#007AFF', 
    borderColor: '#007AFF' 
  },
  filterButtonDisabled: {
    backgroundColor: '#e0e0e0',
    borderColor: '#d0d0d0',
  },
  filterText: { 
    color: '#007AFF' 
  },
  filterTextSelected: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  filterTextDisabled: {
    color: '#909090',
  },

  silhouetteButton: {
    flexDirection: 'column',
    paddingTop: 8,
  },
  silhouetteImage: {
    width: 40,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  silhouetteText: {
    marginTop: 0,
  },

  addButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  addButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8 },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  gridContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '48%',
    alignItems: 'center',
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
  previewImage: { width: 100, height: 100, resizeMode: 'contain', marginBottom: 5, borderRadius: 8 },
  itemCategory: { fontWeight: '500' },
  deleteButton: { position: 'absolute', top: 5, right: 5, backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white', zIndex: 10 },
  separator: { marginVertical: 20, height: 1, width: '80%', backgroundColor: '#ccc' },
  loading: { marginTop: 20 },
  
  resultContainer: { marginTop: 20, padding: 15, backgroundColor: '#fff', borderRadius: 8, width: '100%', alignItems: 'center' },
  resultSectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  
  // --- STIL NOU V4.2 ---
  avatarContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  // --- SFÂRȘIT STIL NOU ---

  resultTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' },
  resultMessage: { fontSize: 16, textAlign: 'center', marginTop: 10, color: '#34495e' },
  trendingText: { fontSize: 18, fontWeight: 'bold', color: '#e67e22', marginTop: 10 },
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
  modalContent: { backgroundColor: 'white', padding: 22, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  categoryButton: { width: '100%', padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center', marginBottom: 10 }
});