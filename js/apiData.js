// js/apiData.js - Gerenciador do Banco de Dados de Miners

const APIData = {
  miners: null, // Será preenchido com MINERS_DATABASE
  indexed: {
    byName: new Map(),
    byId: new Map(),
    byLevel: new Map(),
    byType: new Map()
  },
  
  /**
   * Inicializa o módulo e cria índices para busca rápida
   */
  init() {
    console.log('🎯 Inicializando APIData...');
    
    if (typeof MINERS_DATABASE === 'undefined') {
      console.error('❌ MINERS_DATABASE não encontrado! Certifique-se de carregar data/minersData.js primeiro.');
      return false;
    }
    
    this.miners = MINERS_DATABASE;
    this.createIndexes();
    
    console.log(`✅ APIData carregado: ${this.miners.length} miners`);
    return true;
  },
  
  /**
   * Cria índices para busca rápida O(1)
   */
  createIndexes() {
    console.log('📊 Criando índices...');
    
    this.miners.forEach(miner => {
      // Índice por nome (lowercase para busca case-insensitive)
      const nameKey = miner.name.toLowerCase().trim();
      if (!this.indexed.byName.has(nameKey)) {
        this.indexed.byName.set(nameKey, []);
      }
      this.indexed.byName.get(nameKey).push(miner);
      
      // Índice por ID
      this.indexed.byId.set(miner.id, miner);
      
      // Índice por level
      if (!this.indexed.byLevel.has(miner.level)) {
        this.indexed.byLevel.set(miner.level, []);
      }
      this.indexed.byLevel.get(miner.level).push(miner);
      
      // Índice por tipo
      if (!this.indexed.byType.has(miner.type)) {
        this.indexed.byType.set(miner.type, []);
      }
      this.indexed.byType.get(miner.type).push(miner);
    });
    
    console.log(`✅ Índices criados: ${this.indexed.byName.size} nomes únicos`);
  },
  
  /**
   * Busca por nome exato (case-insensitive)
   * @param {string} name - Nome da miner
   * @returns {Array} Array de miners com esse nome (pode ter vários tiers)
   */
  findByName(name) {
    if (!name) return [];
    const key = name.toLowerCase().trim();
    return this.indexed.byName.get(key) || [];
  },
  
  /**
   * Busca miner por nome E power (para identificar tier exato)
   * @param {string} name - Nome da miner
   * @param {number} power - Power em H/s (não GH/s)
   * @param {number} tolerance - Tolerância em % (padrão 1% para compensar variações)
   * @returns {Object|null} Miner encontrada ou null
   */
  findByNameAndPower(name, power, tolerance = 0.01) {
    const candidates = this.findByName(name);
    if (candidates.length === 0) return null;
    
    // Tolerância de 1% ou mínimo de 100 H/s
    const toleranceValue = Math.max(100, power * tolerance);
    
    const found = candidates.find(m => {
      const diff = Math.abs(m.power - power);
      return diff < toleranceValue;
    });
    
    if (found) {
      //console.log(`✅ Match exato: ${name} (power: ${power} H/s) → Level ${found.level}`);
    } else {
      console.log(`⚠️ Não encontrado: ${name} (power: ${power} H/s). Candidatos:`, 
        candidates.map(m => `Level ${m.level}: ${m.power} H/s`).join(', '));
    }
    
    return found || null;
  },
  
  /**
   * Busca similar (tolera pequenas diferenças no nome)
   * Usa Levenshtein distance para encontrar nomes parecidos
   */
  findSimilar(name, maxDistance = 2) {
    if (!name) return [];
    
    const nameLower = name.toLowerCase().trim();
    const results = [];
    
    for (const [key, miners] of this.indexed.byName.entries()) {
      const distance = this.levenshteinDistance(nameLower, key);
      if (distance <= maxDistance) {
        results.push({
          distance: distance,
          miners: miners
        });
      }
    }
    
    // Ordena por distância (mais similar primeiro)
    results.sort((a, b) => a.distance - b.distance);
    
    return results.flatMap(r => r.miners);
  },
  
  /**
   * Calcula distância de Levenshtein entre duas strings
   * (quantas mudanças são necessárias para transformar uma na outra)
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substituição
            matrix[i][j - 1] + 1,     // inserção
            matrix[i - 1][j] + 1      // remoção
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  },
  
  /**
   * Obtém todos os tiers disponíveis de uma miner
   * @param {string} minerName - Nome da miner
   * @returns {Array} Array ordenado por level
   */
  getAllTiers(minerName) {
    const allTiers = this.findByName(minerName);
    
    // Ordena por level (0 = Common, 1 = Uncommon, etc)
    return allTiers.sort((a, b) => a.level - b.level);
  },
  
  /**
   * Busca por ID
   */
  findById(id) {
    return this.indexed.byId.get(id) || null;
  },
  
  /**
   * Filtra miners por múltiplos critérios
   */
  filter(criteria = {}) {
    let results = [...this.miners];
    
    // Filtro por tipo
    if (criteria.type) {
      results = results.filter(m => m.type === criteria.type);
    }
    
    // Filtro por level
    if (criteria.level !== undefined) {
      results = results.filter(m => m.level === criteria.level);
    }
    
    // Filtro por raridade (nome)
    if (criteria.rarity) {
      results = results.filter(m => 
        m.rarityGroup?.name === criteria.rarity.toLowerCase()
      );
    }
    
    // Filtro por power (range)
    if (criteria.power_min !== undefined) {
      results = results.filter(m => m.power >= criteria.power_min);
    }
    if (criteria.power_max !== undefined) {
      results = results.filter(m => m.power <= criteria.power_max);
    }
    
    // Filtro por bonus (range)
    if (criteria.bonus_min !== undefined) {
      results = results.filter(m => m.bonusPower >= criteria.bonus_min);
    }
    if (criteria.bonus_max !== undefined) {
      results = results.filter(m => m.bonusPower <= criteria.bonus_max);
    }
    
    // Filtro por largura
    if (criteria.width !== undefined) {
      results = results.filter(m => m.width === criteria.width);
    }
    
    // Filtro por vendável
    if (criteria.canBeSold !== undefined) {
      results = results.filter(m => m.canBeSold === criteria.canBeSold);
    }
    
    // Filtro por coleção
    if (criteria.collection) {
      results = results.filter(m => 
        m.collectionDescription.toLowerCase().includes(criteria.collection.toLowerCase())
      );
    }
    
    // Filtro: tem craft recipe? (é mergeable?)
    if (criteria.hasCraftRecipe !== undefined) {
      results = results.filter(m => 
        criteria.hasCraftRecipe ? m.craftRecipe.length > 0 : m.craftRecipe.length === 0
      );
    }
    
    return results;
  },
  
  /**
   * Busca miners por texto livre (nome, descrição, coleção)
   */
  search(query) {
    if (!query || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    
    return this.miners.filter(m => 
      m.name.toLowerCase().includes(queryLower) ||
      m.description.toLowerCase().includes(queryLower) ||
      m.collectionDescription.toLowerCase().includes(queryLower)
    );
  },
  
  /**
   * Obtém estatísticas do banco de dados
   */
  getStats() {
    const stats = {
      total: this.miners.length,
      byType: {},
      byLevel: {},
      byRarity: {},
      byWidth: {},
      totalSupply: 0,
      avgPower: 0,
      avgBonus: 0,
      canBeSold: 0,
      cantBeSold: 0,
      hasCraft: 0,
      noCraft: 0
    };
    
    let totalPower = 0;
    let totalBonus = 0;
    
    this.miners.forEach(m => {
      // Por tipo
      stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
      
      // Por level
      stats.byLevel[m.level] = (stats.byLevel[m.level] || 0) + 1;
      
      // Por raridade
      const rarity = m.rarityGroup?.title || 'Unknown';
      stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
      
      // Por largura
      stats.byWidth[m.width] = (stats.byWidth[m.width] || 0) + 1;
      
      // Supply
      stats.totalSupply += m.supply;
      
      // Power e bonus
      totalPower += m.power;
      totalBonus += m.bonusPower;
      
      // Vendável
      if (m.canBeSold) {
        stats.canBeSold++;
      } else {
        stats.cantBeSold++;
      }
      
      // Tem craft
      if (m.craftRecipe.length > 0) {
        stats.hasCraft++;
      } else {
        stats.noCraft++;
      }
    });
    
    stats.avgPower = Math.round(totalPower / this.miners.length);
    stats.avgBonus = Math.round(totalBonus / this.miners.length);
    
    return stats;
  },
  
  /**
   * Obtém as N miners com maior power
   */
  getTopByPower(n = 10) {
    return [...this.miners]
      .sort((a, b) => b.power - a.power)
      .slice(0, n);
  },
  
  /**
   * Obtém as N miners com maior bonus
   */
  getTopByBonus(n = 10) {
    return [...this.miners]
      .sort((a, b) => b.bonusPower - a.bonusPower)
      .slice(0, n);
  },
  
  /**
   * Verifica se uma miner é "mergeable" (tem receita de craft)
   */
  isMergeable(miner) {
    return miner.craftRecipe && miner.craftRecipe.length > 0;
  },
  
  /**
   * Obtém a próxima tier de uma miner (para merge)
   * @param {Object} miner - Miner atual
   * @returns {Object|null} Próxima tier ou null
   */
  getNextTier(miner) {
    const allTiers = this.getAllTiers(miner.name);
    const currentIndex = allTiers.findIndex(m => m.id === miner.id);
    
    if (currentIndex === -1 || currentIndex === allTiers.length - 1) {
      return null; // Não encontrou ou já é a última tier
    }
    
    return allTiers[currentIndex + 1];
  },
  
  /**
   * Debug: Mostra estatísticas no console
   */
  printStats() {
    const stats = this.getStats();
    
    console.log('\n📊 ESTATÍSTICAS DO BANCO DE DADOS');
    console.log('='.repeat(50));
    console.table({
      'Total de Miners': stats.total,
      'Supply Total': stats.totalSupply.toLocaleString(),
      'Power Médio': stats.avgPower.toLocaleString() + ' H/s',
      'Bonus Médio': stats.avgBonus,
      'Vendáveis': stats.canBeSold,
      'Não Vendáveis': stats.cantBeSold,
      'Com Craft Recipe': stats.hasCraft,
      'Sem Craft Recipe': stats.noCraft
    });
    
    console.log('\n📦 Por Tipo:');
    console.table(stats.byType);
    
    console.log('\n⭐ Por Raridade:');
    console.table(stats.byRarity);
    
    console.log('\n📏 Por Largura:');
    console.table(stats.byWidth);
    
    console.log('\n🏆 Top 10 por Power:');
    const top10 = this.getTopByPower(10);
    console.table(top10.map(m => ({
      Nome: m.name,
      Raridade: m.rarityGroup?.title || 'Unknown',
      Power: (m.power / 1e9).toFixed(2) + ' GH/s',
      Bonus: (m.bonusPower / 100).toFixed(2) + '%'
    })));
  }
};

// Auto-inicializa quando o script é carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => APIData.init());
} else {
  APIData.init();
}

// Exporta globalmente
window.APIData = APIData;
console.log('✅ APIData module loaded');