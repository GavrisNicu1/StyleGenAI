"""
web_fetcher.py – Motor "Product Hunter" V4 (Final).
Include Validare de CONȚINUT (Deep Content Check) pentru a detecta paginile "Soft 404"
și redirecționările ascunse către categorii.
"""
from __future__ import annotations
from typing import Dict, Optional, List
import os
import json
import requests
import random
import re
from urllib.parse import quote_plus
from dotenv import load_dotenv

# --- 1. CONFIGURARE ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

API_KEY = os.getenv("GOOGLE_CSE_API_KEY")
CSE_ID = os.getenv("GOOGLE_CSE_ID")

# --- BRANDURI ---
PREMIUM_BRANDS = ["Calvin Klein", "Tommy Hilfiger", "Guess", "Ralph Lauren", "Massimo Dutti", "Hugo Boss", "Gant", "Lacoste"]
SPORT_BRANDS = ["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Under Armour", "Converse"]
CASUAL_BRANDS = ["Zara", "H&M", "Bershka", "Pull&Bear", "Levis", "Jack & Jones", "Mango Man"]
# --- MAPARE STIL -> SITE-URI ---
STYLE_SITE_MAP = {
    "elegant": [
        {"name": "Massimo Dutti", "url": "https://www.massimodutti.com/ro/"},
        {"name": "Seroussi", "url": "https://seroussi.ro/"},
        {"name": "Hugo Boss", "url": "https://www.hugoboss.com/ro/"},
        {"name": "Tommy Hilfiger", "url": "https://ro.tommy.com/"},
        {"name": "AboutYou", "url": "https://www.aboutyou.ro/"},
    ],
    "sport": [
        {"name": "Nike", "url": "https://www.nike.com/ro/"},
        {"name": "Adidas", "url": "https://www.adidas.ro/"},
        {"name": "Under Armour", "url": "https://www.underarmour.ro/"},
        {"name": "AboutYou", "url": "https://www.aboutyou.ro/"},
    ],
    "casual": [
        {"name": "AboutYou", "url": "https://www.aboutyou.ro/"},
        {"name": "Tommy Hilfiger", "url": "https://ro.tommy.com/"},
        {"name": "Zara", "url": "https://www.zara.com/ro/"},
        {"name": "Ralph Lauren", "url": "https://www.ralphlauren.eu/ro/"},
    ],
}

CATEGORY_QUERY_BASE = {
    "outerwear": "geci jachete",
    "top": "tricouri bluze",
    "bottom": "pantaloni jeans",
    "shoes": "pantofi sneakers"
}

CATEGORY_DISPLAY_NAMES = {
    "outerwear": "Geci și jachete",
    "top": "Topuri și tricouri",
    "bottom": "Pantaloni / fuste",
    "shoes": "Încălțăminte"
}

COLOR_TRANSLATIONS = {
    "black": "negru",
    "white": "alb",
    "blue": "albastru",
    "navy": "bleumarin",
    "red": "rosu",
    "green": "verde",
    "beige": "bej",
    "grey": "gri",
    "gray": "gri",
    "brown": "maro",
    "yellow": "galben",
    "orange": "portocaliu",
    "purple": "mov",
    "pink": "roz"
}

# --- MOCK DATA (Siguranță Maximă) ---
# Link-uri verificate manual care știm sigur că merg.
MOCK_WEB_OUTFIT = {
    "outerwear": {
        "path": "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=800",
        "title": "Geacă Piele Biker (Demo)",
        "source_url": "https://www.aboutyou.ro/p/jack-jones/geaca-de-primavara-toamna-rocky-4363435", 
        "source_domain": "aboutyou.ro"
    },
    "top": {
        "path": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800",
        "title": "Tricou Basic Navy (Demo)",
        "source_url": "https://answear.ro/p/tommy-jeans-tricou-din-bumbac-culoarea-albastru-marin-neted-1209285.html",
        "source_domain": "answear.ro"
    },
    "bottom": {
        "path": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800",
        "title": "Jeans Regular Fit (Demo)",
        "source_url": "https://www.fashiondays.ro/p/blugi-drepti-cu-aspect-decolorat-501-barbati-levis-p5234213-2/",
        "source_domain": "fashiondays.ro"
    },
    "shoes": {
        "path": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800",
        "title": "Sneakers Sport (Demo)",
        "source_url": "https://www.epantofi.ro/p/sneakers-new-balance-gm500-navy.html",
        "source_domain": "epantofi.ro"
    }
}

