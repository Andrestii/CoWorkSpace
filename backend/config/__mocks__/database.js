const fromMock = jest.fn(() => ({
    select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
            data: [{ id_utente: 1, prodotti: [], immagini_prodotti: [] }],
            error: null,
        })),
        maybeSingle: jest.fn(() => Promise.resolve({
            data: { id_utente: 1, prodotti: [] },
            error: null,
        })),
        single: jest.fn(() => Promise.resolve({
            data: { id_utente: 1 },
            error: null,
        })),
    })),
    insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
            data: { id_utente: 1 },
            error: null,
        })),
    })),
    update: jest.fn(() => ({
        eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
                data: { quantita: 5 },
                error: null,
            })),
        })),
    })),
    delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
    })),
}));

const supabase = { from: fromMock };

module.exports = supabase;
