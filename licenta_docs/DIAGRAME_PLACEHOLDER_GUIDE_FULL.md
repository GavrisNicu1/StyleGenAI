# 📊 GUIDE COMPLET: 25 Diagrame & Figuri pentru Teza StyleGenAI

## Structura Folder
Toate figurile trebuie salvate în: `licenta_docs/imagini/`

Naming convention: `NN_descriptive_name.png` (NN = 01-25)

---

## 🖼️ DIAGRAME COMPLETE (25 FIGURI)

### **CAPITOLUL 1 - INTRODUCERE**

#### 1️⃣ **Fig 1: System Architecture** ⭐⭐⭐
- **File**: `imagini/01_system_architecture.png`
- **Location**: Cap 1, Secțiunea "Arhitectura Tehnologică"
- **Dimensiuni**: 0.9\textwidth (landscape)
- **PRIORITY**: MUST HAVE - Core system diagram
- **PROMPT**: Desenează o diagramă de tip sistem cu 3 componente principale:
  1. **FRONTEND MOBILE** (React Native, Expo) cu ecrane (Login, Wardrobe, Generate, History)
  2. **BACKEND SERVER** (Python/Flask, REST API endpoints) cu componente (Authentication JWT, Image Processing U²-Net, Scoring Engine, Database SQLite)
  3. **DATABASE** (SQLite 3NF) cu tabele (users, items, outfits, trends)
  - Săgeți HTTP/HTTPS între frontend și backend
  - Culori: Frontend=albastru deschis, Backend=verde deschis, Database=galben
  - Include logo StyleGenAI sus
  - Stil: Professional, minimalist, tech-forward

---

### **CAPITOLUL 2 - OBIECTIVE**

