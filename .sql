CREATE TABLE utenti (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password TEXT NOT NULL,
    ruolo VARCHAR NOT NULL CHECK (ruolo IN ('cliente', 'gestore', 'admin')),
    data_creazione TIMESTAMP NOT NULL DEFAULT NOW(),
    profile_image VARCHAR,
    isBanned BOOLEAN DEFAULT FALSE,
    numero_telefono TEXT,
    data_nascita DATE,
    descrizione TEXT
);


CREATE TABLE sedi (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR NOT NULL,
    descrizione TEXT,
    indirizzo VARCHAR NOT NULL,
    citta VARCHAR NOT NULL,
    provincia VARCHAR,
    cap VARCHAR(10),
    regione VARCHAR,
    latitudine DECIMAL(10, 7),
    longitudine DECIMAL(10, 7),
    attiva BOOLEAN DEFAULT TRUE,
    data_creazione TIMESTAMP DEFAULT NOW(),
    immagine VARCHAR
);



CREATE TABLE spazi (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    id_sede INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
    nome VARCHAR NOT NULL,
    descrizione TEXT,
    tipologia VARCHAR NOT NULL CHECK (tipologia IN ('postazione', 'ufficio', 'sala_riunioni')),
    capienza INTEGER,
    prezzo_orario DECIMAL(8,2) NOT NULL,
    attivo BOOLEAN DEFAULT TRUE,
    immagine VARCHAR
);



CREATE TABLE servizi (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR NOT NULL UNIQUE
);



CREATE TABLE spazi_servizi (
    id_spazio INTEGER REFERENCES spazi(id) ON DELETE CASCADE,
    id_servizio INTEGER REFERENCES servizi(id) ON DELETE CASCADE,
    PRIMARY KEY (id_spazio, id_servizio)
);

CREATE TABLE disponibilita (
    id SERIAL PRIMARY KEY,
    id_spazio INTEGER NOT NULL REFERENCES spazi(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    disponibile BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_time CHECK (end_at > start_at)
);


CREATE TABLE prenotazioni (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    id_utente INTEGER REFERENCES utenti(id) ON DELETE CASCADE,
    id_spazio INTEGER REFERENCES spazi(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    importo DECIMAL(8,2) NOT NULL,
    stato VARCHAR(20) DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'confermato', 'pagato', 'annullato')),
    id_transazione_pagamento VARCHAR,
    data_creazione TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gestori_sedi (
    id_utente INTEGER REFERENCES utenti(id) ON DELETE CASCADE,
    id_sede INTEGER REFERENCES sedi(id) ON DELETE CASCADE,
    PRIMARY KEY (id_utente, id_sede)
);
