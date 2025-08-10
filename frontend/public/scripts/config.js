const config = {
    development: {
        apiUrl: "http://localhost:3000/api", // url dev
    },
    production: {
        apiUrl: "https://coworkspace.onrender.com/api", // URL di produzione
    },
};

const isProduction =
    window.location.hostname !== "localhost" &&
    !window.location.hostname.includes("127.0.0.1");

// Esporta la configurazione corretta
const apiConfig = isProduction ? config.production : config.development;
console.log("API base:", apiConfig.apiUrl);