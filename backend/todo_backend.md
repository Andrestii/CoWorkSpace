# ✅ ToDo Backend – CoWorkSpace

### 📁 CONTROLLER / MODEL DA CREARE

#### 🏢 sediController.js / sediModel.js
- [ ] GET /api/sedi → elenco sedi attive
- [ ] GET /api/sedi/:id → dettagli sede
- [ ] POST /api/sedi → crea sede (solo admin)
- [ ] PUT /api/sedi/:id → modifica sede
- [ ] DELETE /api/sedi/:id → disattiva sede (`attiva = false`)

#### 🧭 spaziController.js / spaziModel.js
- [ ] GET /api/spazi?sede=ID → elenco spazi per sede
- [ ] POST /api/spazi → crea spazio (gestore/admin)
- [ ] PUT /api/spazi/:id → modifica spazio
- [ ] DELETE /api/spazi/:id → disattiva spazio
- [ ] POST /api/spazi/:id/servizi → collega servizi allo spazio

#### 🛎️ serviziController.js / serviziModel.js
- [ ] GET /api/servizi → elenco servizi disponibili
- [ ] POST /api/servizi → aggiungi nuovo servizio (solo admin)
- [ ] DELETE /api/servizi/:id → elimina servizio

#### 📅 disponibilitaController.js / disponibilitaModel.js
- [ ] GET /api/disponibilita?id_spazio=ID&data=YYYY-MM-DD
- [ ] POST /api/disponibilita → crea disponibilità (gestore/admin)
- [ ] PUT /api/disponibilita/:id → modifica disponibilità

#### 📆 prenotazioniController.js / prenotazioniModel.js
- [ ] POST /api/prenotazioni → crea prenotazione
- [ ] GET /api/prenotazioni/utente → prenotazioni per utente loggato
- [ ] PUT /api/prenotazioni/:id → cambia stato (confermato/pagato/annullato)
- [ ] GET /api/prenotazioni/spazio/:id → per spazio (visibile ai gestori/admin)

#### 💳 pagamentiController.js / pagamentiModel.js
- [ ] POST /api/pagamenti/conferma → conferma pagamento e aggiorna stato prenotazione
- [ ] GET /api/pagamenti/storico → storico pagamenti utente

---

### 🔐 MIDDLEWARE DI ACCESSO
- [x] auth.js → verifica JWT
- [ ] isAdmin.js → solo ruolo admin
- [ ] isGestore.js → ruolo gestore o admin


### 👥 gestoriSediController.js / gestoriSediModel.js
- [ ] POST /api/gestori-sedi → assegna gestore a una sede (solo admin)
- [ ] GET /api/gestori-sedi/:idGestore → restituisce le sedi gestite da un utente
- [ ] DELETE /api/gestori-sedi/:idGestore/:idSede → rimuove assegnazione (facoltativo)

---

### 🔗 ROTTE DA REGISTRARE
- [ ] `/api/sedi/`
- [ ] `/api/spazi/`
- [ ] `/api/servizi/`
- [ ] `/api/disponibilita/`
- [ ] `/api/prenotazioni/`
- [ ] `/api/pagamenti/`
- [ ] `/api/gestori-sedi/`

---

### ✨ FUNZIONALITÀ EXTRA
- [ ] Email di notifica (conferma prenotazione, modifica disponibilità)
- [ ] Swagger per documentazione API
- [ ] Logging (con `winston` o simili)
- [ ] Validazione input con `Joi` o `express-validator`

---

### 🧪 TESTING
- [ ] Unit test per ogni model (Jest)
- [ ] Test API (Postman o Supertest)
- [ ] Mock utenti/sedi/prenotazioni per test demo

---

### 📦 DEPLOY (futuro)
- [ ] Dockerfile backend
- [ ] Config GitHub Actions CI/CD
- [ ] Deploy su AWS o GCP (Firebase Hosting, App Engine, ECS…)

