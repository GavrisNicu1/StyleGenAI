import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Definim structura datelor primite de la backend
interface WebItem {
  path: string;
  title: string;
  source_url: string;
  source_domain?: string;
  alternatives?: any[];
}

interface WebOutfitProps {
  outfitData: {
    outerwear?: WebItem; // Optional (apare doar iarna/toamna)
    top?: WebItem;
    bottom?: WebItem;
    shoes?: WebItem;
  };
}

const WebOutfitList: React.FC<WebOutfitProps> = ({ outfitData }) => {
  // Daca nu avem date, nu afisam nimic
  if (!outfitData) return null;

  // Functie pentru a deschide link-ul in browser
  const handlePress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Nu pot deschide link-ul:", err));
    }
  };

  // Functie care randeaza un singur card de produs
  const renderItem = (item: WebItem | undefined, label: string) => {
    // Daca item-ul e undefined (ex: nu avem geaca vara), nu randam nimic
    if (!item) return null;

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.path }} 
            style={styles.image} 
            resizeMode="cover" 
          />
          <View style={styles.labelTag}>
            <Text style={styles.labelText}>{label}</Text>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          
          {item.source_domain && (
            <Text style={styles.domain}>{item.source_domain}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handlePress(item.source_url)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Vezi Produs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Propuneri din Web</Text>
      <Text style={styles.subHeader}>
        {outfitData.outerwear ? "Ținută completă de sezon" : "Ținută lejeră de vară"}
      </Text>
      
      <View style={styles.grid}>
        {/* Ordinea de afisare a pieselor */}
        {renderItem(outfitData.outerwear, "Geacă / Outerwear")}
        {renderItem(outfitData.top, "Top / Tricou")}
        {renderItem(outfitData.bottom, "Pantaloni")}
        {renderItem(outfitData.shoes, "Încălțăminte")}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16, // Putin spatiu lateral
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Imparte spatiul intre coloane
  },
  card: {
    // Calculam latimea: (Ecran total - padding total) / 2 coloane - spatiu mic intre ele
    width: (width - 32 - 12) / 2, 
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    // Umbre pentru iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Umbre pentru Android
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: {
    height: 160,
    width: '100%',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  labelTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoContainer: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    height: 36, // Inaltime fixa pentru max 2 linii de text
  },
  domain: {
    fontSize: 11,
    color: '#888',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#222',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto', // Impinge butonul jos
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default WebOutfitList;