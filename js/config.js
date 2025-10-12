// js/config.js - Configurações e Constantes do Sistema

const CONFIG = {
  PROXY: "https://morning-thunder-0ce3.wminerrc.workers.dev/?",
  
  MINER_LEVELS: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Unreal'],
  
  API_ENDPOINTS: {
    PROFILE: 'https://rollercoin.com/api/profile/public-user-profile-data/',
    POWER: 'https://rollercoin.com/api/profile/user-power-data/',
    ROOM: 'https://rollercoin.com/api/game/room-config/'
  },
  
  AVATAR_BASE_URL: 'https://static.rollercoin.com/static/img/avatars/',
  
  HTTP_HEADERS: {
    "accept": "application/json, text/plain, */*",
    "accept-language": "pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
  }
};

// Exportar para escopo global
window.CONFIG = CONFIG;