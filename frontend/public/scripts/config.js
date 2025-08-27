const config = {
    development: {
        apiUrl: "http://localhost:3000/api", // url dev
    },
};

const apiConfig = config.development;
console.log("API base:", apiConfig.apiUrl);