#### 2️⃣ **Fig 9: MoSCoW Prioritization Matrix** ⭐⭐
- **File**: `imagini/09_moscow_prioritization.png`
- **Location**: Cap 2, Secțiunea "Prioritizare Cerințe"
- **Dimensiuni**: 0.85\textwidth (square/landscape)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Matrice 2x2 cu 4 sectoare colorate:
  1. **MUST HAVE** (Roșu/Dark Red): Auth JWT, Upload, Outfit Gen, Save History
  2. **SHOULD HAVE** (Orange): Background Removal, Style Classification, Trend Integration, Mobile UI, UAT Testing
  3. **COULD HAVE** (Albastru deschis): Web Scraping, Export PDF, Push Notifications, Analytics Dashboard
  4. **WON'T HAVE** (Gri): AR Try-On, RL Personalization, E-commerce, Femei/Copii, Social Networks
  - Include percentaje de completare (MUST=100%, SHOULD=80%, COULD=20%, WON'T=0%)
  - Include icoane pentru fiecare tip
  - Stil: Business, clear visual hierarchy

---

### **CAPITOLUL 3 - STUDIU BIBLIOGRAFIC**

#### 3️⃣ **Fig 10: SWOT Analysis Visual** ⭐⭐
- **File**: `imagini/10_swot_analysis_visual.png`
- **Location**: Cap 3, Secțiunea "Analiza SWOT"
- **Dimensiuni**: 0.8\textwidth (square)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Matrice SWOT 2x2 cu 4 cadrane colorate:
  - **STRENGTHS** (Verde): Transparent algorithm, Competitive speed, Easy UX, Modular architecture
  - **WEAKNESSES** (Roșu): MVP stage, Scaling SQLite, Hardcoded trends, Basic ML
  - **OPPORTUNITIES** (Albastru): E-commerce partnerships, AR integration, RL personalization, Global expansion
  - **THREATS** (Portocaliu): Acloset/Whering competition, Market saturation, TikTok/Instagram shift, BigTech entry
  - Include StyleGenAI logo central
  - Stil: Strategic analysis, clear icons per section

---

### **CAPITOLUL 4 - FUNDAMENTARE TEORETICĂ**

#### 4️⃣ **Fig 2: Image Processing Pipeline** ⭐⭐
- **File**: `imagini/02_image_processing_pipeline.png`
- **Location**: Cap 4, Secțiunea "Segmentarea Semantică"
- **Dimensiuni**: 0.75\textwidth (landscape)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: 4 imagini în lanț left-to-right:
  1. Imagine originală (o cămașă pe fundal prost iluminat)
  2. Mască binară U²-Net (albă cămașă, fundal negru)
  3. Imagine cu fundal eliminat (transparent background)
  4. Culoare dominantă extrapolată în HSV
  - Etichete sub fiecare: "Input", "U²-Net Output", "Masked Image", "Color Extract"
  - Stil: Technical, minimal, cu shadowing

#### 5️⃣ **Fig 3: Color Spaces Comparison** ⭐
- **File**: `imagini/03_color_spaces_comparison.png`
- **Location**: Cap 4, Secțiunea "Spații de Culoare"
- **Dimensiuni**: 0.8\textwidth (landscape)
- **PRIORITY**: NICE TO HAVE
- **PROMPT**: Trei reprezentări 3D:
  1. **RGB cube** - axe R,G,B roșii/verzi/albastre, colțuri peleți (black, white, primaries)
  2. **HSV cylinder** - Hue pe circumferință (0-360°), Saturation radial (0-100%), Value pe înălțime (0-100%)
  3. **Lab space** - L-axis vertical (lightness), a și b axe orizontale, perceptual
  - Frecșe curbe transformare RGB→HSV
  - Culori vii, educational, cu labels clare

#### 6️⃣ **Fig 4: Color Harmony Wheel** ⭐
- **File**: `imagini/04_color_harmony_wheel.png`
- **Location**: Cap 4, Secțiunea "Principii Fundamentale"
- **Dimensiuni**: 0.75\textwidth (portrait/square)
- **PRIORITY**: NICE TO HAVE
- **PROMPT**: 12-color wheel standard. Arată 4 tipuri relații:
  1. **Monochromatic** - o culoare, variații value/saturation (same hue gradații)
  2. **Analogic** - 3 culori adiacente, ex: albastru+verde+cian
  3. **Complementar** - 2 culori opuse 180°, ex: portocaliu+albastru
  4. **Tetratic** - 4 culori la ~90° intervale (pătrat inscris)
  - Include legende color-coded și săgeți
  - Stil: Clean, educational, cu gradient frumos

#### 7️⃣ **Fig 5: Complete Pipeline Flow** ⭐⭐⭐
- **File**: `imagini/05_complete_pipeline_flow.png`
- **Location**: Cap 4, Secțiunea "Fluxul Complet"
- **Dimensiuni**: 0.95\textwidth (landscape)
- **PRIORITY**: MUST HAVE
- **PROMPT**: Flowchart cu 8 step-uri în cutii conectate cu săgeți:
  1. Input Photo (camera icon)
  2. U²-Net Segmentation (magic wand)
  3. Color Extract (palette)
  4. ResNet50 Classify (tag/label icon)
  5. Database Storage (database cylinder)
  6. Outfit Generation (search/loop icon)
  7. Trend Boost (star icon)
  8. Output Recommendation (checkmark icon)
  - Fiecare box: culori diferite gradient pastel
  - Side-by-side example images showing output
  - Stil: Clean, intuitive, modern

---

### **CAPITOLUL 5 - IMPLEMENTARE**

*Nota: Capitolul 5 conține deja diagrama_arhitectura_mvc, backend_project_structure, code_color_detection_screenshot, code_auth_jwt_logic, app_navigation_structure - care sunt placeholder-uri existente în fișier. Aceste nu sunt incluse în numerotarea 01-25.*

---

### **CAPITOLUL 6 - TESTARE & VALIDARE**

#### 8️⃣ **Fig 6: Correlation Scatter Plot** ⭐⭐⭐
- **File**: `imagini/06_correlation_scatter_plot.png`
- **Location**: Cap 6, Secțiunea "Metrica 1: Corelație"
- **Dimensiuni**: 0.75\textwidth (square/portrait)
- **PRIORITY**: MUST HAVE
- **PROMPT**: Scatter plot cu 25 puncte:
  - x-axis: "Algorithm Score (1-10)"
  - y-axis: "Human Rating (1-10)"
  - Puncte colorate gradient (culori calde=high correlation, cool=outliers)
  - Linie trend linear (roșu) cu $R^2 = 0.608$ și $r = 0.78$ pe grafic
  - 95% confidence interval band around trend line
  - Grid minor subtle
  - Stil: Scientific, professional

#### 9️⃣ **Fig 7: Confusion Matrix Heatmap** ⭐⭐
- **File**: `imagini/07_confusion_matrix_heatmap.png`
- **Location**: Cap 6, Secțiunea "Metrica 2: Acuratețe"
- **Dimensiuni**: 0.7\textwidth (square)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Heatmap 3x3:
  - Liniile "Actual": Top/Bottom/Shoe
  - Coloane "Predicted": Top/Bottom/Shoe
  - Culori: verde diagonal (correct), roșu pastel off-diagonal (erori)
  - Numere și procente în celule
  - Metrics pe margine: Precision 0.94, Recall 0.95, F1 0.944
  - Titlu: "Classification Heatmap"
  - Stil: Scientific, color-coded clarity

#### 🔟 **Fig 8: Response Time Histogram** ⭐⭐
- **File**: `imagini/08_response_time_histogram.png`
- **Location**: Cap 6, Secțiunea "Performance"
- **Dimensiuni**: 0.85\textwidth (landscape)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Bar chart cu 5 endpoint-uri:
  - X-axis: `/health`, `/get_suggestion`, `/web_outfit`, `/history`, `/like-delete`
  - Y-axis: Response Time (ms) scale 0-1000
  - Fiecare endpoint: 3 bare Min (verde light), Mean (albastru), Max (roșu)
  - Error bars (std dev)
  - Valori textuale deasupra
  - Linie referință la 500ms (acceptabil)
  - Legandă clar marcată
  - Stil: Business analytics, professional

---

### **CAPITOLUL 7 - MANUAL DE UTILIZARE**

#### 1️⃣1️⃣ **Fig 11: Auth Login Screen** ⭐⭐
- **File**: `imagini/11_auth_login_screen.png`
- **Location**: Cap 7, Secțiunea "Autentificare"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Ecran mobil Portrait 16:9:
  - Logo StyleGenAI sus
  - 2 input fields: email (icon email), password (icon lock)
  - Log In button (prominent blue)
  - Sign Up link (text subliniat)
  - Gradient subtle background
  - Stil: Modern mobile UI, iOS/Android clean design

#### 1️⃣2️⃣ **Fig 12: Auth Sign Up Screen** ⭐⭐
- **File**: `imagini/12_auth_signup_screen.png`
- **Location**: Cap 7, Secțiunea "Autentificare"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Ecran mobil Portrait:
  - 4 input fields: Name, Email, Password, Confirm Password
  - Register button (verde)
  - Back to Login link
  - Validare labels sub fiecare field
  - Stil: Same clean design ca Login

#### 1️⃣3️⃣ **Fig 13: Home Screen with Tabs** ⭐⭐
- **File**: `imagini/13_home_screen_tabs.png`
- **Location**: Cap 7, Secțiunea "Navigare Home"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Ecran Portrait cu bottom tab bar:
  - 3 icons: person (active), lightning, history
  - Main content: User greeting "Welcome, [Name]!"
  - Edit profile button
  - Recent stats (outfits generated, favorites)
  - Stil: Material Design 3 bottom navigation

#### 1️⃣4️⃣ **Fig 14: Profile Screen** ⭐⭐
- **File**: `imagini/14_profile_screen_user_details.png`
- **Location**: Cap 7, Secțiunea "Profile"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Profile screen:
  - Avatar + username
  - Email display
  - Favorite style (dropdown)
  - Preferred occasions (checkboxes: Casual, Formal, Sport, Evening)
  - Edit button, Sign Out button (red)
  - Stil: Subtle avatar background

#### 1️⃣5️⃣ **Fig 15: Generate Input Parameters** ⭐⭐
- **File**: `imagini/15_generate_input_parameters.png`
- **Location**: Cap 7, Secțiunea "Generare"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Portrait screen "Generate Outfit":
  - Occasion dropdown (selected "Casual")
  - Style checkboxes (Modern, Classic, Sporty)
  - Weather slider (Cold-Warm)
  - Upload Photo button (camera icon)
  - Generate Outfit button (prominent blue)
  - Loading animation area placeholder

#### 1️⃣6️⃣ **Fig 16: Generate Result Outfit Card** ⭐⭐
- **File**: `imagini/16_generate_result_outfit_card.png`
- **Location**: Cap 7, Secțiunea "Generare"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Portrait screen after generation:
  - Outfit card mare (3 imagini side-by-side: bluză, pantaloni, pantofi)
  - Compatibility Score 8.7/10 (progress bar)
  - Color Palette (3 culori pătrate)
  - Like button (heart icon), Regenerate button, Save to History button
  - Details cu description

#### 1️⃣7️⃣ **Fig 17: History Screen List** ⭐⭐
- **File**: `imagini/17_history_screen_list.png`
- **Location**: Cap 7, Secțiunea "Istoric"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Portrait "Your Outfits History":
  - Vertical scrollable list cu outfit cards
  - Fiecare card: 3 thumbnail images, date, score, like button
  - Cards cu subtle shadows, culori pastel
  - Search bar sus
  - Filter options (by date, by score, by occasion)

#### 1️⃣8️⃣ **Fig 18: Outfit Detail Screen** ⭐⭐
- **File**: `imagini/18_outfit_detail_screen.png`
- **Location**: Cap 7, Secțiunea "Istoric"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: Portrait outfit detail:
  - Outfit mare (3 imagini full-size stacked vertical)
  - Titlu outfit, Occasion tag
  - Score cu detalii (Compatibility 8.7/10, Color Harmony, Trend Boost +15%)
  - Recomandări de accesorii
  - Download, Share, Delete buttons

#### 1️⃣9️⃣ **Fig 19: Security Logout Dialog** ⭐
- **File**: `imagini/19_security_logout_confirmation.png`
- **Location**: Cap 7, Secțiunea "Delogare"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: NICE TO HAVE
- **PROMPT**: Modal dialog Portrait:
  - Titlu "Sign Out?"
  - Mesaj "Are you sure you want to sign out? Your saved outfits will be preserved."
  - Cancel button (gri), Confirm button (roșu)
  - Background blur pe screen în spate

#### 2️⃣0️⃣ **Fig 20: Error Messages Guide** ⭐
- **File**: `imagini/20_error_messages_guide.png`
- **Location**: Cap 7, Secțiunea "Troubleshooting"
- **Dimensiuni**: 0.5\textwidth (portrait mobile)
- **PRIORITY**: NICE TO HAVE
- **PROMPT**: 3-box layout Portrait cu 3 error scenarios:
  1. "Connection Failed" (iconiță reț)
  2. "Upload Failed" (iconiță imagine)
  3. "Generation Error" (iconiță gear)
  - Fiecare: mesaj, suggested action, retry button
  - Culori: red warning tones, helpful tone

---

### **CAPITOLUL 8 - CONCLUZII**

#### 2️⃣1️⃣ **Fig 21: Roadmap Timeline 24 Months** ⭐⭐⭐
- **File**: `imagini/21_roadmap_timeline_24months.png`
- **Location**: Cap 8, Secțiunea "Dezvoltări Ulterioare"
- **Dimensiuni**: 0.9\textwidth (landscape)
- **PRIORITY**: MUST HAVE
- **PROMPT**: Timeline orizontal 4 faze pe 24 luni:
  - **v1.1 (3 luni, verde)**: GPU cloud, 50K dataset, Weather API, <200ms latency, 96% accuracy
  - **v2.0 (3-6 luni, albastru)**: Digital Closet, Feedback Loop, Analytics, 50K DAU, NPS>60
  - **v2.5 (6-9 luni, portocaliu)**: E-commerce integration, AR Try-On, €50K/month, 100K MAU
  - **v3.0 (9-12 luni, roșu)**: DQN RL, Femei/Copii, Social, 1M users, €2M ARR
  - Color-coded milestones, dependency arrows, risk labels (HIGH/MEDIUM/LOW)
  - Stil: Strategic roadmap, Gantt-style

#### 2️⃣2️⃣ **Fig 22: KPI Evolution Chart** ⭐⭐
- **File**: `imagini/22_kpi_evolution_chart.png`
- **Location**: Cap 8, Secțiunea "Concluzii"
- **Dimensiuni**: 0.85\textwidth (landscape)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: 3 multi-line chart panels stacked vertical:
  1. **User Growth**: 0→10K→50K→100K→1M pe v1.0-v3.0
  2. **Revenue**: €0→€50K→€500K→€2M
  3. **Performance**: 450ms→200ms→100ms latency, 93%→96%→98% accuracy
  - X-axis: months 0-24 cu version labels
  - Y-axes: log scale usuarios
  - Dots pe linii marking version releases
  - Stil: Business analytics

#### 2️⃣3️⃣ **Fig 23: Validation Summary Dashboard** ⭐⭐
- **File**: `imagini/24_validation_summary_dashboard.png`
- **Location**: Cap 8, Secțiunea "Concluzii Finale"
- **Dimensiuni**: 0.9\textwidth (landscape)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: 5 metric cards în layout orizontal:
  1. **Pearson Correlation**: r=0.78, p<0.001, R²=0.61 (meter/gauge)
  2. **Classification Accuracy**: 93% F1=0.944 (progress bar)
  3. **UAT Acceptance**: 8 users, NPS=50%, rating 4.3/5
  4. **Security Tests**: 7/7 passed (checkmark-uri)
  5. **Performance**: <500ms median latency
  - Culori: green pentru pass, metrics bold
  - Stil: Executive dashboard, KPI cards

#### 2️⃣4️⃣ **Fig 24: Architecture Evolution Roadmap** ⭐⭐
- **File**: `imagini/25_architecture_evolution_roadmap.png`
- **Location**: Cap 8, Secțiunea "Concluzii Finale"
- **Dimensiuni**: 0.85\textwidth (landscape)
- **PRIORITY**: SHOULD HAVE
- **PROMPT**: 3 column layout, fiecare reprezentând architeture fase:
  1. **MVP Current**: SQLite, Flask server, React Native, 100 concurrent users
  2. **v2.0 Growth**: PostgreSQL, GPU backend, load balancer, 100K users
  3. **v3.0 Enterprise**: Distributed microservices, DQN RL engine, auto-scaling, 1M+ users
  - Arrows showing evolution
  - Technology stack labels
  - Scaling factors
  - Culori: escalating intensity
  - Stil: System architecture evolution

---

## 📁 Cum să Creezi Figurile

### Opțiuni Software Recomandate:

| Software | Best For | Free Tier |
|----------|----------|-----------|
| **Figma** | Toate tipurile, ui mockups | ✅ Yes |
| **Lucidchart** | Flowcharts, diagrams | ✅ Limited |
| **Python Matplotlib/Seaborn** | Scatter plots, histograms, heatmaps | ✅ Yes (code) |
| **TikZ/LaTeX** | Technical diagrams, math | ✅ Yes (code) |
| **Canva Pro** | Quick designs, templates | ❌ Paid |
| **Draw.io** | Flowcharts, architecture | ✅ Yes (free online) |

### Pas cu Pas:

1. Deschide tool-ul preferat (Figma gratuit)
2. Copiază prompt-ul din secțiunea corespunzătoare
3. Creează diagrama respectând dimensiunile textwidth
4. **Exportează ca PNG 300 DPI** (HIGH quality)
5. Salvează cu exact filename-ul din `imagini/NN_descriptive_name.png`
6. Verifica că textul este lizibil la dimensiunile din LaTeX

---

## 🔧 Instalare Imagini în LaTeX

```bash
# Asigură-te că folder imagini/ există
mkdir -p licenta_docs/imagini

# Copiază toate PNG-urile acolo
# LaTeX va compila și va include automat
```

---

## ✅ Verificare

După ce completezi toate figurile:

```bash
# Compilare LaTeX
cd licenta_docs/
pdflatex -interaction=nonstopmode Licenta_StyleGenAI.tex
bibtex Licenta_StyleGenAI.aux
pdflatex -interaction=nonstopmode Licenta_StyleGenAI.tex
pdflatex -interaction=nonstopmode Licenta_StyleGenAI.tex
```

Verificare checklist:
- ✅ Toate 25 figuri sunt prezente
- ✅ Nici o "Citation undefined" warning
- ❌ Nici o "Missing figure" warning
- ✅ Captions și labels sunt corecte
- ✅ All figures sunt numerate corect în TOC

---

## 📌 Ordine Prioritate (dacă timpul e limitat)

### **TIER 1 - MUST HAVE (4 figuri):** ~1 oră
- ✅ Fig 1: System Architecture
- ✅ Fig 5: Complete Pipeline Flow
- ✅ Fig 6: Correlation Plot
- ✅ Fig 21: Roadmap Timeline

### **TIER 2 - SHOULD HAVE (10 figuri):** ~2.5 ore
- Fig 2: Image Processing Pipeline
- Fig 7: Confusion Matrix
- Fig 8: Response Time Histogram
- Fig 9: MoSCoW Matrix
- Fig 10: SWOT Analysis
- Fig 13-18: Screenshots Mobile (6 figuri rapide)
- Fig 22: KPI Evolution
- Fig 24: Architecture Evolution

### **TIER 3 - NICE TO HAVE (11 figuri):** ~1.5 ore dacă timp
- Fig 3: Color Spaces (theory)
- Fig 4: Color Harmony Wheel (educational)
- Fig 11-12: Auth Screens
- Fig 19-20: Error States
- Fig 23: Validation Dashboard

**Total time estimate:** 2-5 ore pentru toate 25 diagrame (depending on tool proficiency)

---

## 📞 Notes

- Figurile 11-20 sunt screenshot mockups - pot fi create rapid în Figma/Canva din template-uri
- Figurile 6-8, 22, 23 pot fi generate cu Python Matplotlib script
- Figurile 1, 5, 9, 10, 21, 24, 25 sunt best done în Figma
- Figurile 2-4 pot fi desenate în Figma sau cu TikZ

---

## 🎯 QUICK START CHECKLIST

- [ ] Crează folder `licenta_docs/imagini/`
- [ ] Deschide Figma free account
- [ ] Copy-paste primele 3 prompt-uri (Fig 1, 5, 6)
- [ ] Creeazi pe lândul (30min per figura)
- [ ] Exportează PNG 300 DPI
- [ ] Rename files exact (01_system_architecture.png, etc.)
- [ ] Copy to `imagini/` folder
- [ ] Run pdflatex compilation
- [ ] Check PDF pentru missing figures
- [ ] Fix dimensions if needed
- [ ] ✅ DONE!

---

*Guide v2.0 - 25 Diagrame Complete*
*Last Updated: May 23, 2026*
