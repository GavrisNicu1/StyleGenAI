# 📊 GUIDE: Diagrame & Figuri pentru Teza StyleGenAI

## Structura Folder
Toate figurile trebuie salvate în: `licenta_docs/imagini/`

Naming convention: `NN_descriptive_name.png` (NN = numărul diagramei, 01-08+)

---

## 🖼️ Diagrame Adăugate în Text (8 figuri)

### 1️⃣ **Fig 1: System Architecture** 
- **File**: `imagini/01_system_architecture.png`
- **Location**: Capitolul 1, Secțiunea "Arhitectura Tehnologică"
- **Label**: `fig:system_architecture`
- **Dimensiuni**: 0.9\textwidth (landscape)
- **PROMPT**: Desenează o diagramă de tip sistem cu 3 componente principale: 
  1. FRONTEND MOBILE (React Native, Expo) cu ecrane (Login, Wardrobe, Generate, History)
  2. BACKEND SERVER (Python/Flask, REST API endpoints) cu componente (Authentication JWT, Image Processing U²-Net, Scoring Engine, Database SQLite)
  3. Săgeți de comunicare HTTP/HTTPS între frontend și backend
  - Culori: Frontend=albastru deschis, Backend=verde deschis, Database=galben
  - Include logo StyleGenAI sus
  - Stil: Professional, minimalist, tech-forward

---

### 2️⃣ **Fig 2: Image Processing Pipeline**
- **File**: `imagini/02_image_processing_pipeline.png`
- **Location**: Capitolul 4, Secțiunea "Segmentarea Semantică a Obiectelor"
- **Label**: `fig:procesare_imagine`
- **Dimensiuni**: 0.75\textwidth (landscape)
- **PROMPT**: 4 imagini în lanț (left-to-right arrow flow):
  1. Imagine originală (o cămașă pe fundal prost iluminat)
  2. Mască binară de segmentare (albă cămașă, fundal negru)
  3. Imagine cu fundal eliminat (transparent background)
  4. Culoare dominantă extrapolată în HSV (cerc cu nuanță, saturation, value)
  - Include etichete sub fiecare: "Input", "U²-Net Output", "Masked Image", "Color Extract"
  - Stil: Technical, minimal, cu shadowing pe obiecte

---

### 3️⃣ **Fig 3: Color Spaces Comparison**
- **File**: `imagini/03_color_spaces_comparison.png`
- **Location**: Capitolul 4, Secțiunea "Spațiul HSV (Hue-Saturation-Value)"
- **Label**: `fig:color_spaces`
- **Dimensiuni**: 0.8\textwidth (landscape)
- **PROMPT**: Trei reprezentări 3D ale spațiilor de culoare:
  1. RGB cube cu axe R, G, B roșii/verzi/albastre, colț peleți (black, white, primary colors)
  2. HSV cilindru cu Hue pe circumferință (0-360°), Saturation radial (0-100%), Value pe inaltime (0-100%), cu culori distribuite pe cerc
  3. Lab space cu L-axis vertical (lightness), a și b axe orizontale
  - Include frecșe curbe de transformare RGB→HSV
  - Culori vii, educational, cu labels clare

---

### 4️⃣ **Fig 4: Color Harmony Wheel**
- **File**: `imagini/04_color_harmony_wheel.png`
- **Location**: Capitolul 4, Secțiunea "Principii Fundamentale din Teoria Culorilor"
- **Label**: `fig:color_harmony`
- **Dimensiuni**: 0.75\textwidth (portrait/square)
- **PROMPT**: Cerc complet de 12 culori (12-color wheel standard). Arată 4 tipuri de relații:
  1. Monochromatic (o culoare, variații value/saturation=gradații same hue)
  2. Analogic (3 culori adiacente, ex: albastru+verde+cian)
  3. Complementar (2 culori opuse, ex: portocaliu+albastru, linii dese)
  4. Tetratic (4 culori la ~90° intervale, pătrat inscris)
  - Include legende color-coded și sageti
  - Stil: Clean, educational, cu gradient frumos

---

### 5️⃣ **Fig 5: Complete Pipeline Flow**
- **File**: `imagini/05_complete_pipeline_flow.png`
- **Location**: Capitolul 4, Secțiunea "Fluxul Complet: De la Imagine la Recomandare"
- **Label**: `fig:complete_flow`
- **Dimensiuni**: 0.95\textwidth (landscape)
- **PROMPT**: Flowchart vertical/horizontal cu 8 step-uri în cutii conectate cu săgeți. Fiecare step cu iconiță și text:
  1. Input Photo (camera icon)
  2. U²-Net Segmentation (magic wand)
  3. Color Extract (palette)
  4. ResNet50 Classify (tag)
  5. Database Storage (cylinder)
  6. Outfit Generation (search/loop)
  7. Trend Boost (star)
  8. Output Recommendation (checkmark)
  - Fiecare box are culori diferite (gradient pastel)
  - Include side-by-side images showing example output
  - Stil: Clean, intuitive, modern

