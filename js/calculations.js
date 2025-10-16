// js/calculations.js - CORREÇÃO: Ordenar antes de identificar duplicatas

const Calculations = {
calcularImpactos(user) {
  const racks = user.roomData.racks || [];
  const allMiners = user.roomData.miners || [];
  
  // Criar mapa de bônus por rack
  const rackFactorById = {};
  racks.forEach(r => {
    rackFactorById[r._id] = (r.bonus || 0) / 10000;
    State.addDebugInfo(`Rack ${r.name}: Bonus = ${(r.bonus/100)}% (${r.bonus/10000})`);
  });
  
  // ✅ RECALCULAR PODER TOTAL ATUAL (pode ter mudado)
  const baseTotalMiners = allMiners.reduce((sum, m) => sum + m.power, 0);
  const uniqueMiners = allMiners.filter((miner, index, self) =>
    index === self.findIndex((m) => m.miner_id === miner.miner_id)
  );
  const bonusPercentTotal = uniqueMiners.reduce((sum, miner) => sum + miner.bonus_percent, 0);
  const bonusPower = baseTotalMiners * (bonusPercentTotal / 10000);
  const bonusPercentualAtual = bonusPercentTotal / 10000;
  
  // ✅ ATUALIZAR poder atual recalculado
  const poderTotalAtual = baseTotalMiners + bonusPower + user.powerData.racks + 
                          user.powerData.games + user.powerData.temp;
  
  State.addDebugInfo("=== ESTADO ATUAL DA REDE ===");
  State.addDebugInfo(`🔄 Poder recalculado: ${Utils.formatPower(poderTotalAtual * 1e9)}`);
  State.addDebugInfo(`Base miners: ${Utils.formatPower(baseTotalMiners * 1e9)}`);
  State.addDebugInfo(`Bônus % (raw): ${bonusPercentTotal} -> ${(bonusPercentualAtual * 100).toFixed(2)}%`);
  State.addDebugInfo(`Bônus power: ${Utils.formatPower(bonusPower * 1e9)}`);

  // ✅ CRIAR MAPA DE RACKS PARA PEGAR SALA
  const rackInfoById = {};
  racks.forEach(r => {
    rackInfoById[r._id] = {
      roomLevel: r.placement?.room_level || 0,
      rackX: r.placement?.x || 0,
      rackY: r.placement?.y || 0
    };
  });

  // ✅ ORDENAR MINERS POR SALA → RACK → POSIÇÃO (Sala 1 primeiro!)
  const minersOrdenadas = allMiners.map((m, originalIndex) => ({
    ...m,
    originalIndex: originalIndex,
    rackInfo: rackInfoById[m.placement.user_rack_id] || { roomLevel: 999, rackX: 0, rackY: 0 }
  })).sort((a, b) => {
    if (a.rackInfo.roomLevel !== b.rackInfo.roomLevel) {
      return a.rackInfo.roomLevel - b.rackInfo.roomLevel;
    }
    if (a.rackInfo.rackY !== b.rackInfo.rackY) {
      return a.rackInfo.rackY - b.rackInfo.rackY;
    }
    if (a.rackInfo.rackX !== b.rackInfo.rackX) {
      return a.rackInfo.rackX - b.rackInfo.rackX;
    }
    if (a.placement.y !== b.placement.y) {
      return a.placement.y - b.placement.y;
    }
    return a.placement.x - b.placement.x;
  });

  // ✅ IDENTIFICAR PRIMEIRA OCORRÊNCIA (NA ORDEM CORRETA)
  const primeiraOcorrenciaPorMinerId = {};
  minersOrdenadas.forEach((m) => {
    if (!primeiraOcorrenciaPorMinerId[m.miner_id]) {
      primeiraOcorrenciaPorMinerId[m.miner_id] = m.originalIndex;
    }
  });
  
  State.addDebugInfo(`=== IDENTIFICAÇÃO DE DUPLICATAS (por miner_id, ordenado por sala) ===`);
  Object.entries(primeiraOcorrenciaPorMinerId).forEach(([minerId, originalIndex]) => {
    const count = allMiners.filter(m => m.miner_id === minerId).length;
    if (count > 1) {
      const primeira = allMiners[originalIndex];
      const rackInfo = rackInfoById[primeira.placement.user_rack_id];
      State.addDebugInfo(`🔢 ${primeira.name} (${primeira.level_label}): ${count} unidades - Primeira: Sala ${(rackInfo?.roomLevel || 0) + 1}, índice #${originalIndex}`);
    }
  });

  const impacts = allMiners.map((m, index) => {
    const basePowerGHS = m.power;
    const rackBonusFactor = rackFactorById[m.placement.user_rack_id] || 0;
    
    // ✅ DETERMINAR SE É A PRIMEIRA (baseado na ordem correta)
    const ehPrimeira = primeiraOcorrenciaPorMinerId[m.miner_id] === index;
    const minerBonusPercent = ehPrimeira ? (m.bonus_percent / 10000) : 0;
    
    const novaBaseTotal = baseTotalMiners - basePowerGHS;
    const novoBonusPercentual = bonusPercentualAtual - minerBonusPercent;
    const novoBonusPower = novaBaseTotal * novoBonusPercentual;
    
    // ✅ CORREÇÃO: Rack bonus NÃO muda ao remover miners!
    const novoRackBonus = user.powerData.racks; // Permanece fixo
    const perdaRackBonus = 0; // Sem perda de rack bonus
    
    const novoPoderTotal = novaBaseTotal + novoBonusPower + novoRackBonus + user.powerData.games + user.powerData.temp;
    const impactoReal = poderTotalAtual - novoPoderTotal;
    
    const perdaBase = basePowerGHS;
    const perdaBonusDeColecao = ehPrimeira ? (baseTotalMiners * minerBonusPercent) : 0;
    const bonusQueEstaBaseRecebia = basePowerGHS * bonusPercentualAtual;

    // Log para debug
    const rackInfo = rackInfoById[m.placement.user_rack_id];
    const sala = (rackInfo?.roomLevel || 0) + 1;
    
    if (!ehPrimeira) {
      State.addDebugInfo(`🔄 DUPLICATA: ${m.name} (${m.level_label}) Sala ${sala} #${index} - Impacto: ${Utils.formatPower(impactoReal * 1e9)}`);
    } else {
      const count = allMiners.filter(other => other.miner_id === m.miner_id).length;
      if (count > 1) {
        State.addDebugInfo(`🔷 PRIMEIRA: ${m.name} (${m.level_label}) Sala ${sala} #${index} - Impacto: ${Utils.formatPower(impactoReal * 1e9)}`);
      }
    }
    
    return { 
      name: m.name, 
      level: m.level_label,
      minerId: m.miner_id,
      basePower: basePowerGHS,
      minerBonusPercent: m.bonus_percent / 10000,
      minerBonusPercentAplicado: minerBonusPercent,
      rackBonus: rackBonusFactor, 
      impact: impactoReal,
      perdaBase: perdaBase,
      perdaBonusBase: perdaBonusDeColecao,
      perdaBonusPropia: 0,
      perdaRackBonus: perdaRackBonus,
      bonusQueRecebia: bonusQueEstaBaseRecebia,
      novoPoderTotal: novoPoderTotal,
      rackId: m.placement.user_rack_id,
      position: m.placement,
      minerIndex: index,
      width: m.width || 2,
      isDuplicate: !ehPrimeira,
      isFirstOfType: ehPrimeira
    };
  });

  const totalImpactoCalculado = impacts.reduce((s, m) => s + m.impact, 0);
  impacts.forEach(m => m.impactPercent = (totalImpactoCalculado > 0) ? (m.impact / totalImpactoCalculado) * 100 : 0);

  return impacts.sort((a, b) => b.impact - a.impact);
},
  
  calcularMinersUnicas(impacts) {
    const uniqueSet = new Set();
    impacts.forEach(m => {
      uniqueSet.add(m.minerId);
    });
    return uniqueSet.size;
  },
  
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
  
  calcularMelhorTrocaPorMiner(minerInventario, userData) {
    if (!userData) return null;
    
    const impacts = this.calcularImpactos(userData);
    const allMiners = userData.roomData.miners;
    
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
    
    miners1Cell.sort((a, b) => a.impact - b.impact);
    miners2Cell.sort((a, b) => a.impact - b.impact);
    
    const baseTotalAtual = allMiners.reduce((sum, m) => sum + m.power, 0);
    const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
    const poderTotalAtual = userData.powerData.current_power;
    
    const minersUnicasAtuais = new Set();
    const uniqueMinersAtuais = allMiners.filter((miner, index, self) =>
      index === self.findIndex((m) => m.miner_id === miner.miner_id)
    );
    uniqueMinersAtuais.forEach(m => {
      minersUnicasAtuais.add(m.miner_id);
    });
    
    const jaPossui = minersUnicasAtuais.has(minerInventario.minerId);
    
    const novaBase = baseTotalAtual + minerInventario.power;
    const novoBonusPercentual = jaPossui ? bonusPercentualAtual : bonusPercentualAtual + (minerInventario.bonus / 100);
    const novoBonusPower = novaBase * novoBonusPercentual;
    const novoPoderTotal = novaBase + novoBonusPower + userData.powerData.racks + userData.powerData.games + userData.powerData.temp;
    const ganhoAdicionar = novoPoderTotal - poderTotalAtual;
    
    const opcoes = [];
    
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
    
    if (opcoes.length === 0) return null;
    
    opcoes.sort((a, b) => b.roi - a.roi);
    
    return {
      melhorOpcao: opcoes[0],
      todasOpcoes: opcoes,
      ganhoAdicionar: ganhoAdicionar,
      jaPossui: jaPossui
    };
  },
  
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

    return vizinhas.slice(0, 1);
  }
};

window.Calculations = Calculations;