CATEGORY_PLACEHOLDER_IMAGES = {k: v["path"] for k, v in MOCK_WEB_OUTFIT.items()}

ABOUTYOU_MEN_CATEGORY_PATHS = {
    "top": "https://www.aboutyou.ro/c/barbati/haine/tricouri-20324",
    "outerwear": "https://www.aboutyou.ro/c/barbati/haine/geci-20320",
    "bottom": "https://www.aboutyou.ro/c/barbati/haine/pantaloni-20330",
    "shoes": "https://www.aboutyou.ro/c/barbati/pantofi/sneakers-20345",
}

ABOUTYOU_STYLE_OVERRIDES = {
    "elegant": {
        "top": "https://www.aboutyou.ro/c/barbati/haine/camasi-20319",
        "bottom": "https://www.aboutyou.ro/c/barbati/haine/pantaloni/pantaloni-chino-20972",
        "shoes": "https://www.aboutyou.ro/c/barbati/pantofi/pantofi-20342",
        "outerwear": "https://www.aboutyou.ro/c/barbati/haine/paltoane-20321",
    },
    "sport": {
        "top": "https://www.aboutyou.ro/c/barbati/haine/sweat-20327",
        "bottom": "https://www.aboutyou.ro/c/barbati/haine/pantaloni/pantaloni-de-trening-23689",
        "shoes": "https://www.aboutyou.ro/c/barbati/pantofi/pantofi-sport-514809",
        "outerwear": "https://www.aboutyou.ro/c/barbati/haine/geci/geci-de-puf-20919",
    },
    "casual": {
        "outerwear": "https://www.aboutyou.ro/c/barbati/haine/geci/geci-de-primavara-toamna-20932",
        "bottom": "https://www.aboutyou.ro/c/barbati/haine/pantaloni/pantaloni-jeans-20331",
    },
}

ABOUTYOU_COLOR_CODES = {
    "alb": "38935",
    "negru": "38932",
    "albastru": "38920",
    "bleumarin": "38920",
    "gri": "38925",
    "bej": "38919",
    "verde": "38926",
    "roz": "38930",
    "rosu": "38929",
}

DEFAULT_COLOR_FALLBACK = "negru"

EPANTOFI_CATEGORY_PATHS = {
    "shoes": "https://www.epantofi.ro/barbati/adidasi"
}


def _translate_color(color_name: Optional[str]) -> str:
    if not color_name:
        return ""
    raw = str(color_name).strip().lower()
    primary = raw.split()[0]
    return COLOR_TRANSLATIONS.get(raw) or COLOR_TRANSLATIONS.get(primary, raw)


def _season_profile(season_value: str) -> str:
    s = season_value.lower()
    if "vara" in s or "summer" in s:
        return "summer"
    if "iarna" in s or "winter" in s:
        return "winter"
    if any(x in s for x in ["toamna", "primavara", "spring", "autumn"]):
        return "transitional"
    return "all"


def _season_keyword(profile: str) -> str:
    return {
        "summer": "vara",
        "winter": "iarna",
        "transitional": "toamna primavara",
    }.get(profile, "")


def _compose_query_phrase(base_phrase: str, style_value: str, gender_terms_value: str, color_value: str, season_profile: str) -> str:
    tokens = [base_phrase]
    if color_value:
        tokens.append(color_value)
    if style_value:
        tokens.append(style_value)
    if gender_terms_value:
        tokens.append(gender_terms_value)
    season_token = _season_keyword(season_profile)
    if season_token:
        tokens.append(season_token)
    tokens.append("trend fashion")
    return " ".join(token for token in tokens if token).strip()


