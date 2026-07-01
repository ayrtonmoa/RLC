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
  perfilAnalisado(username, userData) {
    const powerEh = userData?.total_power
      ? (userData.total_power / 1e18).toFixed(2)
      : null;
    this.track('perfil_analisado', {
      username,
      league_id:  userData?.league_id  ?? null,
      league_name: userData?.league?.name ?? null,
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

  farmCsvExportado() {
    this.track('farm_csv_exportado');
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
