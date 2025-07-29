# CoWorkSpace 🏢

Piattaforma web per la gestione di spazi di coworking distribuiti in tutta Italia.

---

## 🚀 Struttura dei Branch Git

| Branch   | Descrizione                                        |
|----------|----------------------------------------------------|
| `main`   | Produzione – solo codice stabile e testato         |
| `dev`    | Integrazione – unione tra backend e frontend       |
| `front`  | Sviluppo frontend (HTML, CSS, JS, jQuery, Bootstrap) |
| `back`   | Sviluppo backend (Node.js + Express + JWT)         |

---

## 🖥 Avvio del progetto in locale

### 🔧 Backend

```bash
cd backend
npm install
node index.js
```

Server attivo su: `http://localhost:3000`

---

### 🧩 Frontend

Apri direttamente il file:

```
frontend/public/index.html
```

oppure avvia un server locale (es. con Live Server di VSCode)

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
- **Backend**: Node.js, Express, JWT, Bcrypt
- **Database (soon)**: PostgreSQL o MySQL
- **Deployment**: Docker + GitHub Actions (in futuro)

---

## 📌 Istruzioni merge Git

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