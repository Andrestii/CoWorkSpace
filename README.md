# CoWorkSpace 🏢

Piattaforma web per la gestione di spazi di coworking distribuiti in tutta Italia.

---

## 🚀 Struttura dei Branch Git

| Branch | Descrizione |
|--------|-------------|
| `main`  | Produzione – solo codice stabile e testato |
| `dev`   | Integrazione – unione tra backend e frontend |
| `front` | Sviluppo frontend (React + Vite + TypeScript) |
| `back`  | Sviluppo backend (Node.js + Express + JWT) |

---

## 🖥 Avvio del progetto in locale

### 🔧 Backend

```bash
cd backend
npm install
node app.js
```

Server attivo su: `http://localhost:3001`

---

### 🧩 Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend attivo su: `http://localhost:5173`

---

## 📁 Struttura del progetto

```
coworkspace/
├── frontend/   → React + Vite (UI)
├── backend/    → Express, API REST, JWT
├── .gitignore
└── README.md
```

---

## 📦 Tecnologie

- **Frontend**: React, TypeScript, Vite
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