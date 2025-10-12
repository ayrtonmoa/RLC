// js/calculations.js - Cálculos de Impacto (VERSÃO CORRIGIDA - Duplicatas)

const Calculations = {
  /**
   * Calcula o impacto de cada miner individualmente
   * CORREÇÃO: Miners duplicadas não perdem bônus de coleção
   */
  calcularImpactos(user) {
    const racks = user.roomData.racks || [];
    const allMiners = user.roomData.miners || [];
    
    // Criar mapa de bônus por rack
    const rackFactorById = {};
    racks.forEach(r => {
      rackFactorById[r._id] = (r.bonus || 0) / 10000;
      State.addDebugInfo(`Rack ${r.name}: Bonus = ${(r.bonus/100)}% (${r.bonus/10000})`);
    });
    
    const poderTotalAtual = user.powerData.current_power;
    const baseTotalMiners = allMiners.reduce((sum, m) => sum + m.power, 0);
    const bonusPercentualAtual = user.powerData.bonus_percent / 10000;
    const bonusPowerAtual = user.powerData.bonus;
    
    State.addDebugInfo("=== ESTADO ATUAL DA REDE ===");
    State.addDebugInfo(`Poder total: ${Utils.formatPower(poderTotalAtual * 1e9)}`);
    State.addDebugInfo(`Base miners: ${Utils.formatPower(baseTotalMiners * 1e9)}`);
    State.addDebugInfo(`Bônus % (raw): ${user.powerData.bonus_percent} -> ${(bonusPercentualAtual * 100).toFixed(2)}%`);
    State.addDebugInfo(`Bônus power: ${Utils.formatPower(bonusPowerAtual * 1e9)}`);

    // 🔥 IDENTIFICAR PRIMEIRA OCORRÊNCIA DE CADA TIPO (nome + level)
    const primeiraOcorrenciaPorTipo = {};
    allMiners.forEach((m, index) => {
      const chaveTipo = m.name + '|' + m.level_label;
      if (!primeiraOcorrenciaPorTipo[chaveTipo]) {
        primeiraOcorrenciaPorTipo[chaveTipo] = index;
      }
    });
    
    State.addDebugInfo(`=== IDENTIFICAÇÃO DE DUPLICATAS ===`);
    Object.entries(primeiraOcorrenciaPorTipo).forEach(([tipo, index]) => {
      const count = allMiners.filter(m => (m.name + '|' + m.level_label) === tipo).length;
      if (count > 1) {
        State.addDebugInfo(`🔍 ${tipo}: ${count} unidades - Primeira: índice #${index}`);
      }
    });

    const impacts = allMiners.map((m, index) => {
      const basePowerGHS = m.power;
      const rackBonusFactor = rackFactorById[m.placement.user_rack_id] || 0;
      const chaveTipo = m.name + '|' + m.level_label;
      
      // 🎯 DETERMINAR SE É A PRIMEIRA OCORRÊNCIA DESTE TIPO
      const ehPrimeiraDoTipo = primeiraOcorrenciaPorTipo[chaveTipo] === index;
      
      // Se é primeira do tipo, remover ela causa perda do bônus de coleção
      // Se é duplicata, remover ela NÃO causa perda do bônus (outra ainda está lá)
      const minerBonusPercent = ehPrimeiraDoTipo ? (m.bonus_percent / 10000) : 0;
      
      const novaBaseTotal = baseTotalMiners - basePowerGHS;
      const novoBonusPercentual = bonusPercentualAtual - minerBonusPercent;
      const novoBonusPower = novaBaseTotal * novoBonusPercentual;
      
      const perdaRackBonus = basePowerGHS * rackBonusFactor;
      const novoRackBonus = user.powerData.racks - perdaRackBonus;
      
      const novoPoderTotal = novaBaseTotal + novoBonusPower + novoRackBonus + user.powerData.games + user.powerData.temp;
      const impactoReal = poderTotalAtual - novoPoderTotal;
      
      const perdaBase = basePowerGHS;
      const perdaBonusDeColecao = baseTotalMiners * minerBonusPercent;
      const perdaBonusProprioBonus = basePowerGHS * bonusPercentualAtual;

      // Log para duplicatas
      if (!ehPrimeiraDoTipo) {
        State.addDebugInfo(`⚠️ DUPLICATA: ${m.name} (${m.level_label}) #${index} - Impacto: ${Utils.formatPower(impactoReal * 1e9)} (SEM bônus coleção)`);
      }

      return { 
        name: m.name, 
        level: m.level_label, 
        basePower: basePowerGHS,
        minerBonusPercent: m.bonus_percent / 10000, // Valor original para exibição
        minerBonusPercentAplicado: minerBonusPercent, // Valor aplicado no cálculo (0 se duplicata)
        rackBonus: rackBonusFactor, 
        impact: impactoReal,
        perdaBase: perdaBase,
        perdaBonusBase: perdaBonusDeColecao,
        perdaBonusPropia: perdaBonusProprioBonus,
        perdaRackBonus: perdaRackBonus,
        novoPoderTotal: novoPoderTotal,
        rackId: m.placement.user_rack_id,
        position: m.placement,
        minerIndex: index,
        width: m.width || 2,
        isDuplicate: !ehPrimeiraDoTipo,
        isFirstOfType: ehPrimeiraDoTipo,
        tipoKey: chaveTipo
      };
    });

    const totalImpactoCalculado = impacts.reduce((s, m) => s + m.impact, 0);
    impacts.forEach(m => m.impactPercent = (totalImpactoCalculado > 0) ? (m.impact / totalImpactoCalculado) * 100 : 0);

    return impacts.sort((a, b) => b.impact - a.impact);
  },
  
  /**
   * Conta miners únicas (diferentes nome+level)
   */
  calcularMinersUnicas(impacts) {
    const uniqueSet = new Set();
    impacts.forEach(m => {
      uniqueSet.add(m.name + '|' + m.level);
    });
    return uniqueSet.size;
  },
  
  /**
   * Recalcula poder total após remoção de miners
   */
  recalcularPoderTotal(userData) {
    if (!userData) return;
    
    const novaBaseTotalMiners = userData.roomData.miners.reduce((sum, miner) => sum + miner.power, 0);
    
    const uniqueMiners = userData.roomData.miners.filter((miner, index, self) =>
      index === self.findIndex((m) => m.miner_id === miner.miner_id)
    );
    const novoBonusPercentTotal = uniqueMiners.reduce((sum, miner) => sum + miner.bonus_percent, 0);
    const novoBonusPower = novaBaseTotalMiners * (novoBonusPercentTotal / 10000);
    
    const rackBonusOriginal = userData.powerData.racks;
    const baseTotalOriginal = novaBaseTotalMiners + State.getMinersRemovidas().reduce((sum, m) => sum + m.power, 0);
    const novoRackBonus = baseTotalOriginal > 0 ? rackBonusOriginal * (novaBaseTotalMiners / baseTotalOriginal) : 0;
    
    userData.powerData.current_power = novaBaseTotalMiners + novoBonusPower + novoRackBonus + userData.powerData.games + userData.powerData.temp;
    userData.powerData.bonus = novoBonusPower;
    userData.powerData.bonus_percent = novoBonusPercentTotal;
    userData.powerData.racks = novoRackBonus;
  },
  
  /**
   * Recalcula para o poder original (desfazer remoções)
   */
  recalcularPoderOriginal(userData) {
    if (!userData) return;
    
    const baseTotalMiners = userData.roomData.miners.reduce((sum, miner) => sum + miner.power, 0);
    const uniqueMiners = userData.roomData.miners.filter((miner, index, self) =>
      index === self.findIndex((m) => m.miner_id === miner.miner_id)
    );
    const bonusPercentTotal = uniqueMiners.reduce((sum, miner) => sum + miner.bonus_percent, 0);
    const bonusPower = baseTotalMiners * (bonusPercentTotal / 10000);
    
    userData.powerData.current_power = baseTotalMiners + bonusPower + userData.powerData.racks + userData.powerData.games + userData.powerData.temp;
    userData.powerData.bonus = bonusPower;
    userData.powerData.bonus_percent = bonusPercentTotal;
  },
  
  /**
   * Calcula melhor troca para uma miner do inventário
   */
  calcularMelhorTrocaPorMiner(minerInventario, userData) {
    if (!userData) return null;
    
    const impacts = this.calcularImpactos(userData);
    const allMiners = userData.roomData.miners;
    
    // Separar miners por células
    const miners1Cell = [];
    const miners2Cell = [];
    
    impacts.forEach((impact) => {
      const minerOriginal = allMiners[impact.minerIndex];
      if (minerOriginal) {
        const cells = minerOriginal.width || 2;
        
        if (cells === 1) {
          miners1Cell.push(impact);
        } else {
          miners2Cell.push(impact);
        }
      }
    });
    
    // Ordenar do menor para o maior impacto
    miners1Cell.sort((a, b) => a.impact - b.impact);
    miners2Cell.sort((a, b) => a.impact - b.impact);
    
    // Calcular ganho ao adicionar
    const baseTotalAtual = allMiners.reduce((sum, m) => sum + m.power, 0);
    const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
    const poderTotalAtual = userData.powerData.current_power;
    
    const minersUnicasAtuais = new Set();
    const uniqueMinersAtuais = allMiners.filter((miner, index, self) =>
      index === self.findIndex((m) => m.miner_id === miner.miner_id)
    );
    uniqueMinersAtuais.forEach(m => {
      minersUnicasAtuais.add(m.name + '|' + (CONFIG.MINER_LEVELS[m.level] || 'Unknown'));
    });
    
    const chaveMiner = minerInventario.name + '|' + minerInventario.level;
    const jaPossui = minersUnicasAtuais.has(chaveMiner);
    
    const novaBase = baseTotalAtual + minerInventario.power;
    const novoBonusPercentual = jaPossui ? bonusPercentualAtual : bonusPercentualAtual + (minerInventario.bonus / 100);
    const novoBonusPower = novaBase * novoBonusPercentual;
    const novoPoderTotal = novaBase + novoBonusPower + userData.powerData.racks + userData.powerData.games + userData.powerData.temp;
    const ganhoAdicionar = novoPoderTotal - poderTotalAtual;
    
    const opcoes = [];
    
    // Opções baseadas no tamanho da miner
    if (minerInventario.cells === 1 && miners1Cell.length > 0) {
      const remover = miners1Cell[0];
      const roi = ganhoAdicionar - remover.impact;
      opcoes.push({
        tipo: 'remover_1x1',
        remover: [remover],
        roi: roi,
        descricao: `${remover.name} (${remover.level})`
      });
    }
    
    if (minerInventario.cells === 2) {
      // Opção A: Remover 1 miner de 2 células
      if (miners2Cell.length > 0) {
        const remover = miners2Cell[0];
        const roi = ganhoAdicionar - remover.impact;
        opcoes.push({
          tipo: 'remover_1x2',
          remover: [remover],
          roi: roi,
          descricao: `${remover.name} (${remover.level})`
        });
      }
      
      // Opção B: Remover 2 miners de 1 célula
      if (miners1Cell.length >= 2) {
        const remover1 = miners1Cell[0];
        const remover2 = miners1Cell[1];
        const roi = ganhoAdicionar - remover1.impact - remover2.impact;
        opcoes.push({
          tipo: 'remover_2x1',
          remover: [remover1, remover2],
          roi: roi,
          descricao: `${remover1.name} (${remover1.level}) + ${remover2.name} (${remover2.level})`
        });
      }
    }
    
    // Retornar a melhor opção (maior ROI)
    if (opcoes.length === 0) return null;
    
    opcoes.sort((a, b) => b.roi - a.roi);
    
    return {
      melhorOpcao: opcoes[0],
      todasOpcoes: opcoes,
      ganhoAdicionar: ganhoAdicionar,
      jaPossui: jaPossui
    };
  },
  
  /**
   * Encontra miners vizinhas a uma posição
   */
  encontrarMinersVizinhas(miner, allMiners) {
    const vizinhas = [];
    const x = miner.placement.x;
    const y = miner.placement.y;
    const rackId = miner.placement.user_rack_id;

    const posicoes = [
      { x: x + 1, y: y },
      { x: x - 1, y: y },
      { x: x, y: y + 1 },
      { x: x, y: y - 1 }
    ];

    posicoes.forEach(pos => {
      const vizinha = allMiners.find(m => 
        m.placement.x === pos.x && 
        m.placement.y === pos.y && 
        m.placement.user_rack_id === rackId
      );
      
      if (vizinha) {
        vizinhas.push(vizinha);
      }
    });

    return vizinhas.slice(0, 1); // Retorna apenas a primeira
  }
};

