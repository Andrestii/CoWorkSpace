const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rotte
const indexRoutes = require('./routes/index');
app.use('/api', indexRoutes);

// Avvio server
app.listen(PORT, () => {
    console.log(`Backend attivo su http://localhost:${PORT}`);
});
