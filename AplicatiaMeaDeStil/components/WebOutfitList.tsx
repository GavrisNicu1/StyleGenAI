import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Dimensions } from 'react-native';

// Mapare site-uri către logo-uri locale (PNG/SVG)
const SITE_LOGOS: Record<string, any> = {
  'Massimo Dutti': require('../assets/site_logos/massimodutti.png'),
  'Seroussi': require('../assets/site_logos/seroussi.png'),
  'Hugo Boss': require('../assets/site_logos/hugoboss.png'),
  'Tommy Hilfiger': require('../assets/site_logos/tommyhilfiger.png'),
  'AboutYou': require('../assets/site_logos/aboutyou.png'),
  'Nike': require('../assets/site_logos/nike.png'),
  'Adidas': require('../assets/site_logos/adidas.png'),
  'Under Armour': require('../assets/site_logos/underarmour.png'),
  'Zara': require('../assets/site_logos/zara.png'),
  'Ralph Lauren': require('../assets/site_logos/ralphlauren.png'),
};

// Mapare stil -> site-uri (sincronizată cu backend)
const STYLE_SITE_MAP: Record<string, Array<{ name: string; url: string }>> = {
  elegant: [
    { name: 'AboutYou', url: 'https://www.aboutyou.ro/' },
    { name: 'Epantofi', url: 'https://www.epantofi.ro/' },
    { name: 'FashionDays', url: 'https://www.fashiondays.ro/' },
    { name: 'Answear', url: 'https://answear.ro/' },
    { name: 'Massimo Dutti', url: 'https://www.massimodutti.com/ro/' },
    { name: 'Seroussi', url: 'https://seroussi.ro/' },
    { name: 'Hugo Boss', url: 'https://www.hugoboss.com/ro/' },
    { name: 'Tommy Hilfiger', url: 'https://ro.tommy.com/' },
  ],
  sport: [
    { name: 'AboutYou', url: 'https://www.aboutyou.ro/' },
    { name: 'Epantofi', url: 'https://www.epantofi.ro/' },
    { name: 'FashionDays', url: 'https://www.fashiondays.ro/' },
    { name: 'Answear', url: 'https://answear.ro/' },
    { name: 'Nike', url: 'https://www.nike.com/ro/' },
    { name: 'Adidas', url: 'https://www.adidas.ro/' },
    { name: 'Under Armour', url: 'https://www.underarmour.ro/' },
  ],
  casual: [
    { name: 'AboutYou', url: 'https://www.aboutyou.ro/' },
    { name: 'Epantofi', url: 'https://www.epantofi.ro/' },
    { name: 'FashionDays', url: 'https://www.fashiondays.ro/' },
    { name: 'Answear', url: 'https://answear.ro/' },
    { name: 'Tommy Hilfiger', url: 'https://ro.tommy.com/' },
    { name: 'Zara', url: 'https://www.zara.com/ro/' },
    { name: 'Ralph Lauren', url: 'https://www.ralphlauren.eu/ro/' },
  ],
};
// Mapare coduri de culoare AboutYou
const ABOUTYOU_COLOR_CODES: Record<string, string> = {
  alb: '38935',
  negru: '38932',
  albastru: '38920',
  bleumarin: '38920',
  gri: '38925',
  bej: '38919',
  verde: '38926',
  roz: '38930',
  rosu: '38929',
};

// Helper pentru generarea link-ului filtrat (simplificat, se poate extinde)
// Mapare între valorile generice și denumirile reale
const CATEGORY_MAP: Record<string, string> = {
  top: 'tricou',
  bottom: 'pantalon',
  shoes: 'adidasi',
  outerwear: 'geaca',
};

