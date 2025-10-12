// js/api.js - Comunicação com a API do RollerCoin

const API = {
  /**
   * Busca dados completos do usuário
   */
  async getUserDataByNick(nick) {
    State.clearDebugInfo();
    const user = {};

    // 1. Buscar perfil público
    Utils.updateProgress(10, "Buscando perfil público...");
    const profileUrl = CONFIG.PROXY + encodeURIComponent(CONFIG.API_ENDPOINTS.PROFILE + nick);
    const profileRes = await fetch(profileUrl, {
      headers: CONFIG.HTTP_HEADERS
    });
    const profile = await profileRes.json();
    
    if (!profile.success) {
      throw new Error("Usuário não encontrado");
    }
    
    Object.assign(user, profile.data);
    State.addDebugInfo(`Perfil encontrado: ${user.name}, Avatar ID: ${user.avatar_id}`);

    // 2. Buscar dados de poder
    Utils.updateProgress(40, "Buscando dados de poder...");
    const powerUrl = CONFIG.PROXY + encodeURIComponent(CONFIG.API_ENDPOINTS.POWER + user.avatar_id);
    const powerRes = await fetch(powerUrl);
    const power = await powerRes.json();
    
    if (power.success) {
      user.powerData = power.data;
      State.addDebugInfo(`Dados de poder: Total=${power.data.current_power} GH/s, Bonus=${power.data.bonus} GH/s, Bonus%=${power.data.bonus_percent}`);
    }

    // 3. Carregar configuração da sala
    Utils.updateProgress(70, "Carregando configuração da sala...");
    const roomUrl = CONFIG.PROXY + encodeURIComponent(CONFIG.API_ENDPOINTS.ROOM + user.avatar_id);
    const roomRes = await fetch(roomUrl);
    const room = await roomRes.json();
    
    if (room.success) {
      user.roomData = room.data;
      
      // Adicionar labels de level às miners
      user.roomData.miners.forEach(m => {
        m.level_label = CONFIG.MINER_LEVELS[m.level] || "Unknown";
      });
      
      State.addDebugInfo(`Room data loaded: ${user.roomData.miners.length} miners, ${user.roomData.racks.length} racks`);
    }

    Utils.updateProgress(100, "Processando dados...");
    return user;
  },
  
  /**
   * Método auxiliar para fazer requisições com tratamento de erro
   */
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }
};

// Exportar para escopo global
window.API = API;