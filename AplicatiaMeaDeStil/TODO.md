# 📋 TODO List - StyleGenAI

## 🔥 Prioritate ÎNALTĂ

### Autentificare & Securitate
- [ ] **Forgot Password / Resetare parolă**
  - Endpoint backend pentru solicitare reset parolă (trimite email cu link/token)
  - Pagină frontend pentru introducere email
  - Endpoint backend pentru validare token și setare parolă nouă
  - Pagină frontend pentru introducere parolă nouă
  - Integrare serviciu email (SendGrid, AWS SES, etc.)

### Bug Fixes
- [x] Rezolvat problema FOREIGN KEY constraint la salvare outfit
- [x] Adăugat verificare user exists în database
- [x] Logout automat când token-ul este invalid

## 🚀 Funcționalități Noi

### Profil & Cont
- [ ] Editare profil utilizator
  - Schimbare email
  - Schimbare parolă (din profil)
  - Ștergere cont
- [ ] Avatar personalizat (upload imagine)
- [ ] Preferințe utilizator (stil preferat, sezon, etc.)

### Ținute & Garderobă
- [ ] Organizare ținute în colecții/categorii
- [ ] Partajare ținute pe social media
- [ ] Export ținute ca PDF/imagine
- [ ] Notițe pentru fiecare ținută salvată
- [ ] Tag-uri personalizate pentru ținute

### Social Features
- [ ] Sistem de rating pentru ținute
- [ ] Comentarii la ținute (dacă devine social)
- [ ] Feed public cu ținute populare

### Notificări
- [ ] Notificări push pentru tendințe noi
- [ ] Reminder-e pentru sezon (ex: "Vremea se răcește, vezi ținute de toamnă")
- [ ] Notificări când admin adaugă resurse noi

### Analytics & Insights
- [ ] Dashboard personal - statistici despre stilul tău
- [ ] Cele mai folosite culori/stiluri
- [ ] Recomandări bazate pe istoric

## 🎨 Îmbunătățiri UI/UX

- [ ] Dark mode
- [ ] Animații smooth la tranziții
- [ ] Skeleton loaders pentru loading states
- [ ] Swipe gestures pentru navigare
- [ ] Tutorial/Onboarding pentru utilizatori noi
- [ ] Responsive design îmbunătățit pentru tablete

## 🔧 Îmbunătățiri Tehnice

### Performance
- [ ] Caching imagini pentru loading mai rapid
- [ ] Lazy loading pentru liste mari
- [ ] Optimizare imagini (compression, resize)
- [ ] Service Worker pentru offline support

### Backend
- [ ] Rate limiting pentru API-uri
- [ ] Logging mai detaliat (Winston/Morgan)
- [ ] Backup automat bază de date
- [ ] Migrare la producție (Docker, Cloud deployment)
- [ ] CDN pentru imagini statice
- [ ] Redis pentru caching

### Securitate
- [ ] Rate limiting pentru login (prevenire brute force)
- [ ] 2FA (Two-Factor Authentication)
- [ ] Audit log pentru acțiuni importante
- [ ] Sanitizare mai bună a input-urilor
- [ ] HTTPS obligatoriu în producție

## 📱 Mobile Native Features

- [ ] Acces la cameră nativă îmbunătățit
- [ ] Acces la galerie cu selecție multiplă
- [ ] Notificări push native
- [ ] Biometric authentication (Face ID, Touch ID)
- [ ] Share sheet nativ

## 🌍 Internationalizare

- [ ] Suport multi-limbă (RO, EN, FR, etc.)
- [ ] Format dată/oră localizat
- [ ] Suport pentru valute diferite (dacă se adaugă shopping)

## 💡 Features Avansate (Viitor Îndepărtat)

- [ ] AI Chatbot pentru sfaturi de stil
- [ ] Virtual Try-On îmbunătățit cu AR
- [ ] Integrare cu magazine online (affiliate links)
- [ ] Recomandări bazate pe weather API
- [ ] Calendar de outfit-uri planificate
- [ ] Garderobă digitală completă cu inventar

---

## 📝 Notițe

- Prioritizați funcționalitățile bazate pe feedback utilizatori
- Testați fiecare feature înainte de merge în main
- Documentați fiecare API nou adăugat
- Păstrați backward compatibility când e posibil

**Ultima actualizare:** 3 Decembrie 2025
