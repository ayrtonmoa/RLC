// js/analytics.js - Rastreamento centralizado de eventos

const Analytics = {
  // Só dispara fora do localhost
  _ok() {
    return typeof gtag === 'function'
      && location.hostname !== 'localhost'
      && location.hostname !== '127.0.0.1'
      && location.protocol !== 'file:';
  },

  track(event, params = {}) {
    if (!this._ok()) return;
    gtag('event', event, params);
  },

  // ── Navegação ──────────────────────────────────────────
  tabView(tabName) {
    this.track('tab_view', { tab_name: tabName });
  },

  // ── Perfil ─────────────────────────────────────────────
  // current_power vem da API em GH/s (ver api.js), não em Hz cru, daí o /1e9 pra virar Eh/s
  // (1 Eh = 1e9 GH). Os campos originais aqui (userData.total_power, userData.league.name)
  // não existem na resposta da API, então esse evento sempre mandou power_eh e league_name
  // nulos desde que foi escrito.
  perfilAnalisado(username, userData) {
    const currentPowerGh = userData?.powerData?.current_power;
    const powerEh = currentPowerGh ? (currentPowerGh / 1e9).toFixed(2) : null;
    this.track('perfil_analisado', {
      username,
      league_id:  userData?.league_id  ?? null,
      league_name: userData?.league?.title?.pt || userData?.league?.title?.en || null,
      power_eh:   powerEh,
    });
  },

  perfilErro(username, errorMessage) {
    this.track('perfil_erro', { username, error_message: errorMessage });
  },

  // ── Farm Calculator ────────────────────────────────────
  farmCalculado(bestCrypto, cryptoCount) {
    this.track('farm_calculado', {
      best_crypto:  bestCrypto ?? null,
      crypto_count: cryptoCount ?? null,
    });
  },

  // ── Parts Calculator ───────────────────────────────────
  partsCalculado(mode, partsCount) {
    this.track('parts_calculado', {
      mode,           // 'normal' | 'reverso'
      parts_count: partsCount,
    });
  },

  // ── Inventário ─────────────────────────────────────────
  inventarioAnalisado(minersCount) {
    this.track('inventario_analisado', { miners_count: minersCount });
  },

  mergePlannerVisto(prontos, faltaPartes, faltaMiners) {
    this.track('merge_planner_visto', {
      prontos,
      falta_partes: faltaPartes,
      falta_miners: faltaMiners,
    });
  },

  mergeSortUsado(mode) {
    this.track('merge_sort_usado', { mode });
  },

  // ── Dark mode ──────────────────────────────────────────
  darkModeAlternado(mode) {
    this.track('dark_mode_alternado', { mode }); // 'dark' | 'light'
  },
};

window.Analytics = Analytics;
console.log('✅ Analytics loaded');