const CATEGORY_PATHS: Record<string, { pantalon: string; geaca: string; adidasi: string; default: string }> = {
  'Massimo Dutti': {
    pantalon: 'https://www.massimodutti.com/ro/men/clothing/trousers-c1030004.html',
    geaca: 'https://www.massimodutti.com/ro/men/clothing/jackets-c1030006.html',
    adidasi: 'https://www.massimodutti.com/ro/men/shoes/all-shoes-c1030010.html',
    default: 'https://www.massimodutti.com/ro/men/clothing/t-shirts-c1030002.html',
  },
  'Tommy Hilfiger': {
    pantalon: 'https://ro.tommy.com/ro/barbati/imbracaminte/pantaloni.html',
    geaca: 'https://ro.tommy.com/ro/barbati/imbracaminte/geci-si-jachete.html',
    adidasi: 'https://ro.tommy.com/ro/barbati/incaltaminte/adidasi-si-sneakers.html',
    default: 'https://ro.tommy.com/ro/barbati/imbracaminte/tricouri.html',
  },
  Nike: {
    pantalon: 'https://www.nike.com/ro/w/mens-pants-38fyznik1',
    geaca: 'https://www.nike.com/ro/w/mens-tops-shirts-9om13znik1',
    adidasi: 'https://www.nike.com/ro/w/mens-shoes-nik1zy7ok',
    default: 'https://www.nike.com/ro/w/mens-tops-shirts-9om13znik1',
  },
  Adidas: {
    pantalon: 'https://www.adidas.ro/barbati-pantaloni',
    geaca: 'https://www.adidas.ro/barbati-tricouri',
    adidasi: 'https://www.adidas.ro/barbati-pantofi',
    default: 'https://www.adidas.ro/barbati-tricouri',
  },
  'Under Armour': {
    pantalon: 'https://www.underarmour.ro/barbati/pantaloni',
    geaca: 'https://www.underarmour.ro/barbati/tricouri',
    adidasi: 'https://www.underarmour.ro/barbati/pantofi',
    default: 'https://www.underarmour.ro/barbati/tricouri',
  },
  Zara: {
    pantalon: 'https://www.zara.com/ro/ro/barbati-pantaloni-l838.html',
    geaca: 'https://www.zara.com/ro/ro/barbati-geci-l640.html',
    adidasi: 'https://www.zara.com/ro/ro/barbati-pantofi-l839.html',
    default: 'https://www.zara.com/ro/ro/barbati-tricouri-l855.html',
  },
  'Ralph Lauren': {
    pantalon: 'https://www.ralphlauren.eu/ro/en/men/clothing/1020?prefn1=CategoryCode&prefv1=Trousers',
    geaca: 'https://www.ralphlauren.eu/ro/men-clothing-jackets',
    adidasi: 'https://www.ralphlauren.eu/ro/men-shoes',
    default: 'https://www.ralphlauren.eu/ro/men-clothing-t-shirts',
  },
};

const DIRECT_URL_SITES = new Set(['Seroussi', 'Hugo Boss']);

function mapCategory(item: WebItem): string {
  const rawCategory = item.category?.toLowerCase() || '';
  return CATEGORY_MAP[rawCategory] || rawCategory;
}

function extractColor(item: WebItem): string {
  const colorRegex = /(alb|albastru|negru|rosu|gri|bej|verde|roz|mov|portocaliu|galben)/;
  const match = colorRegex.exec(item.title?.toLowerCase() ?? '');
  return match?.[1] || '';
}

function resolveMappedCategoryUrl(site: { name: string; url: string }, category: string): string | null {
  const paths = CATEGORY_PATHS[site.name];
  if (!paths) {
    return null;
  }
  if (category === 'pantalon') return paths.pantalon;
  if (category === 'geaca') return paths.geaca;
  if (category === 'adidasi') return paths.adidasi;
  return paths.default;
}

function buildSearchUrl(base: string, category: string, color: string): string {
  let query = category;
  if (color) query += ` ${color}`;
  return `${base}${encodeURIComponent(query)}`;
}

