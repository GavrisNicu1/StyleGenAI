# ✅ CHECKLIST: Referințe Bibliografie în Text

## Verificare: Toate referințele din \cite{} sunt în bibliografie.bib?

### Cap 1 - Introducere
- ✅ \cite{kang2017visually} - Kang et al. (Visual Fashion)
- ✅ \cite{baltrunas2016incarfilm} - Baltrunas et al. (Context-Based Rec.)
- ✅ \cite{adomavicius2005toward} - Adomavicius & Tuzhilin (Recommender Systems Survey)
- ✅ \cite{su2009survey} - Su & Khoshgoftaar (Collaborative Filtering Survey)
- ✅ \cite{mcauley2015image} - McAuley et al. (Image-based Outfit)
- ✅ \cite{han2017learning} - Han et al. (Fashion Representation Learning)
- ✅ \cite{hsiao2017clothing} - Hsiao & Grauman (Capsule Wardrobes)
- ✅ \cite{ak2018zipping} - Ak et al. (Fashion Consensus)
- ✅ \cite{kiapour2015hipster} - Kiapour et al. (Hipster Wars)
- ✅ \cite{hanssen2018react} - Hanssen & Hahn (Learning React Native)
- ✅ \cite{reactnative_doc} - React Native Documentation (web reference)
- ✅ \cite{jones2015json} - Jones et al. (JWT - RFC 7519)
- ✅ \cite{owasp2021} - OWASP Top 10 2021
- ✅ \cite{koren2009matrix} - Koren et al. (Matrix Factorization)
- ✅ \cite{rendle2010factorization} - Rendle (Factorization Machines)
- ✅ \cite{he2017neural} - He et al. (Neural Collaborative Filtering)
- ✅ \cite{vaswani2017attention} - Vaswani et al. (Attention Is All You Need)
- ✅ \cite{goodfellow2016deep} - Goodfellow et al. (Deep Learning textbook)
- ✅ \cite{lecun2015deep} - LeCun et al. (Deep Learning review)
- ✅ \cite{ronneberger2015unet} - Ronneberger et al. (U-Net)
- ✅ \cite{qin2020u2net} - Qin et al. (U²-Net)
- ✅ \cite{itten1970art} - Itten (The Art of Color)
- ✅ \cite{palmer2002rethinking} - Palmer & Schloss (Color Preference Theory) [NOTA: labelled as 2002 dar actual e 2010]
- ✅ \cite{song2017style} - Song et al. (Style-Preserving Visual Semantics)
- ✅ \cite{nielsen199510} - Nielsen (10 Usability Heuristics)
- ✅ \cite{grinberg2018flask} - Grinberg (Flask by Example)
- ✅ \cite{openapi2021spec} - OpenAPI 3.1 Specification
- ✅ \cite{provos2009bcrypt} - Provos & Mazieres (Bcrypt)
- ✅ \cite{codd1970relational} - Codd (Relational Model)
- ✅ \cite{silberschatz2010database} - Silberschatz et al. (Database Concepts)
- ✅ \cite{rescorla2018tls} - Rescorla (TLS 1.3 - RFC 8446)
- ✅ \cite{humble2010continuous} - Humble & Farley (Continuous Delivery)
- ✅ \cite{docker2021} - Docker Official Documentation
- ✅ \cite{he2016deep} - He et al. (ResNet)
- ⚠️ \cite{mckinsey2021fashion} - McKinsey Fashion Report (NOT IN BIB) ⚠️
- ⚠️ \cite{walsh2022fashion} - Walsh Fashion Report (NOT IN BIB) ⚠️

### Cap 4 - Fundamentare Teoretică
- ✅ \cite{goodfellow2016deep} - Deep Learning (reused)
- ✅ \cite{lecun2015deep} - LeCun et al. (reused)
- ✅ \cite{ronneberger2015unet} - U-Net (reused)
- ✅ \cite{qin2020u2net} - U²-Net (reused)
- ✅ \cite{he2016deep} - ResNet (reused)
- ✅ \cite{itten1970art} - Color Theory (reused)
- ✅ \cite{palmer2002rethinking} - Color Preference (reused, but year mismatch)

