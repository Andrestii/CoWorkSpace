# CoWorkSpace 🏢

Piattaforma web per la gestione di spazi di coworking distribuiti in tutta Italia.

---

## 🚀 Struttura dei Branch Git

| Branch   | Descrizione                                        |
|----------|----------------------------------------------------|
| `main`   | Produzione – solo codice stabile e testato         |
| `dev`    | Integrazione – merge di frontend e backend         |
| `front`  | Sviluppo frontend (HTML, CSS, JS, jQuery, Bootstrap) |
| `back`   | Sviluppo backend (Node.js + Express + JWT)         |

---

## 🖥 Avvio del progetto

Puoi avviare il progetto in **due modi**:  
1. **Locale (Node.js + Live Server)**  
2. **Docker Compose (containerizzati)**

---

### 🔧 Opzione 1 – Avvio in locale

#### Backend

```bash
cd backend
npm install
node index.js
```

Server attivo su: `http://localhost:3000`

#### Frontend

Apri direttamente:

```
frontend/public/index.html
```

oppure avvia un server locale (es. estensione **Live Server** di VSCode).

---

### 🐳 Opzione 2 – Avvio con Docker

Il progetto può essere avviato con **Docker Compose**, che gestisce separatamente **backend** e **frontend**.

#### Avvio container

```bash
docker compose up --build
```

#### Arresto dei container

```bash
docker compose down
```

#### Ricostruzione completa (dopo modifiche)

```bash
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up
```

#### 🌐 Servizi esposti

- **Backend** → `http://localhost:3000`  
- **Frontend** → `http://localhost:8080`  

#### 🔄 Aggiornamenti

- **Backend** → grazie a `nodemon` le modifiche vengono rilevate automaticamente e il server si riavvia.  
- **Frontend** → Se modifichi file HTML/CSS/JS è necessario ricostruire con:

```bash
docker compose up --build
```

---

## 📁 Struttura del progetto

```
coworkspace/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── assets/
│   │   ├── css/pagine/
│   │   ├── scripts/
│   │   └── partials/
├── backend/        → Express, API REST, JWT
├── .gitignore
└── README.md
```

---

## 📦 Tecnologie

- **Frontend**: HTML, CSS, JavaScript, Bootstrap, jQuery  
- **Backend**: Node.js, Express, JWT  
- **Database**: Supabase (PostgreSQL)  

---

## 📌 Workflow Git

```bash
# Unire frontend in dev
git checkout dev
git merge front

# Unire backend in dev
git merge back

# Preparare la produzione
git checkout main
git merge dev
```

---

## 📜 API Docs

Swagger disponibile su:

```
http://localhost:3000/api-docs/
```

---

## 🧪 Test

Tutti i test (unitari + integration) sono gestiti come **unit test** in Jest.  

```bash
cd backend
npm test
```

---

## 🗄️ Database (Supabase / PostgreSQL)

Schema principale (estratto da `.sql`):

- `utenti` → gestione utenti (`cliente`, `gestore`, `admin`)
- `sedi` → sedi coworking
- `spazi` → spazi interni alle sedi
- `servizi` + `spazi_servizi` → servizi offerti per ogni spazio
- `disponibilita` → gestione fasce orarie
- `prenotazioni` → prenotazioni utenti
- `pagamenti` → gestione transazioni
- `gestori_sedi` → associazione gestori ↔ sedi