def _build_category_queries(
    style_value: str,
    season_value: str,
    gender_terms_value: str,
    color_value: str,
    color_by_category: Optional[Dict[str, str]] = None,
) -> Dict[str, str]:
    profile = _season_profile(season_value)
    categories = ["top", "bottom", "shoes"]
    if profile != "summer":
        categories.insert(0, "outerwear")

    queries: Dict[str, str] = {}
    for cat in categories:
        base_phrase = CATEGORY_QUERY_BASE.get(cat, cat)
        active_color = (color_by_category or {}).get(cat) or color_value
        queries[cat] = _compose_query_phrase(base_phrase, style_value, gender_terms_value, active_color, profile)
    return queries


def _format_search_entry(template: str, query: str, domain: str) -> Dict[str, str]:
    return {
        "source_url": template.format(query=quote_plus(query)),
        "source_domain": domain
    }


def _retailer_epantofi(query: str, category_key: str, gender_target_value: str) -> Optional[Dict[str, str]]:
    if category_key != "shoes":
        return None
    return _format_search_entry("https://www.epantofi.ro/search?query={query}", query, "epantofi.ro")


def _retailer_aboutyou(query: str, category_key: str, gender_target_value: str) -> Optional[Dict[str, str]]:
    return _format_search_entry("https://www.aboutyou.ro/search?q={query}", query, "aboutyou.ro")


def _retailer_answear(query: str, category_key: str, gender_target_value: str) -> Optional[Dict[str, str]]:
    return _format_search_entry("https://answear.ro/s?q={query}", query, "answear.ro")


def _retailer_fashiondays(query: str, category_key: str, gender_target_value: str) -> Optional[Dict[str, str]]:
    return _format_search_entry("https://www.fashiondays.ro/search?query={query}", query, "fashiondays.ro")


def _retailer_modivo(query: str, category_key: str, gender_target_value: str) -> Optional[Dict[str, str]]:
    return _format_search_entry("https://www.modivo.ro/search?query={query}", query, "modivo.ro")


def _compose_listing_payload(category_key: str, listings: List[Dict[str, str]], color_value: str) -> Optional[Dict[str, str]]:
    if not listings:
        return None
    placeholder = CATEGORY_PLACEHOLDER_IMAGES.get(category_key) or next(iter(CATEGORY_PLACEHOLDER_IMAGES.values()), None)
    color_label = color_value.capitalize() if color_value else "Neutru"
    category_label = CATEGORY_DISPLAY_NAMES.get(category_key, category_key.title())

    main = listings[0].copy()
    main.setdefault("title", f"{category_label} {color_label} – {main.get('source_domain', '')}")
    if placeholder and not main.get("path"):
        main["path"] = placeholder
    main["category"] = category_key

    alternatives: List[Dict[str, str]] = []
    for alt in listings[1:]:
        alt_entry = alt.copy()
        alt_entry.setdefault("title", f"{category_label} – {alt_entry.get('source_domain', '')}")
        if placeholder and not alt_entry.get("path"):
            alt_entry["path"] = placeholder
        alternatives.append(alt_entry)

    main["alternatives"] = alternatives
    return main


def _aboutyou_category_listing(category_key: str, color_value: str, gender_target_value: str, style_value: str) -> Optional[Dict[str, str]]:
    if gender_target_value != "men":
        return None
    style_key = style_value.lower()
    base = ABOUTYOU_STYLE_OVERRIDES.get(style_key, {}).get(category_key) or ABOUTYOU_MEN_CATEGORY_PATHS.get(category_key)
    if not base:
        return None
    color_code = ABOUTYOU_COLOR_CODES.get(color_value)
    if color_code:
        separator = "&" if "?" in base else "?"
        url = f"{base}{separator}color={color_code}"
    else:
        url = base
    return {
        "source_url": url,
        "source_domain": "aboutyou.ro"
    }


def _epantofi_category_listing(category_key: str, color_value: str, gender_target_value: str, style_value: str) -> Optional[Dict[str, str]]:
    base = EPANTOFI_CATEGORY_PATHS.get(category_key)
    if not base:
        return None
    return {
        "source_url": base,
        "source_domain": "epantofi.ro"
    }


