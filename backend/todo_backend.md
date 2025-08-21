# ✅ ToDo Backend – CoWorkSpace

### 📁 CONTROLLER / MODEL DA CREARE

#### 🏢 sediController.js / sediModel.js                               ste
- [x] GET /api/sedi → elenco sedi attive
- [x] GET /api/sedi/:id → dettagli sede
- [x] POST /api/sedi → crea sede (solo admin)
- [x] PUT /api/sedi/:id → modifica sede
- [x] DELETE /api/sedi/:id → disattiva sede (`attiva = false`)
- [x] PUT /api/sedi/:id → attiva sede (`attiva = true`)

#### 🧭 spaziController.js / spaziModel.js                              ste
- [x] GET /api/spazi?sede=ID → elenco spazi per sede
- [x] POST /api/spazi → crea spazio (gestore/admin)
- [x] PUT /api/spazi/:id → modifica spazio
- [x] DELETE /api/spazi/:id → disattiva spazio
- [x] PUT /api/spazi/:id → attiva spazio
- [x] POST /api/spazi/:id/servizi → collega servizi allo spazio

#### 🛎️ serviziController.js / serviziModel.js                          depa
- [x] GET /api/servizi → elenco servizi disponibili
- [x] POST /api/servizi → aggiungi nuovo servizio (solo admin)
- [x] DELETE /api/servizi/:id → disattiva servizio

#### 📅 disponibilitaController.js / disponibilitaModel.js              ste  
- [x] GET /api/disponibilita?id_spazio=ID&data=YYYY-MM-DD
- [x] POST /api/disponibilita → crea disponibilità (gestore/admin)
- [x] PUT /api/disponibilita/:id → modifica disponibilità
- [x] DELETE /api/disponibilita/:id → elimina disponibilità
- [x] GET /api/disponibilita/range?id_spazio=ID&from=YYYY-MM-DD&to=YYYY-MM-DD

#### 📆 prenotazioniController.js / prenotazioniModel.js                depa
- [x] POST /api/prenotazioni → crea prenotazione
- [x] GET /api/prenotazioni/utente → prenotazioni per utente loggato
- [x] PUT /api/prenotazioni/:id → cambia stato (confermato/pagato/annullato)
- [x] GET /api/prenotazioni/spazio/:id → per spazio (visibile ai gestori/admin)

#### 💳 pagamentiController.js / pagamentiModel.js                      ste
- [ ] POST /api/pagamenti/conferma → conferma pagamento e aggiorna stato prenotazione
- [ ] GET /api/pagamenti/storico → storico pagamenti utente

### 👥 gestoriSediController.js / gestoriSediModel.js                   depa
- [ ] POST /api/gestori-sedi → assegna gestore a una sede (solo admin)
- [ ] GET /api/gestori-sedi/:idGestore → restituisce le sedi gestite da un utente
- [ ] DELETE /api/gestori-sedi/:idGestore/:idSede → rimuove assegnazione (facoltativo)

---

### 🔐 MIDDLEWARE DI ACCESSO
- [x] auth.js → verifica JWT
- [x] isAdmin.js → solo ruolo admin
- [x] isGestore.js → ruolo gestore o admin

---

### 🔗 ROTTE DA REGISTRARE
- [x] `/api/sedi/`
- [x] `/api/spazi/`
- [ ] `/api/servizi/`
- [x] `/api/disponibilita/`
- [x] `/api/prenotazioni/`
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
- [x] Config GitHub Actions CI/CD
- [ ] Deploy su AWS o GCP (Firebase Hosting, App Engine, ECS…)

