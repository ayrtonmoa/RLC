// data/state.js - Gerenciamento de Estado Global

console.log('Carregando State...');

(function() {
  'use strict';
  
  const State = {
    userData: null,
    userDataOriginal: null,
    debugInfo: [],
    minersRemovidasTemporariamente: [],
    
    // Getters
    getUserData: function() {
      return this.userData;
    },
    
    getDebugInfo: function() {
      return this.debugInfo;
    },
    
    getMinersRemovidas: function() {
      return this.minersRemovidasTemporariamente;
    },
    
    // Setters
    setUserData: function(data) {
      this.userData = data;
      // Guardar cópia completa dos dados originais (deep copy)
      this.userDataOriginal = JSON.parse(JSON.stringify(data));
    },
    
    addDebugInfo: function(info) {
      this.debugInfo.push(info);
      console.log('DEBUG:', info);
    },
    
    clearDebugInfo: function() {
      this.debugInfo = [];
    },
    
    addMinerRemovida: function(miner) {
      this.minersRemovidasTemporariamente.push(miner);
    },
    
    clearMinersRemovidas: function() {
      this.minersRemovidasTemporariamente = [];
    },
    
    // Métodos de manipulação de miners
    removerMiner: function(minerIndex) {
      if (!this.userData || !this.userData.roomData) return false;
      
      const miner = this.userData.roomData.miners[minerIndex];
      if (!miner) return false;
      
      this.minersRemovidasTemporariamente.push(miner);
      this.userData.roomData.miners.splice(minerIndex, 1);
      
      return true;
    },
    
    restaurarMiners: function() {
      if (!this.userData || !this.userDataOriginal) return 0;

      const quantidade = this.minersRemovidasTemporariamente.length;

      // Restaurar tudo aos valores originais (deep copy da cópia salva)
      this.userData.roomData.miners = JSON.parse(JSON.stringify(this.userDataOriginal.roomData.miners));
      this.userData.powerData = JSON.parse(JSON.stringify(this.userDataOriginal.powerData));

      this.minersRemovidasTemporariamente = [];

      return quantidade;
    },
    
    // Reset completo
    reset: function() {
      this.userData = null;
      this.userDataOriginal = null;
      this.debugInfo = [];
      this.minersRemovidasTemporariamente = [];
    }
  };

  // Exportar para escopo global
  window.State = State;
  
  // Log de carregamento
  console.log('✅ State carregado com sucesso!', State);
  
})();