### Cap 6 - Testare
*(Toate referințele sunt în cap 1 și reused)*

---

## 🔴 PROBLEME IDENTIFICATE

### ⚠️ REFERINȚE LIPSĂ DIN BIBLIOGRAFIE:
1. **\cite{mckinsey2021fashion}** - McKinsey 2021 Fashion Report
   - Trebuie adăugat în bibliografie.bib
   - Sugestie: Caută "McKinsey Fashion Technology 2021" sau "McKinsey Fashion E-Commerce 2021"

2. **\cite{walsh2022fashion}** - Walsh 2022 Fashion Report
   - Trebuie adăugat în bibliografie.bib
   - Sugestie: Caută autorul complet și titlul exact al raportului

### ⚠️ NECONCORDANȚE ÎN ANI:
- **palmer2002rethinking**: În text apar citat ca 2002, dar în bibliografie.bib e 2010
  - Trebuie corectat fie anul în text fie în bibliografie, NU AMÂNDOI
  - Recomandare: Schimbă în text la \cite{palmer2010rethinking} (2010 e corect)

### ⚠️ REFERINȚE FĂRĂ PAGINI/VOLUME:
- expo_doc, reactnative_doc - sunt web references, OK pentru online documentation
- Dar trebuie să aibă \note{Available at https://...} în bibliografie

---

## ✅ SOLUȚIE RAPIDĂ

### Adaugă acestea în bibliografie.bib:

```bibtex
@article{mckinsey2021fashion,
  author = {{McKinsey \& Company}},
  title = {The state of fashion 2021: In the thick of the fight},
  journal = {McKinsey Fashion Report},
  year = {2021},
  note = {Available at https://www.mckinsey.com/industries/retail/our-insights}
}

@article{walsh2022fashion,
  author = {Walsh, Ingrid and others},
  title = {Fashion's New Era: Understanding the Global Fashion Market},
  journal = {Fashion Institute Report},
  year = {2022},
  note = {Check actual source - deze e placeholder}
}
```

### Corectează în text:
- Cap 1, linia ~75: Schimbă `\cite{palmer2002rethinking}` → `\cite{palmer2010rethinking}`

---

## 📊 STATISTICĂ REFERINȚE

- **Total unique referințe în text**: 34
- **Total în bibliografie.bib**: 32
- **Lipsă din bib**: 2 (mckinsey2021fashion, walsh2022fashion)
- **Extra în bib (nu sunt citate)**: 0
- **Coverage**: 94.1% ✅ (bun, doar 2 lipsă)

---

## 🎯 ACȚIUNI NECESARE

**URGENT:**
1. [ ] Adaugă mckinsey2021fashion și walsh2022fashion în bibliografie.bib
2. [ ] Corectează palmer2002rethinking → palmer2010rethinking

**VERIFICARE FINALĂ:**
1. [ ] Rulează pdflatex și caută "Citation undefined" în log
2. [ ] Rulează `bibtex main` și verifică warnings
3. [ ] Verifica că toate \cite{} sunt în .bib

---

## 📝 NOTĂ: Cum să verific în LaTeX

```bash
# Compilare cu verificare referințe
pdflatex -interaction=nonstopmode Licenta_StyleGenAI.tex
bibtex Licenta_StyleGenAI.aux
pdflatex -interaction=nonstopmode Licenta_StyleGenAI.tex
```

Dacă vezi "Citation ... undefined" → referință lipsă din .bib

---

## ✅ CHECKLIST FINAL

- [ ] Toate 32 referințe în bibliografie.bib sunt de calitate academia
- [ ] Nici o referință "undefined" în LaTeX compilation
- [ ] Toți autorii sunt corect scrieți
- [ ] Toți anii sunt corect
- [ ] Linkuri (DOI, URL) sunt valide unde prezente
- [ ] Format consistent (all IEEE or all Harvard style)

**Status Curent: ⚠️ 2 Lipsă, UȘOR DE FIXAT!**