function buildAboutYouUrl(category: string, color: string): string {
  let base = 'https://www.aboutyou.ro/c/barbati/haine/tricouri-20324';
  if (category === 'pantalon') base = 'https://www.aboutyou.ro/c/barbati/haine/pantaloni-20330';
  else if (category === 'geaca') base = 'https://www.aboutyou.ro/c/barbati/haine/geci-20320';
  else if (category === 'adidasi') base = 'https://www.aboutyou.ro/c/barbati/pantofi/sneakers-20345';

  const colorCode = ABOUTYOU_COLOR_CODES[color] || '';
  if (colorCode && (category === 'pantalon' || category === 'tricou')) return `${base}?color=${colorCode}`;
  if (color && (category === 'pantalon' || category === 'tricou')) return `${base}?color=${encodeURIComponent(color)}`;
  return base;
}

function buildFilteredUrl(site: { name: string; url: string }, item: WebItem, style: string) {
  const category = mapCategory(item);
  const color = extractColor(item);

  if (site.name === 'AboutYou') {
    return buildAboutYouUrl(category, color);
  }
  if (site.name === 'Answear') {
    return buildSearchUrl('https://answear.ro/s?q=', category, color);
  }
  if (site.name === 'FashionDays') {
    return buildSearchUrl('https://www.fashiondays.ro/search?term=', category, color);
  }
  if (site.name === 'Epantofi') {
    return buildSearchUrl('https://www.epantofi.ro/search?query=', category, color);
  }
  if (DIRECT_URL_SITES.has(site.name)) {
    return site.url;
  }

  const mapped = resolveMappedCategoryUrl(site, category);
  return mapped ?? site.url;
}

const { width } = typeof globalThis.innerWidth === 'number'
  ? { width: globalThis.innerWidth }
  : Dimensions.get('screen');

// Definim structura datelor primite de la backend
export interface WebItem {
  path: string;
  title: string;
  source_url: string;
  source_domain?: string;
  alternatives?: any[];
  category?: string; // Adăugat pentru filtrare categorie
}

interface WebOutfitProps {
  outfitData: {
    outerwear?: WebItem; // Optional (apare doar iarna/toamna)
    top?: WebItem;
    bottom?: WebItem;
    shoes?: WebItem;
  };
  style?: string; // Stilul selectat (pentru filtrare site-uri)
}

const WebOutfitList: React.FC<WebOutfitProps> = ({ outfitData, style = 'casual' }) => {
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
      if (!item) return null;
      // Afișăm logo-urile site-urilor relevante pentru stilul selectat
      let sites = STYLE_SITE_MAP[style.toLowerCase()] || STYLE_SITE_MAP['casual'];
      // Filtrare Epantofi: doar la încălțăminte
      if (label.toLowerCase().includes('încălțăminte') || label.toLowerCase().includes('shoes')) {
        // păstrăm Epantofi
      } else {
        sites = sites.filter(site => site.name !== 'Epantofi');
      }
      return (
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            {/* În loc de imagine generică, afișăm colaj de logo-uri */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {sites.map(site => (
                <Image
                  key={site.name}
                  source={SITE_LOGOS[site.name]}
                  style={{ width: 36, height: 36, marginHorizontal: 4, borderRadius: 8, backgroundColor: '#fff' }}
                  resizeMode="contain"
                />
              ))}
            </View>
            <View style={styles.labelTag}>
              <Text style={styles.labelText}>{label}</Text>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            {item.source_domain && <Text style={styles.domain}>{item.source_domain}</Text>}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {sites.map(site => {
                const generatedUrl = buildFilteredUrl(site, item, style);
                return (
                  <View key={site.name} style={{ marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#eee', borderRadius: 6, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, marginRight: 6 }}
                      onPress={() => handlePress(generatedUrl)}
                      activeOpacity={0.8}
                    >
                      <Image source={SITE_LOGOS[site.name]} style={{ width: 18, height: 18, marginRight: 4, borderRadius: 4 }} resizeMode="contain" />
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#222' }}>{site.name}</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 10, color: '#888', marginLeft: 4, marginTop: 2 }}>{generatedUrl}</Text>
                  </View>
                );
              })}
            </View>
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