---

### 6️⃣ **Fig 6: Correlation Scatter Plot**
- **File**: `imagini/06_correlation_scatter_plot.png`
- **Location**: Capitolul 6, Secțiunea "Metrica 1: Corelație cu Evaluări Umane"
- **Label**: `fig:correlation_plot`
- **Dimensiuni**: 0.75\textwidth (square/portrait)
- **PROMPT**: Scatter plot cu 25 puncte de date:
  - x-axis: "Algorithm Score (1-10)"
  - y-axis: "Human Rating (1-10)"
  - Puncte colorate cu gradient (culori calde=high correlation, cool=outliers)
  - Linie de trend linear de regresie în roșu cu $R^2 = 0.608$ și $r = 0.78$ pe grafic
  - Include 95% confidence interval band around trend line
  - Grid minor subtle
  - Stil: Scientific, professional

---

### 7️⃣ **Fig 7: Confusion Matrix Heatmap**
- **File**: `imagini/07_confusion_matrix_heatmap.png`
- **Location**: Capitolul 6, Secțiunea "Metrica 2: Acuratețe Clasificare Categorii"
- **Label**: `fig:confusion_matrix`
- **Dimensiuni**: 0.7\textwidth (square)
- **PROMPT**: Heatmap 3x3 cu liniile "Actual" și coloanele "Predicted" (Top/Bottom/Shoe):
  - Valorile din celule cu culori gradient: verde deschis pentru diagonal (correct), roșu pastel pentru off-diagonal (erori)
  - Include numere în fiecare celulă și procente
  - Metrics pe margine: Precision per class (0.94), Recall (0.95), F1 (0.944)
  - Titlu: "Classification Heatmap"
  - Stil: Scientific, color-coded clarity

---

### 8️⃣ **Fig 8: Response Time Histogram**
- **File**: `imagini/08_response_time_histogram.png`
- **Location**: Capitolul 6, Secțiunea "Performanță și timp de răspuns"
- **Label**: `fig:response_times`
- **Dimensiuni**: 0.85\textwidth (landscape)
- **PROMPT**: Bar chart / histogram cu 5 endpoint-uri pe x-axis:
  - `/health`, `/get_suggestion`, `/web_outfit`, `/outfits/history`, `/like-delete`
  - Y-axis: Response Time (ms) cu scale 0-1000
  - Pentru fiecare endpoint, 3 bare: Min (verde light), Mean (albastru), Max (roșu)
  - Include error bars (std dev)
  - Valori textuale deasupra barelor
  - Linie orizontală de referință la 500ms (acceptabil)
  - Legandă clar marcată
  - Stil: Business analytics, clean bars, professional

---

## 📁 Cum să Creezi Figurile

### Opțiuni Software Recomandate:
1. **Figma** (free tier) - Cea mai bună pentru diagramelor moderne
2. **Lucidchart** - Ideal pentru flowchart-uri
3. **TikZ/LaTeX** - Generare directă, ideal pentru diagrame tehnice
4. **Python (Matplotlib/Seaborn)** - Pentru heatmap-uri și scatter plot-uri
5. **Canva Pro** - Rapid și templates profesionale

### Pas cu Pas:
1. Deschide tool-ul preferat
2. Copiază prompt-ul din secțiunea corespunzătoare
3. Creează diagrama respectând dimensiunile textwidth
4. Exportează ca PNG 300 DPI (quality: HIGH)
5. Salvează cu exact filename-ul din `imagini/NN_descriptive_name.png`
6. Verifica că textul este lizibil la dimensiunile din LaTeX

---

## 🔧 Instalare Imagini în LaTeX

Asigură-te că folder `imagini/` există:
```bash
mkdir -p licenta_docs/imagini
```

Copiază toate PNG-urile acolo. LaTeX va compila și va include automat.

---

## ✅ Verificare

După ce completezi toate figurile:
1. Rulează: `pdflatex Licenta_StyleGenAI.tex` (în folder-ul de root)
2. Verifica că nu sunt warning-uri despre missing figures
3. Deschide PDF și verifica că figurile sunt prezente și lizibile
4. Asigură-te că caption-urile și label-urile sunt corecte

---

## 📌 Ordine Prioritate (dacă timpul e limitat)

**MUST HAVE (Esențiale):**
- ✅ Fig 1: System Architecture (overview complet)
- ✅ Fig 5: Complete Pipeline Flow (core algorithm)
- ✅ Fig 6: Correlation Plot (validation metric)

**SHOULD HAVE (Foarte importante):**
- Fig 2: Image Processing Pipeline (ilustrează procesul)
- Fig 7: Confusion Matrix (prezintă accuracy)
- Fig 8: Response Time Histogram (performance)

**NICE TO HAVE:**
- Fig 3: Color Spaces (educational, theoretical)
- Fig 4: Color Harmony Wheel (intuitive, visual)

---

## 📞 Contact / Questions
Dacă ai întrebări despre prompt-urile diagramelor, editeaza directamente în fișierul text din teza.