window.Calculations = Calculations;

// 🔧 ATUALIZAÇÃO DO UI_Miners para mostrar duplicatas claramente
if (typeof UI_Miners !== 'undefined') {
  const originalMostrar = UI_Miners.mostrar;
  
  UI_Miners.mostrar = function(user) {
    originalMostrar.call(this, user);
    
    // Adicionar legenda sobre duplicatas
    const minersDiv = document.getElementById('miners');
    if (minersDiv) {
      const legendaHTML = `
        <div style="background: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0;">
          <h4>📋 Sobre Miners Duplicadas</h4>
          <ul style="font-size: 13px; margin: 5px 0;">
            <li><strong>🔷 Primeira do tipo:</strong> Inclui perda de bônus de coleção (impacto MAIOR)</li>
            <li><strong>🔸 Duplicata:</strong> NÃO perde bônus de coleção (impacto MENOR)</li>
            <li><strong>🔍 Símbolo:</strong> Miners com 🔄 são duplicatas</li>
          </ul>
          <p style="margin-top: 10px; font-size: 12px; color: #666;">
            <strong>💡 Exemplo:</strong> Se você tem 3x "Rare Miner", apenas a primeira tem alto impacto (com perda de bônus). As outras 2 têm impacto menor (sem perda de bônus de coleção).
          </p>
        </div>
      `;
      
      const table = minersDiv.querySelector('table');
      if (table) {
        table.insertAdjacentHTML('beforebegin', legendaHTML);
      }
    }
  };
}