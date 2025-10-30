// js/mergePrices.js - Sistema de Preços das Partes de Merge

const MergePrices = {
  // Preços padrão (atualizáveis pelo usuário)
  defaultPrices: {
    common: { part1: 0.001838, part2: 0.001890, part3: 0.001862 },
    uncommon: { part1: 0.1008, part2: 0.1008, part3: 0.1039 },
    rare: { part1: 2.25, part2: 2.11, part3: 2.14 },
    epic: { part1: 22.78, part2: 23.62, part3: 23.10 },
    legendary: { part1: 5.04, part2: 19.95, part3: 83.895 }
  },

  // Taxas de merge fixas do jogo
  mergeFees: {
    'Common': 0.04,
    'Uncommon': 0.14,
    'Rare': 0.50,
    'Epic': 1.00,
    'Legendary': 5.00
  },

  /**
   * Carregar preços do localStorage ou usar padrão
   */
  load() {
    try {
      const saved = localStorage.getItem('rollercoin_merge_prices');
      if (saved) {
        console.log('✅ Preços carregados do localStorage');
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao carregar preços:', e);
    }
    console.log('📋 Usando preços padrão');
    return JSON.parse(JSON.stringify(this.defaultPrices));
  },

  /**
   * Salvar preços no localStorage
   */
  save(prices) {
    try {
      localStorage.setItem('rollercoin_merge_prices', JSON.stringify(prices));
      console.log('💾 Preços salvos com sucesso!');
      return true;
    } catch (e) {
      console.error('Erro ao salvar preços:', e);
      return false;
    }
  },

  /**
   * Resetar para preços padrão
   */
  reset() {
    localStorage.removeItem('rollercoin_merge_prices');
    console.log('🔄 Preços resetados para padrão');
    return JSON.parse(JSON.stringify(this.defaultPrices));
  },

  /**
   * Obter taxa de merge por nível
   */
  getMergeFee(level) {
    return this.mergeFees[level] || 0.14;
  },

  /**
   * Parser de preços da página Parts
   */
  parseFromText(text) {
    console.log('🔍 Iniciando parse de preços...');
    
    const prices = {
      common: { part1: null, part2: null, part3: null },
      uncommon: { part1: null, part2: null, part3: null },
      rare: { part1: null, part2: null, part3: null },
      epic: { part1: null, part2: null, part3: null },
      legendary: { part1: null, part2: null, part3: null }
    };

    const partMap = { 'Fan': 'part1', 'Wire': 'part2', 'Hashboard': 'part3' };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    console.log('📝 Total de linhas:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let level = null;
      let partName = null;
      
      // Detectar "Common Fan" ou "Common" + "Fan" (próxima linha)
      const matchSameLine = line.match(/^(Common|Uncommon|Rare|Epic|Legendary)\s+(Fan|Wire|Hashboard)$/i);
      
      if (matchSameLine) {
        level = matchSameLine[1].toLowerCase();
        partName = matchSameLine[2];
        console.log(`  ✓ [${i}] ${level} ${partName}`);
      } else {
        const matchLevel = line.match(/^(Common|Uncommon|Rare|Epic|Legendary)$/i);
        if (matchLevel && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const matchPart = nextLine.match(/^(Fan|Wire|Hashboard)$/i);
          
          if (matchPart) {
            level = matchLevel[1].toLowerCase();
            partName = matchPart[1];
            console.log(`  ✓ [${i}-${i+1}] ${level} ${partName}`);
          }
        }
      }
      
      if (level && partName) {
        const partKey = partMap[partName];

        // Procurar preço nas próximas 10 linhas
        for (let j = i + 1; j < i + 11 && j < lines.length; j++) {
          const priceLine = lines[j];
          const priceMatch = priceLine.match(/([\d\s.,]+)\s*RLT?/i);
          
          if (priceMatch) {
            let priceStr = priceMatch[1].replace(/\s/g, '');
            
            // Converter vírgula para ponto decimal
            if (priceStr.includes(',') && !priceStr.includes('.')) {
              priceStr = priceStr.replace(',', '.');
            } else if (priceStr.includes('.') && priceStr.includes(',')) {
              if (priceStr.lastIndexOf(',') > priceStr.lastIndexOf('.')) {
                priceStr = priceStr.replace(/\./g, '').replace(',', '.');
              } else {
                priceStr = priceStr.replace(/,/g, '');
              }
            }
            
            const price = parseFloat(priceStr);
            
            if (!isNaN(price) && price > 0) {
              prices[level][partKey] = price;
              console.log(`      ✅ ${level} ${partName} = ${price} RLT`);
              break;
            }
          }
        }
      }
    }

    // Validar se todos os preços foram encontrados
    let missingCount = 0;
    let missingList = [];
    
    Object.keys(prices).forEach(level => {
      Object.keys(prices[level]).forEach(part => {
        if (prices[level][part] === null) {
          missingCount++;
          missingList.push(`${level} ${part}`);
        }
      });
    });

    if (missingCount > 0) {
      throw new Error(`Faltam ${missingCount} preços: ${missingList.join(', ')}`);
    }

    console.log('✅ Parse de preços concluído!');
    return prices;
  }
};

window.MergePrices = MergePrices;
console.log('✅ MergePrices loaded');