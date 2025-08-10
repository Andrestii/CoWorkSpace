// Funzione helper per generare le <i> corrette
function renderStars(value) {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let html = "";
    for (let i = 0; i < full; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    if (half) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < empty; i++) {
        html += '<i class="far fa-star"></i>';
    }
    return html;
}