SEARCH_BUILDERS = [
    _retailer_answear,
    _retailer_fashiondays,
    _retailer_modivo,
]

CATEGORY_LISTING_BUILDERS = [
    _aboutyou_category_listing,
    _epantofi_category_listing,
]


def _build_retailer_listings(category_key: str, query: str, gender_target_value: str, color_value: str, style_value: str) -> List[Dict[str, str]]:
    listings: List[Dict[str, str]] = []
    for builder in CATEGORY_LISTING_BUILDERS:
        entry = builder(category_key, color_value, gender_target_value, style_value)
        if entry:
            listings.append(entry)
    for builder in SEARCH_BUILDERS:
        entry = builder(query, category_key, gender_target_value)
        if entry:
            listings.append(entry)
    return listings

def _is_junk_url(url: str) -> bool:
    """ Verifică structura URL-ului pentru cuvinte interzise (categorii). """
    url = url.lower()
    banned = [
        "/c/", "/k/", "/g/", "categorie", "colectii", "campaign", "sale", 
        "promotii", "blog", "noutati", "search", "branduri", "login", 
        "cart", "wishlist", "index", "home", "pagina", "list", "all"
    ]
    return any(x in url for x in banned)

def _validate_page_content(url: str) -> bool:
    """
    Descarcă pagina și verifică dacă e un produs VALID.
    Detectează 'Soft 404' (Oops...) și Redirecționări ascunse.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Cerem pagina reală (GET), nu doar header-ul
        r = requests.get(url, headers=headers, timeout=4, allow_redirects=True)
        
        # 1. Verificăm dacă ne-a redirecționat către o categorie
        final_url = r.url.lower()
        if _is_junk_url(final_url):
            # print(f"  [Redirect Trap] Ne-a dus în categorie: {final_url}")
            return False

        # 2. Verificăm conținutul HTML pentru erori specifice magazinelor
        page_content = r.text.lower()
        
        error_keywords = [
            "nu mai exista", 
            "pagina nu a fost gasita", 
            "oops...", 
            "produs indisponibil", 
            "404 error",
            "ne pare rau",
            "nu am gasit pagina"
        ]
        
        # Optimizare: Căutăm doar în primele 5000 de caractere (titlu/header) pentru viteză
        snippet = page_content[:10000] 
        
        if any(err in snippet for err in error_keywords):
            # print(f"  [Soft 404] Pagina conține erori vizuale: {url}")
            return False

        return True
    except Exception as e:
        # Orice eroare de rețea = link invalid
        return False

def _is_strict_product_url(url: str, gender_target: str) -> bool:
    url = url.lower()
    
    if _is_junk_url(url): return False

    # Filtru Gen
    if gender_target == 'men':
        if any(x in url for x in ["femei", "dama", "fete", "women", "ladies", "skirt", "rochie"]): return False
    elif gender_target == 'women':
        if any(x in url for x in ["barbati", "men", "baieti", "masculin"]): return False

    # Regex Validare per Magazin
    if "answear.ro" in url: return ".html" in url
    if "fashiondays.ro" in url: return "/p/" in url
    if "epantofi.ro" in url or "modivo.ro" in url: return ".html" in url
    if "zalando.ro" in url: return ".html" in url
    if "aboutyou.ro" in url: return (re.search(r'\d+$', url) is not None) or "/p/" in url

    if len(url.split('/')) > 4: return True
    return False

def _search_google_cse(query: str, gender_target: str, num_results=3) -> List[dict]:
    if not API_KEY or not CSE_ID: return []

    print(f"🔎 [Search] '{query}'")
    
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': API_KEY, 'cx': CSE_ID, 'q': query,
        'searchType': 'image', 'num': 10, 'safe': 'active',
        'imgType': 'photo', 'imgSize': 'large',
        'gl': 'ro', 'hl': 'ro', 'fileType': 'jpg,png,webp'
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200: return []

        data = response.json()
        valid_results = []
        
        if 'items' in data:
            for item in data['items']:
                link = item.get('link') 
                ctx_link = item.get('image', {}).get('contextLink', link)
                title = item.get('title', 'Produs Fashion')
                domain = item.get('displayLink', 'magazin.ro')

                # 1. Filtru URL (Static) - Rapid
                if not _is_strict_product_url(ctx_link, gender_target): continue

                # 2. Filtru Conținut (Dinamic) - Mai lent dar SIGUR
                # Verificăm efectiv pagina
                if not _validate_page_content(ctx_link):
                    continue

                clean_title = title.split('|')[0].split('-')[0].strip()
                if len(clean_title) > 35: clean_title = clean_title[:32] + "..."
                
                valid_results.append({
                    "path": link, "source_url": ctx_link,
                    "source_domain": domain, "title": clean_title
                })
                
                if len(valid_results) >= num_results: break
        
        return valid_results

    except Exception as e:
        print(f"❌ Eroare: {e}")
        return []

def _select_trend_color(trend_colors: Optional[List[str]]) -> str:
    if trend_colors:
        for color in trend_colors:
            translated = _translate_color(color)
            if translated:
                return translated
    return DEFAULT_COLOR_FALLBACK


def get_web_outfit(
    style_filter: str,
    season: str,
    gender: str,
    trend_colors: Optional[List[str]] = None,
    piece_colors: Optional[Dict[str, str]] = None,
) -> Dict[str, dict]:
    gender_target = "unisex"
    gender_terms = ""
    negative_terms = ""
    
    g_lower = gender.lower()
    if g_lower in ['men', 'barbati', 'masculin', 'bărbati']:
        gender_target = "men"
        gender_terms = "barbati" 
        negative_terms = "-dama -femei -women -dress -fusta -rochie -skirt -kids"
    elif g_lower in ['women', 'femei', 'feminin']:
        gender_target = "women"
        gender_terms = "dama"
        negative_terms = "-barbati -men -masculin -kids"
    elif g_lower in ['copii', 'kids']:
        gender_target = "kids"
        gender_terms = "copii"
        negative_terms = ""

    style = style_filter.lower()
    selected_brand = ""
    if "elegant" in style or "smart" in style: selected_brand = random.choice(PREMIUM_BRANDS)
    elif "sport" in style or "street" in style: selected_brand = random.choice(SPORT_BRANDS)
    else: selected_brand = random.choice(CASUAL_BRANDS)

    buy_trigger = "pret ron" 
    
    color_str = _select_trend_color(trend_colors)

    season = season.lower()
    search_plan = _build_category_queries(style, season, gender_terms or "", color_str, piece_colors)

    final_outfit = {}

    color_by_category = piece_colors or {}
    for category_key, query_string in search_plan.items():
        color_for_cat = color_by_category.get(category_key) or color_str
        retailer_listings = _build_retailer_listings(category_key, query_string, gender_target, color_for_cat, style)

        if retailer_listings:
            listing_payload = _compose_listing_payload(category_key, retailer_listings, color_for_cat)
            if listing_payload:
                final_outfit[category_key] = listing_payload
                continue

        fallback_query = f"{query_string} {selected_brand} {buy_trigger} {negative_terms}".strip()
        results = _search_google_cse(fallback_query, gender_target)
        if results:
            main_item = results[0]
            main_item['category'] = category_key
            main_item['alternatives'] = results[1:] if len(results) > 1 else []
            final_outfit[category_key] = main_item
            continue

        print(f"⚠️ Link-uri invalide. Folosesc MOCK sigur pentru {category_key}")
        if category_key in MOCK_WEB_OUTFIT:
            mock = MOCK_WEB_OUTFIT[category_key].copy()
            mock['category'] = category_key
            final_outfit[category_key] = mock

    return final_outfit

if __name__ == "__main__":
    print("🚀 Testare Content Validation...")
    outfit = get_web_outfit("casual", "toamna", "barbati", ["blue"], {"top": "albastru"})
    print(json.dumps(outfit, indent=2))