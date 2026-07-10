// js/ui/inventario.js - VERSÃO CSS CLEANUP

const UI_Inventario = {
  currentSort: { column: 'impacto', direction: 'desc' },
  currentFilter: 'all',
  instaladaSort: { column: 'impacto', direction: 'asc' },

  // Instância PRÓPRIA de simulação (js/ui/simState.js) — independente da do Planejador
  // de Sala. Remover/adicionar miner aqui não mexe em nada da simulação de lá.
  sim: criarSimState(),

  expandedMergeRows: {},

  ocultarSets: false,
  setsColapsados: {},

  mostrar: function(user) {
    const div = document.getElementById('inventario');
    div.innerHTML = `
      <h2 style="margin-bottom: 30px; text-align: center; font-size: 28px;">📊 Análise de Inventário</h2>

      <!-- Stepper com 5 passos -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 40px;">
        <!-- Passo 1 -->
        <div style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">1</div>
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">Abrir Armazém</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">Vá em <a href="https://rollercoin.com/storage/inventory/miners" target="_blank" style="color: #667eea; text-decoration: none;">Storage > Miners 🔗</a></p>
        </div>

        <!-- Passo 2 -->
        <div style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">2</div>
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">Aumentar Resultados</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">Mude de 24 para 48 por página</p>
        </div>

        <!-- Passo 3 -->
        <div style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">3</div>
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">Carregar Tudo</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">Clique "Load more" até tudo aparecer</p>
        </div>

        <!-- Passo 4 -->
        <div style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">4</div>
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">Copiar</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">Ctrl+A, depois Ctrl+C</p>
        </div>

        <!-- Passo 5 -->
        <div style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">5</div>
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">Colar & Analisar</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">Cole no campo abaixo</p>
        </div>
      </div>

      <!-- Textarea e Botões -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; align-items: stretch;">
        <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; border: 1px solid var(--border-color); display: flex; flex-direction: column;">
          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: var(--text-primary);">📦 Miners do inventário:</label>
          <small style="display:block; margin-bottom:8px; color: var(--text-secondary);">Acesse <a href="https://rollercoin.com/storage/inventory/miners" target="_blank" style="color:#667eea;">Storage › Miners</a>, selecione tudo e cole aqui.</small>
          <textarea id="inventarioText" placeholder="Ctrl+V para colar..." style="flex:1; min-height:160px; width:100%; padding:12px; border:2px solid var(--border-color); border-radius:6px; font-family:monospace; font-size:12px; background:var(--bg-primary); color:var(--text-primary); resize:vertical;"></textarea>
        </div>
        <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; border: 1px solid var(--border-color); display: flex; flex-direction: column;">
          <label style="display: block; margin-bottom: 6px; font-weight: 600; color: var(--text-primary);">🔩 Peças do inventário (opcional):</label>
          <small style="display:block; margin-bottom:8px; color: var(--text-secondary);">Acesse <a href="https://rollercoin.com/storage/inventory/parts" target="_blank" style="color:#667eea;">Storage › Parts</a>, copie tudo e cole aqui.</small>
          <textarea id="partsText" placeholder="Common&#10;Wire&#10;Quantity:&#10;35652&#10;&#10;Uncommon&#10;Fan&#10;Quantity:&#10;729" style="flex:1; min-height:160px; width:100%; padding:12px; border:2px solid var(--border-color); border-radius:6px; font-family:monospace; font-size:12px; background:var(--bg-primary); color:var(--text-primary); resize:vertical;"></textarea>
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <button onclick="UI_Inventario.analisar()" style="padding: 14px 32px; font-size: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">🔍 Analisar Inventário</button>
      </div>

      <div id="resultadoInventario" style="margin-top: 30px;"></div>
    `;
  },
  
  analisar: function() {
    const texto = document.getElementById('inventarioText').value;
    const partsTexto = document.getElementById('partsText')?.value || '';
    const resultDiv = document.getElementById('resultadoInventario');

    if (!texto) {
      resultDiv.innerHTML = '<p class="error">Cole o texto primeiro!</p>';
      return;
    }

    const userData = State.getUserData();
    if (!userData) {
      resultDiv.innerHTML = '<p class="error">Analise seu perfil primeiro!</p>';
      return;
    }

    if (typeof APIData === 'undefined' || !APIData.miners) {
      resultDiv.innerHTML = '<p class="error">❌ APIData não carregado!</p>';
      return;
    }

    try {
      const minersAgrupadas = this.extrair(texto);

      if (minersAgrupadas.length === 0) {
        resultDiv.innerHTML = '<p class="warning">Nenhuma miner encontrada.</p>';
        return;
      }

      const comImpacto = this.calcular(minersAgrupadas, userData);
      const minersFracas = this.get50MinersMaisFracas(userData);

      this.partsCached = this.parseParts(partsTexto);
      if (typeof Analytics !== 'undefined') Analytics.inventarioAnalisado(minersAgrupadas.length);
      this.mostrarResultado(comImpacto, minersFracas);

    } catch (error) {
      resultDiv.innerHTML = '<p class="error">Erro: ' + error.message + '</p>';
      console.error(error);
    }
  },

  getTotalMinerCount: function(miner) {
    const userData = State.getUserData();
    const invCount = miner.quantity || 1;
    let roomCount = 0;
    if (userData?.roomData?.miners) {
      const tolerance = Math.max(0.001, miner.power * 0.01);
      roomCount = userData.roomData.miners.filter(rm =>
        rm.name.toLowerCase() === miner.name.toLowerCase() &&
        Math.abs(rm.power - miner.power) < tolerance
      ).length;
    }
    return invCount + roomCount;
  },

  toggleMergeRow: function(uid) {
    this.expandedMergeRows[uid] = !this.expandedMergeRows[uid];
    this.renderResultado();
  },

  getMergeInfoForMiner: function(miner) {
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };

    const tiers = APIData.findByName(miner.name).sort((a, b) => a.level - b.level);
    if (!tiers.length) return null;

    // tenta achar pelo power (mais preciso), cai para label de nível se falhar
    let currentDbEntry = APIData.findByNameAndPower(miner.name, miner.power * 1e9);
    if (!currentDbEntry) {
      currentDbEntry = tiers.find(t => {
        const lbl = t.type === 'merge' ? (rarityMap[t.level] || 'Unknown') : (t.rarityGroup?.title || 'Common');
        return lbl === miner.level;
      });
    }
    if (!currentDbEntry) return null;

    // próximo tier
    // próximo tier: nível + 1 e mais forte (evita pegar entrada errada)
    let nextTier = tiers.find(t => t.level === currentDbEntry.level + 1 && t.power > currentDbEntry.power);
    if (!nextTier) nextTier = tiers.find(t => t.level === currentDbEntry.level + 1);
    if (!nextTier || !nextTier.craftRecipe || nextTier.craftRecipe.length === 0) return null;

    // monta contagem de miners disponíveis (inventário + sala)
    const contagem = {};
    this.minersCached.forEach(m => {
      const key = `${m.name.toLowerCase()}|${m.level}`;
      contagem[key] = (contagem[key] || 0) + (m.quantity || 1);
    });
    const userData = State.getUserData();
    if (userData?.roomData?.miners) {
      userData.roomData.miners.forEach(m => {
        const lbl = m.level_label || CONFIG.MINER_LEVELS[m.level] || 'Common';
        const key = `${m.name.toLowerCase()}|${lbl}`;
        contagem[key] = (contagem[key] || 0) + 1;
      });
    }
    const partes = this.partsCached || {};

    const ingredientes = nextTier.craftRecipe.map(ing => {
      if (ing.rarity === null) {
        const ingTiers = APIData.findByName(ing.name).sort((a, b) => a.level - b.level);
        const ingIdx = ingTiers.findIndex(t => t.id === nextTier.id);
        const ingDb = ingIdx > 0 ? ingTiers[ingIdx - 1] : null;
        const ingLabel = ingDb
          ? (ingDb.type === 'merge' ? (rarityMap[ingDb.level] || 'Unknown') : (ingDb.rarityGroup?.title || 'Common'))
          : miner.level;
        const key = `${ing.name.toLowerCase()}|${ingLabel}`;
        const tem = contagem[key] || 0;
        return { tipo: 'miner', nome: ing.name, rarity: ingLabel, precisa: ing.count, tem, ok: tem >= ing.count };
      } else {
        const chave = `${ing.name}|${ing.rarity}`;
        const tem = partes[chave] || 0;
        return { tipo: 'parte', nome: ing.name, rarity: ing.rarity, precisa: ing.count, tem, ok: tem >= ing.count };
      }
    });

    // Monta mapa de níveis que o usuário possui (inventário + sala)
    const rarityMap2 = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
    const userHasLevel = {}; // key: db.id → { status: 'inv'|'room'|null, count: number }

    tiers.forEach(t => {
      const tLabel = t.type === 'merge' ? (rarityMap2[t.level] || 'Unknown') : (t.rarityGroup?.title || 'Common');

      const invCount = (this.minersCached || [])
        .filter(mc => mc.name.toLowerCase() === t.name.toLowerCase() && mc.level === tLabel)
        .reduce((sum, mc) => sum + (mc.quantity || 1), 0);
      if (invCount > 0) { userHasLevel[t.id] = { status: 'inv', count: invCount }; return; }

      const roomCount = (userData?.roomData?.miners || []).filter(rm => {
        const rmLabel = rm.level_label || CONFIG.MINER_LEVELS[rm.level] || 'Common';
        return rm.name.toLowerCase() === t.name.toLowerCase() && rmLabel === tLabel;
      }).length;
      if (roomCount > 0) { userHasLevel[t.id] = { status: 'room', count: roomCount }; return; }

      userHasLevel[t.id] = { status: null, count: 0 };
    });

    const nextTierAlreadyOwned = userHasLevel[nextTier.id]?.status !== null;

    // corrige power se DB estiver desatualizado (ex: miner bufada pelo jogo)
    const currentPowerHz = miner.power * 1e9;
    const scaleFactor = currentDbEntry.power > 0 ? currentPowerHz / currentDbEntry.power : 1;
    const resultPowerHz = nextTier.power * scaleFactor;

    return { nextTier, ingredientes, podeFazer: ingredientes.every(i => i.ok), tiers, userHasLevel, nextTierAlreadyOwned, currentPowerHz, resultPowerHz, currentDbEntry };
  },

  parseParts: function(texto) {
    const parts = {};
    if (!texto) return parts;
    const raridades = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
    const nomes = ['Wire', 'Fan', 'Hashboard'];
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    for (let i = 0; i < linhas.length; i++) {
      const rarity = raridades.find(r => linhas[i] === r);
      if (!rarity) continue;
      const nome = nomes.find(n => linhas[i + 1] === n);
      if (!nome) continue;
      // procura "Quantity:" seguido do número
      for (let j = i + 2; j < Math.min(i + 6, linhas.length); j++) {
        if (linhas[j] === 'Quantity:') {
          const qty = parseInt(linhas[j + 1]);
          if (!isNaN(qty)) {
            const chave = `${nome}|${rarity}`;
            parts[chave] = (parts[chave] || 0) + qty;
          }
          break;
        }
      }
    }
    return parts;
  },

  calcularMergesSugeridos: function(inventoryMiners, userData) {
    // Agrupa miners do inventário por nome+level
    const contagem = {};
    inventoryMiners.forEach(m => {
      const key = `${m.name.toLowerCase()}|${m.level}`;
      contagem[key] = (contagem[key] || 0) + (m.quantity || 1);
    });
    // Também conta miners instaladas na sala
    userData.roomData.miners.forEach(m => {
      const lbl = m.level_label || CONFIG.MINER_LEVELS[m.level] || 'Common';
      const key = `${m.name.toLowerCase()}|${lbl}`;
      contagem[key] = (contagem[key] || 0) + 1;
    });

    const partes = this.partsCached || {};
    const sugestoes = [];

    // Para cada miner craftável no banco, verifica se o usuário pode fazer o merge
    APIData.miners
      .filter(db => db.craftRecipe && db.craftRecipe.length > 0)
      .sort((a, b) => b.power - a.power)
      .forEach(db => {
        const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
        const ingredientes = db.craftRecipe.map(ing => {
          if (ing.rarity === null) {
            // ingrediente é uma miner (tier anterior)
            const tiers = APIData.getAllTiers(ing.name).sort((a, b) => a.level - b.level);
            const resultIdx = tiers.findIndex(t => t.id === db.id);
            const ingredientTier = resultIdx > 0 ? tiers[resultIdx - 1] : null;
            const rarityLabel = ingredientTier
              ? (ingredientTier.type === 'merge'
                  ? (rarityMap[ingredientTier.level] || 'Unknown')
                  : (ingredientTier.rarityGroup?.title || 'Common'))
              : null;
            const key = `${ing.name.toLowerCase()}|${rarityLabel}`;
            const tem = contagem[key] || 0;
            return { tipo: 'miner', nome: ing.name, rarity: rarityLabel, precisa: ing.count, tem, ok: tem >= ing.count };
          } else {
            // ingrediente é uma peça
            const chave = `${ing.name}|${ing.rarity}`;
            const tem = partes[chave] || 0;
            return { tipo: 'parte', nome: ing.name, rarity: ing.rarity, precisa: ing.count, tem, ok: tem >= ing.count };
          }
        });

        const podeFazer = ingredientes.every(i => i.ok);
        const faltaSoPartes = !podeFazer && ingredientes.filter(i => !i.ok).every(i => i.tipo === 'parte');
        sugestoes.push({ db, ingredientes, podeFazer, faltaSoPartes });
      });

    return sugestoes.filter(s => s.podeFazer || s.faltaSoPartes || s.ingredientes.some(i => i.tipo === 'miner' && i.tem >= i.precisa));
  },
  
  get50MinersMaisFracas: function(userData) {
    const impacts = Calculations.calcularImpactos(userData);
    const totalInstaladas = userData.roomData.miners.length;
    const fracas = impacts.slice(-totalInstaladas);
    return fracas.sort((a, b) => a.impact - b.impact);
  },
  
  extrair: function(texto) {
    const miners = [];
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);

    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i + 1] !== 'Set') continue;
      
      const nome = linhas[i];
      let cells = 2, power = 0, bonus = 0, quantity = 1, level = 'Unknown';
      
      for (let j = i; j < i + 40 && j < linhas.length; j++) {
        const linha = linhas[j];
        const linhaLower = linha.toLowerCase().trim();
        
        if (level === 'Unknown') {
          const levels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Unreal'];
          const foundLevel = levels.find(l => linha === l || linhaLower === l.toLowerCase());
          if (foundLevel) level = foundLevel;
        }
        
        const cellsMatch = linha.match(/^(\d+)\s+Cells?$/i);
        if (cellsMatch) cells = parseInt(cellsMatch[1]);
        
        if (linha === 'Power' || linha === 'power') {
          const powerLine = linhas[j + 1];
          const match = powerLine.match(/([\d\s.,]+)\s*(Eh\/s|Ph\/s|Th\/s|Gh\/s|Mh\/s)/i);
          if (match) {
            let numberStr = match[1].replace(/\s/g, '');
            
            const temPonto = numberStr.includes('.');
            const temVirgula = numberStr.includes(',');
            
            if (temPonto && temVirgula) {
              const ultimoPonto = numberStr.lastIndexOf('.');
              const ultimaVirgula = numberStr.lastIndexOf(',');
              if (ultimaVirgula > ultimoPonto) {
                numberStr = numberStr.replace(/\./g, '').replace(',', '.');
              } else {
                numberStr = numberStr.replace(/,/g, '');
              }
            } else if (temVirgula) {
              numberStr = numberStr.replace(',', '.');
            } else if (temPonto) {
              const partes = numberStr.split('.');
              if (partes.length === 2 && partes[1].length === 3 && partes[0].length > 3) {
                numberStr = numberStr.replace('.', '');
              }
            }
            
            power = parseFloat(numberStr);
            const unit = match[2].toLowerCase();
            
            if (unit.includes('eh')) power *= 1000000000;
            else if (unit.includes('ph')) power *= 1000000;
            else if (unit.includes('th')) power *= 1000;
            else if (unit.includes('gh')) power *= 1;
            else if (unit.includes('mh')) power *= 0.001;
          }
        }
        
        if (linha === 'Bonus' || linha === 'bonus') {
          const bonusLine = linhas[j + 1];
          const match = bonusLine.match(/([\d.,]+)/);
          if (match) bonus = parseFloat(match[1].replace(',', '.'));
        }
        
        if (linha === 'Quantity:' && linhas[j + 1].match(/^\d+$/)) {
          quantity = parseInt(linhas[j + 1]);
          break;
        }
      }
      
      if (power > 0) {
        let levelCorrigido = level;
        let catalogData = null;
        
        if (typeof APIData !== 'undefined' && APIData.miners) {
          catalogData = APIData.findByNameAndPower(nome, power);
          
          if (catalogData) {
            if (catalogData.rarityGroup?.title) {
              levelCorrigido = catalogData.rarityGroup.title;
            } else if (catalogData.type === 'basic') {
              levelCorrigido = 'Common';
            } else if (catalogData.type === 'merge') {
              const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
              levelCorrigido = rarityMap[catalogData.level] || 'Unknown';
            }
          }
        }
        
        miners.push({ 
          name: nome, 
          cells: cells, 
          power: power,
          bonus: bonus, 
          quantity: quantity, 
          level: levelCorrigido,
          catalogData: catalogData
        });
      }
    }

    return miners;
  },
  
  calcular: function(miners, userData) {
    const baseAtual = userData.roomData.miners.reduce((s, m) => s + m.power, 0);
    const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
    
    return miners.map(m => {
      let jaPossui = false;
      let minerInstalada = null;
      let tipoMatch = null;
      
      const nomeInventario = m.name.toLowerCase().trim();
      const powerInventario = m.power;
      
      const minersComMesmoNome = userData.roomData.miners.filter(mi => 
        mi.name.toLowerCase().trim() === nomeInventario
      );
      
      if (minersComMesmoNome.length > 0) {
        const tolerancia = Math.max(1, powerInventario * 0.001);
        
        const minerComMesmoPower = minersComMesmoNome.find(mi => {
          const diferenca = Math.abs(mi.power - powerInventario);
          return diferenca < tolerancia;
        });
        
        if (minerComMesmoPower) {
          jaPossui = true;
          minerInstalada = minerComMesmoPower;
          tipoMatch = 'exato';
        } else {
          jaPossui = false;
          minerInstalada = minersComMesmoNome[0];
          tipoMatch = 'nome_diferente_tier';
        }
      }
      
      const ganhoBase = m.power;
      const ganhoBonusQueReceberá = m.power * bonusPercentualAtual;
      const ganhoBonusDeColecao = jaPossui ? 0 : (baseAtual * (m.bonus / 100));
      const impactoUmaUnidade = ganhoBase + ganhoBonusQueReceberá + ganhoBonusDeColecao;
      
      return { 
        name: m.name,
        cells: m.cells,
        power: m.power,
        bonus: m.bonus,
        level: m.level,
        quantity: m.quantity,
        impacto: impactoUmaUnidade,
        jaPossui: jaPossui,
        minerInstalada: minerInstalada,
        tipoMatch: tipoMatch,
        description: m.catalogData?.description,
        collection: m.catalogData?.collectionDescription,
        supply: m.catalogData?.supply,
        canBeSold: m.catalogData?.canBeSold,
        rarityGroup: m.catalogData?.rarityGroup,
        isInSet: m.catalogData?.isInSet || (MINERS_DATABASE.find(d => d.name.toLowerCase() === m.name.toLowerCase() && d.isInSet)?.isInSet) || false,
        setTitle: m.catalogData?.setTitle || (MINERS_DATABASE.find(d => d.name.toLowerCase() === m.name.toLowerCase() && d.isInSet)?.setTitle) || null,
        catalogData: m.catalogData
      };
    }).sort((a, b) => b.impacto - a.impacto);
  },
  
  mostrarResultado: function(miners, minersFracas) {
    this.minersCached = miners;
    this.minersFracasCached = minersFracas;
    this._plannerMode = 'atual';
    this._autoResult = null;
    this.renderResultado();
  },
  
  ordenar: function(coluna) {
    if (this.currentSort.column === coluna) {
      this.currentSort.direction = this.currentSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
      this.currentSort.column = coluna;
      this.currentSort.direction = 'desc';
    }
    this.renderResultado();
  },
  
  ordenarInstaladas: function(coluna) {
    if (this.instaladaSort.column === coluna) {
      this.instaladaSort.direction = this.instaladaSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
      this.instaladaSort.column = coluna;
      this.instaladaSort.direction = 'asc';
    }
    this.renderResultado();
  },
  
  filtrar: function(tipo) {
    this.currentFilter = tipo;
    this.renderResultado();
  },
  
  getMinerUniqueId: function(miner) {
    return miner.name + '|' + miner.power.toFixed(2) + '|' + miner.level;
  },
  
  findMinerByUniqueId: function(uniqueId) {
    return this.minersCached.findIndex(m => this.getMinerUniqueId(m) === uniqueId);
  },
  
  toggleRemoverMiner: function(minerIndex) {
    const userData = State.getUserData();

    if (!userData || !userData.roomData || !userData.roomData.miners) {
      Utils.mostrarNotificacao('❌ Erro: Dados do usuário não disponíveis!', 'error');
      return;
    }

    if (this.sim.estaRemovida(minerIndex)) {
      const resultado = this.sim.desfazerRemocaoPorIndice(userData, minerIndex);
      if (resultado === 'sem_espaco') {
        Utils.mostrarNotificacao('⚠️ O rack original está cheio agora — ela continua no banco desta simulação.', 'warning');
      } else {
        Utils.mostrarNotificacao('🔄 Remoção desfeita!', 'info');
      }
    } else {
      // Peça de set: em vez de bloquear, avisa o impacto real calculado (faixa que cairia
      // e quanto poder isso custa) e deixa o usuário decidir.
      if (typeof UI_RoomPlanner !== 'undefined') {
        const impacto = UI_RoomPlanner._impactoDeRemoverPecaDeSet(userData, minerIndex);
        if (impacto) {
          const msg = 'Remover essa miner derruba a faixa do set "' + impacto.setTitle + '" de ' + impacto.faixaAntes + ' pra ' + impacto.faixaDepois + ', perdendo ' + Utils.formatPower(impacto.perda * 1e9) + '. Continuar?';
          if (!confirm(msg)) return;
        }
      }
      const ok = this.sim.removerInstaladaPorIndice(userData, minerIndex);
      if (ok) Utils.mostrarNotificacao('❌ Miner marcada para remoção!', 'warning');
    }

    this.renderResultado();
  },
  
  mostrarModalQuantidade: function(uniqueId) {
    const inventoryIndex = this.findMinerByUniqueId(uniqueId);
    if (inventoryIndex === -1) {
      Utils.mostrarNotificacao('❌ Miner não encontrada!', 'error');
      return;
    }
    
    const miner = this.minersCached[inventoryIndex];
    if (!miner) return;

    const origemKey = this.getMinerUniqueId(miner);
    if (this.sim.contarPorOrigem(origemKey) > 0) {
      const userData = State.getUserData();
      this.sim.removerPorOrigem(userData, origemKey);
      this.renderResultado();
      Utils.mostrarNotificacao('🔄 Adição desfeita!', 'info');
      return;
    }
    
    if (miner.quantity === 1) {
      this.adicionarMinerComQuantidade(inventoryIndex, 1);
      return;
    }
    
    const modalHTML = `
      <div id="quantidadeModal" class="inv-modal-overlay">
        <div class="inv-modal-content">
          <h3 style="margin: 0 0 20px 0;">📦 Quantas unidades adicionar?</h3>
          
          <div class="inv-modal-info">
            <h4 style="margin: 0 0 10px 0;">${miner.name} (${miner.level})</h4>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Disponível:</strong> ${miner.quantity} unidades</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Células:</strong> ${miner.cells}</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Power:</strong> ${Utils.formatPower(miner.power * 1e9)}</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Bônus:</strong> ${(miner.bonus || 0).toFixed(2)}%</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Vendível:</strong> ${miner.canBeSold ? '✅ Sim' : '❌ Não'}</p>
          </div>
          
          <div class="inv-modal-warning">
            <strong>⚠️ Importante:</strong><br>
            • <strong>1ª unidade:</strong> ${miner.jaPossui ? '❌ Sem bônus (você já possui)' : '✅ Com bônus de coleção'}<br>
            • <strong>2ª+ unidades:</strong> ❌ Sem bônus de coleção (duplicatas)
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold;">Quantidade (1 a ${miner.quantity}):</label>
            <input type="number" id="quantidadeInput" min="1" max="${miner.quantity}" value="1" 
                   style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #007bff; border-radius: 5px;">
          </div>
          
          <div id="previewImpacto" class="inv-modal-preview">
            <div id="impactoCalculado"></div>
          </div>
          
          <div class="inv-modal-buttons">
            <button onclick="UI_Inventario.fecharModal()" style="padding: 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">❌ Cancelar</button>
            <button onclick="UI_Inventario.confirmarAdicao(${inventoryIndex})" style="padding: 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">✅ Adicionar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const input = document.getElementById('quantidadeInput');
    const updatePreview = () => {
      const qty = parseInt(input.value) || 1;
      const preview = this.calcularImpactoMultiplo(miner, qty);
      
      document.getElementById('impactoCalculado').innerHTML = `
        <h4 style="margin: 0 0 10px 0;">💎 Impacto de ${qty} unidade${qty > 1 ? 's' : ''}:</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
          <div><strong>Células:</strong><br>${preview.celulasTotal}</div>
          <div><strong>Power:</strong><br><span style="color: #28a745; font-weight: bold;">${Utils.formatPower(preview.impactoTotal * 1e9)}</span></div>
        </div>
        <div style="margin-top: 10px; padding: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 3px; font-size: 12px; color: var(--text-primary);">
          <strong>Detalhamento:</strong><br>
          • 1ª: ${Utils.formatPower(preview.impactoPrimeira * 1e9)} ${preview.comBonus ? '✅' : '❌'}<br>
          ${qty > 1 ? '• Demais ' + (qty - 1) + ': ' + Utils.formatPower(preview.impactoDemais * 1e9) + ' ❌' : ''}
        </div>
      `;
    };
    
    input.addEventListener('input', updatePreview);
    updatePreview();
  },
  
  calcularImpactoMultiplo: function(miner, quantidade) {
    const userData = State.getUserData();
    
    if (!userData || !userData.roomData || !userData.roomData.miners || !userData.powerData) {
      const cells = miner.cells || 2;
      return {
        impactoTotal: 0,
        impactoPrimeira: 0,
        impactoDemais: 0,
        comBonus: false,
        celulasTotal: quantidade * cells
      };
    }
    
    const baseAtual = userData.roomData.miners.reduce((s, m) => s + m.power, 0);
    const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
    
    const ganhoBasePorUnidade = miner.power;
    const ganhoBonusQueReceberaPorUnidade = miner.power * bonusPercentualAtual;
    const ganhoBonusDeColecao = miner.jaPossui ? 0 : (baseAtual * (miner.bonus / 100));
    
    const impactoPrimeira = ganhoBasePorUnidade + ganhoBonusQueReceberaPorUnidade + ganhoBonusDeColecao;
    const impactoPorDuplicata = ganhoBasePorUnidade + ganhoBonusQueReceberaPorUnidade;
    const impactoDemais = (quantidade - 1) * impactoPorDuplicata;
    const impactoTotal = impactoPrimeira + impactoDemais;
    
    const cells = miner.cells || 2;
    const celulasTotal = quantidade * cells;
    
    return {
      impactoTotal,
      impactoPrimeira,
      impactoDemais,
      comBonus: !miner.jaPossui,
      celulasTotal: celulasTotal
    };
  },
  
  confirmarAdicao: function(inventoryIndex) {
    const quantidade = parseInt(document.getElementById('quantidadeInput').value);
    this.fecharModal();
    this.adicionarMinerComQuantidade(inventoryIndex, quantidade);
  },
  
  fecharModal: function() {
    const modal = document.getElementById('quantidadeModal');
    if (modal) modal.remove();
    
    const modalManual = document.getElementById('adicionarMinerModal');
    if (modalManual) modalManual.remove();
  },
  
  mostrarModalAdicionarMiner: function() {
    const modalHTML = `
      <div id="adicionarMinerModal" class="inv-modal-overlay">
        <div class="inv-modal-content">
          <h3 style="margin: 0 0 20px 0;">➕ Adicionar Miner Manual</h3>
          
          <div class="inv-modal-info" style="background: #e3f2fd; border-left-color: #2196F3;">
            <strong>ℹ️ Use para simular:</strong><br>
            • Miners que você ainda não possui<br>
            • Testar impacto antes de comprar<br>
            • Comparar diferentes configurações
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nome da Miner:</label>
            <input type="text" id="manualMinerNome" placeholder="Ex: Antminer S19" 
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Level:</label>
            <select id="manualMinerLevel" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
              <option value="Common">⚪ Common</option>
              <option value="Uncommon">🟢 Uncommon</option>
              <option value="Rare">🔵 Rare</option>
              <option value="Epic">🟣 Epic</option>
              <option value="Legendary">🟡 Legendary</option>
              <option value="Unreal">🔴 Unreal</option>
            </select>
          </div>
          
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Power:</label>
              <input type="number" id="manualMinerPower" placeholder="Ex: 350000" 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Unidade:</label>
              <select id="manualMinerUnit" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                <option value="1000000000">Eh/s</option>
                <option value="1000000">Ph/s</option>
                <option value="1000" selected>Th/s</option>
                <option value="1">Gh/s</option>
                <option value="0.001">Mh/s</option>
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Bônus (%):</label>
              <input type="number" id="manualMinerBonus" value="0" step="0.01"
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Células:</label>
              <input type="number" id="manualMinerCells" value="2" min="1"
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Quantidade:</label>
              <input type="number" id="manualMinerQty" value="1" min="1"
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
          </div>
          
          <div class="inv-modal-buttons">
            <button onclick="UI_Inventario.fecharModal()" style="padding: 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">❌ Cancelar</button>
            <button onclick="UI_Inventario.confirmarAdicionarMinerManual()" style="padding: 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">✅ Adicionar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },
  
  confirmarAdicionarMinerManual: function() {
    const nome = document.getElementById('manualMinerNome').value.trim();
    const level = document.getElementById('manualMinerLevel').value;
    const powerValue = parseFloat(document.getElementById('manualMinerPower').value);
    const unit = parseFloat(document.getElementById('manualMinerUnit').value);
    const bonus = parseFloat(document.getElementById('manualMinerBonus').value) || 0;
    const cells = parseInt(document.getElementById('manualMinerCells').value) || 2;
    const quantity = parseInt(document.getElementById('manualMinerQty').value) || 1;
    
    if (!nome || !powerValue || isNaN(powerValue)) {
      Utils.mostrarNotificacao('❌ Preencha o nome e power da miner!', 'error');
      return;
    }
    
    const power = powerValue * unit;
    
    const userData = State.getUserData();
    if (!userData) {
      Utils.mostrarNotificacao('❌ Carregue seus dados primeiro!', 'error');
      return;
    }
    
    const nomeInventario = nome.toLowerCase().trim();
    const minersComMesmoNome = userData.roomData.miners.filter(mi => 
      mi.name.toLowerCase().trim() === nomeInventario
    );
    
    let jaPossui = false;
    let minerInstalada = null;
    let tipoMatch = null;
    
    if (minersComMesmoNome.length > 0) {
      const tolerancia = Math.max(1, power * 0.001);
      const minerComMesmoPower = minersComMesmoNome.find(mi => {
        const diferenca = Math.abs(mi.power - power);
        return diferenca < tolerancia;
      });
      
      if (minerComMesmoPower) {
        jaPossui = true;
        minerInstalada = minerComMesmoPower;
        tipoMatch = 'exato';
      } else {
        jaPossui = false;
        minerInstalada = minersComMesmoNome[0];
        tipoMatch = 'nome_diferente_tier';
      }
    }
    
    const baseAtual = userData.roomData.miners.reduce((s, m) => s + m.power, 0);
    const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
    
    const ganhoBase = power;
    const ganhoBonusQueReceberá = power * bonusPercentualAtual;
    const ganhoBonusDeColecao = jaPossui ? 0 : (baseAtual * (bonus / 100));
    const impactoUmaUnidade = ganhoBase + ganhoBonusQueReceberá + ganhoBonusDeColecao;
    
    const novaMiner = {
      name: nome,
      cells: cells,
      power: power,
      bonus: bonus,
      level: level,
      quantity: quantity,
      impacto: impactoUmaUnidade,
      jaPossui: jaPossui,
      minerInstalada: minerInstalada,
      tipoMatch: tipoMatch,
      canBeSold: false,
      isManual: true
    };
    
    this.minersCached.unshift(novaMiner);
    
    this.fecharModal();
    this.renderResultado();
    
    Utils.mostrarNotificacao('✅ Miner manual adicionada: ' + nome, 'success');
  },
  
  limparManuais: function() {
    const count = this.minersCached.filter(m => m.isManual).length;
    
    if (count === 0) {
      Utils.mostrarNotificacao('⚠️ Não há miners manuais para remover.', 'warning');
      return;
    }
    
    if (!confirm('Remover ' + count + ' miner(s) manual(is)?')) {
      return;
    }
    
    const userData = State.getUserData();
    if (userData) {
      this.minersCached.filter(m => m.isManual).forEach(m => {
        this.sim.removerPorOrigem(userData, this.getMinerUniqueId(m));
      });
    }
    this.minersCached = this.minersCached.filter(m => !m.isManual);

    this.renderResultado();
    Utils.mostrarNotificacao('🗑️ ' + count + ' miner(s) manual(is) removida(s)!', 'success');
  },
  
  adicionarMinerComQuantidade: function(inventoryIndex, quantidade) {
    const miner = this.minersCached[inventoryIndex];
    if (!miner) return;

    const userData = State.getUserData();

    if (!userData || !userData.roomData || !userData.roomData.miners || !userData.powerData || !userData.roomData.racks) {
      Utils.mostrarNotificacao('❌ Erro: Dados do usuário não disponíveis!', 'error');
      return;
    }

    const origemKey = this.getMinerUniqueId(miner);
    this.sim.adicionarAoBanco(userData, miner, quantidade, origemKey);

    Utils.mostrarNotificacao('✅ ' + quantidade + ' unidade' + (quantidade > 1 ? 's' : '') + ' adicionada' + (quantidade > 1 ? 's' : '') + ' à simulação do Inventário!', 'success');

    this.renderResultado();
  },
  
  toggleOcultarSets: function() {
    this.ocultarSets = !this.ocultarSets;
    this.renderResultado();
  },

  toggleSet: function(setKey) {
    this.setsColapsados[setKey] = !this.setsColapsados[setKey];
    this.renderResultado();
  },

  limparSimulacao: function() {
    const userData = State.getUserData();
    if (userData) this.sim.resetar(userData);
    this.renderResultado();
    Utils.mostrarNotificacao('🔄 Simulação limpa!', 'info');
  },
  
  resetarSimulacao: function() {
    this.limparSimulacao();
  },
  
  // Delega pra instância própria do SimState (this.sim), que calcula o poder simulado de
  // forma precisa por rack — não mais pela aproximação de bônus médio.
  calcularPowerSimulado: function(userData) {
    if (!userData || !userData.roomData || !userData.roomData.miners || !userData.powerData || !userData.roomData.racks) {
      return {
        poderAtual: 0,
        novoPoderTotal: 0,
        diferencaPower: 0,
        percentualMudanca: 0,
        capacidadeTotal: 0,
        celulasOcupadas: 0,
        espacoLivre: 0
      };
    }

    this.sim.garantirInicializado(userData);
    this.sim.recalcular(userData);

    const poderAtual = userData.powerData.current_power;

    // this.sim.poderEstimado só soma quem está em rackAssignments (rack definido) — o que é
    // certo pro SmartRoom, mas aqui no Inventário as miners adicionadas/removidas
    // ficam sempre no banco (essa aba não tem grid pra escolher rack), então usar só
    // poderEstimado sempre dava +0. Por isso o poder simulado do Inventário soma banco +
    // rackAssignments direto: as do banco entram com poder base + bônus de coleção, mas
    // SEM bônus de rack (não tem rack escolhido) — ver aviso na tela, isso é intencional,
    // não um bug, e o número aqui é só uma estimativa conservadora, não a precisão que o
    // SmartRoom dá quando você define o rack de verdade.
    // this.sim.banco começa com TODO o inventário disponível por padrão (_disponivelPadrao),
    // não só o que o usuário explicitamente adicionou — sem filtrar isso, o cálculo somava
    // o poder do inventário inteiro toda vez que a simulação ficava ativa, inflando o
    // "Mudança" absurdamente. Só entra aqui quem foi de fato adicionado (_origemKey) ou
    // removida de um rack real (_minerIndexOriginal) — ambos mudanças reais da simulação.
    const racks = userData.roomData.racks || [];
    const alocadas = Object.values(this.sim.rackAssignments).flat();
    const bancoRelevante = this.sim.banco.filter(m => !m._disponivelPadrao);
    const comBanco = alocadas.concat(bancoRelevante);
    const novoPoderTotal = UI_RoomPlanner._calcularPoderEstimado(comBanco, racks, userData);

    const celulasOcupadas = alocadas.reduce((s, m) => s + this.sim._cellsOf(m), 0);

    let capacidadeTotal = 0;
    if (userData.roomData.room_levels && Array.isArray(userData.roomData.room_levels)) {
      capacidadeTotal = userData.roomData.room_levels.reduce((s, r) => s + (r === 3 ? 60 : r === 2 ? 36 : 18), 0);
    } else if (userData.roomData.racks && Array.isArray(userData.roomData.racks)) {
      capacidadeTotal = userData.roomData.racks.reduce((sum, r) => {
        return sum + (r.rack_info ? r.rack_info.width * r.rack_info.height : 0);
      }, 0);
    } else {
      capacidadeTotal = celulasOcupadas;
    }

    const espacoLivre = capacidadeTotal - celulasOcupadas;

    return {
      poderAtual,
      novoPoderTotal,
      diferencaPower: novoPoderTotal - poderAtual,
      percentualMudanca: ((novoPoderTotal - poderAtual) / poderAtual) * 100,
      capacidadeTotal,
      celulasOcupadas,
      espacoLivre
    };
  },

  // Contagem de miners removidas/adicionadas na simulação atual, pros badges de resumo.
  _contarSimulacao: function() {
    const removidas = this.sim.banco.filter(m => m._minerIndexOriginal != null).length;
    const origens = new Set();
    this.sim.banco.concat(Object.values(this.sim.rackAssignments).flat()).forEach(m => {
      if (m._origemKey) origens.add(m._origemKey);
    });
    return { removidas, adicionadas: origens.size };
  },
  
  renderResultado: function() {
    if (!this.minersCached || !this.minersFracasCached) return;
    
    const div = document.getElementById('resultadoInventario');
    const userData = State.getUserData();
    
    let scrollPosInstalled = 0;
    let scrollPosInventory = 0;
    
    const installedContainer = document.getElementById('installedMinersScroll');
    const inventoryContainer = document.getElementById('inventoryMinersScroll');
    
    if (installedContainer) {
      scrollPosInstalled = installedContainer.scrollTop;
    }
    if (inventoryContainer) {
      scrollPosInventory = inventoryContainer.scrollTop;
    }
    
    if (!userData || !userData.roomData || !userData.roomData.miners || !userData.powerData || !userData.roomData.racks) {
      div.innerHTML = '<p class="error">❌ Dados do usuário incompletos. Recarregue a página e analise seu perfil novamente.</p>';
      return;
    }
    
    let miners = [...this.minersCached];
    let minersFracas = [...this.minersFracasCached];

    const minersFracasCompleto = [...minersFracas];

    if (this.ocultarSets) {
      miners = miners.filter(m => !m.isInSet);
      minersFracas = minersFracas.filter(m => !MINERS_DATABASE.find(d => d.name.toLowerCase() === m.name.toLowerCase() && d.isInSet));
    }
    
    // FILTRAR
    if (this.currentFilter === 'nao_possui') {
      miners = miners.filter(m => !m.jaPossui && m.tipoMatch !== 'nome_diferente_tier');
    } else if (this.currentFilter === 'possui_outra') {
      miners = miners.filter(m => m.tipoMatch === 'nome_diferente_tier');
    } else if (this.currentFilter === 'possui_exata') {
      miners = miners.filter(m => m.jaPossui && m.tipoMatch === 'exato');
    } else if (this.currentFilter === 'vendiveis') {
      miners = miners.filter(m => m.canBeSold === true);
    }
    
    // ORDENAR INVENTÁRIO
    miners.sort((a, b) => {
      let valA, valB;
      
      switch(this.currentSort.column) {
        case 'nome':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          return this.currentSort.direction === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        
        case 'level':
          const levelOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Unreal': 6 };
          valA = levelOrder[a.level] || 0;
          valB = levelOrder[b.level] || 0;
          break;
        
        case 'quantity':
          valA = a.quantity;
          valB = b.quantity;
          break;
        
        case 'cells':
          valA = a.cells;
          valB = b.cells;
          break;
        
        case 'power':
          valA = a.power;
          valB = b.power;
          break;
        
        case 'bonus':
          valA = a.bonus;
          valB = b.bonus;
          break;
        
        case 'impacto':
          valA = a.impacto;
          valB = b.impacto;
          break;
        
        case 'status':
          valA = a.jaPossui ? (a.tipoMatch === 'exato' ? 3 : 2) : 1;
          valB = b.jaPossui ? (b.tipoMatch === 'exato' ? 3 : 2) : 1;
          break;
        
        default:
          valA = a.impacto;
          valB = b.impacto;
      }
      
      if (this.currentSort.column !== 'nome') {
        return this.currentSort.direction === 'desc' ? valB - valA : valA - valB;
      }
    });
    
    // ORDENAR INSTALADAS
    minersFracas.sort((a, b) => {
      let valA, valB;
      
      switch(this.instaladaSort.column) {
        case 'nome':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          return this.instaladaSort.direction === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        
        case 'level':
          valA = a.level.toLowerCase();
          valB = b.level.toLowerCase();
          return this.instaladaSort.direction === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        
        case 'cells':
          valA = a.width || 2;
          valB = b.width || 2;
          break;
        
        case 'power':
          valA = a.basePower;
          valB = b.basePower;
          break;
        
        case 'bonus':
          valA = a.minerBonusPercent;
          valB = b.minerBonusPercent;
          break;
        
        case 'impacto':
          valA = a.impact;
          valB = b.impact;
          break;
        
        default:
          valA = a.impact;
          valB = b.impact;
      }
      
      if (this.instaladaSort.column !== 'nome' && this.instaladaSort.column !== 'level') {
        return this.instaladaSort.direction === 'desc' ? valB - valA : valA - valB;
      }
    });
    
    let html = '<h3>Análise Completa</h3>';
    html += '<div class="inv-legacy-notice">🔀 O Plano de Merges agora tem aba própria: <button onclick="UI_Tabs.switchTo(\'minermerge\')" class="inv-legacy-notice-btn">Ir para MinerMerge</button></div>';
    html += '<div class="inv-legacy-notice">🏠 O SmartRoom agora tem aba própria: <button onclick="UI_Tabs.switchTo(\'roomplanner\')" class="inv-legacy-notice-btn">Ir para SmartRoom</button></div>';
    if (typeof UI_RoomPlanner !== 'undefined') html += UI_RoomPlanner._renderProgressoSets(userData);

    const totalUnidades = this.minersCached.reduce((sum, m) => sum + m.quantity, 0);
    const minersUnicas = this.minersCached.length;
    
    html += '<p style="font-size: 14px; color: #666; margin: 10px 0;">📦 <strong>' + totalUnidades + ' unidades</strong> encontradas (<strong>' + minersUnicas + ' miners únicas</strong>)</p>';
    html += '<p style="font-size: 12px; color: #666; margin: 0 0 15px 0;">Miners agrupadas por tipo | Mostrando: ' + miners.length + ' miners</p>';
    
    // INSTRUÇÕES
    html += '<div class="inv-box-yellow">';
    html += '<strong>🔄 Como usar:</strong> ';
    html += 'Clique nos botões ❌/✅ nas tabelas. Para miners com quantidade > 1, escolha quantas adicionar. ';
    html += 'Use a simulação para ver o impacto antes de fazer mudanças reais no inventário.';
    html += '</div>';
    
    // FILTROS - Layout melhorado
    html += '<div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #FF9800;">';

    // Cabeçalho com título
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';
    html += '<strong style="font-size: 14px; color: #333;">🔍 Filtros de Análise:</strong>';
    html += '</div>';

    // Linha 1: Filtros principais
    html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px;">';
    html += '<button onclick="UI_Inventario.filtrar(\'all\')" style="padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s; ' + (this.currentFilter === 'all' ? 'background: #007bff; color: white; font-weight: bold;' : 'background: white; color: #333;') + '">Todas</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'nao_possui\')" style="padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s; ' + (this.currentFilter === 'nao_possui' ? 'background: #28a745; color: white; font-weight: bold;' : 'background: white; color: #333;') + '">🆕 Não Possuo</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'possui_outra\')" style="padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s; ' + (this.currentFilter === 'possui_outra' ? 'background: #ff9800; color: white; font-weight: bold;' : 'background: white; color: #333;') + '">⚠️ Diferente</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'possui_exata\')" style="padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s; ' + (this.currentFilter === 'possui_exata' ? 'background: #6c757d; color: white; font-weight: bold;' : 'background: white; color: #333;') + '">✔️ Possuo</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'vendiveis\')" style="padding: 8px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s; ' + (this.currentFilter === 'vendiveis' ? 'background: #ffc107; color: black; font-weight: bold;' : 'background: white; color: #333;') + '">💰 Vendíveis</button>';
    html += '</div>';

    // Linha 2: Ações (com melhor espaçamento)
    html += '<div style="display: flex; gap: 8px; align-items: center;">';
    html += '<button onclick="UI_Inventario.mostrarModalAdicionarMiner()" style="padding: 10px 16px; border: none; background: #28a745; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px; flex: 1; text-align: center;">➕ Adicionar Miner Manual</button>';

    const minersManualCount = this.minersCached.filter(m => m.isManual).length;
    if (minersManualCount > 0) {
      html += '<button onclick="UI_Inventario.limparManuais()" style="padding: 10px 16px; border: none; background: #dc3545; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px; white-space: nowrap;">🗑️ Limpar (' + minersManualCount + ')</button>';
    }
    html += '</div>';

    html += '</div>';
    
    const celulasOcupadas = userData.roomData.miners.reduce((s, m) => s + (m.width || 2), 0);
    
    let capacidadeTotal = 0;
    if (userData.roomData.room_levels && Array.isArray(userData.roomData.room_levels)) {
      capacidadeTotal = userData.roomData.room_levels.reduce((s, r) => s + (r === 3 ? 60 : r === 2 ? 36 : 18), 0);
    } else if (userData.roomData.racks && Array.isArray(userData.roomData.racks)) {
      capacidadeTotal = userData.roomData.racks.reduce((sum, r) => {
        return sum + (r.rack_info ? r.rack_info.width * r.rack_info.height : 0);
      }, 0);
    } else {
      console.warn('⚠️ Não foi possível calcular capacidade total!');
      capacidadeTotal = celulasOcupadas;
    }
    
    let espacoLivre = capacidadeTotal - celulasOcupadas;
    let salaCheia = espacoLivre <= 0;
    
    // PAINEL DE SIMULAÇÃO
    if (this.sim.ativo) {
      const simResult = this.calcularPowerSimulado(userData);
      const simCounts = this._contarSimulacao();
      espacoLivre = simResult.espacoLivre;
      salaCheia = espacoLivre <= 0;
      
      html += '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">';
      html += '<div style="color: white; margin-bottom: 20px;"><h3 style="margin: 0; font-size: 20px;">🔄 Simulação Ativa</h3></div>';
      
      const corDiferenca = simResult.diferencaPower >= 0 ? '#28a745' : '#dc3545';
      const iconDiferenca = simResult.diferencaPower >= 0 ? '📈' : '📉';

      html += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">';

      // Card 1: Power Atual
      html += '<div style="background: rgba(255,255,255,0.15); border-radius: 6px; padding: 15px; border: 1px solid rgba(255,255,255,0.2);">';
      html += '<p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8);">Power Atual</p>';
      html += '<p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: white;">' + Utils.formatPower(simResult.poderAtual * 1e9) + '</p>';
      html += '</div>';

      // Card 2: Power Simulado
      html += '<div style="background: rgba(255,255,255,0.15); border-radius: 6px; padding: 15px; border: 1px solid rgba(255,255,255,0.2);">';
      html += '<p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8);">Power Simulado</p>';
      html += '<p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: white;">' + Utils.formatPower(simResult.novoPoderTotal * 1e9) + '</p>';
      html += '</div>';

      // Card 3: Mudança
      html += '<div style="background: ' + corDiferenca + '; border-radius: 6px; padding: 15px; color: white;">';
      html += '<p style="margin: 0; font-size: 12px; opacity: 0.9;">Mudança <span title="Miners adicionadas/removidas aqui não têm rack definido, então esse número não conta bônus de rack — só poder base + bônus de coleção.">ⓘ</span></p>';
      html += '<p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold;">' + iconDiferenca + ' ' +
              (simResult.diferencaPower >= 0 ? '+' : '') + Utils.formatPower(simResult.diferencaPower * 1e9) + '</p>';
      html += '<p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">(' + (simResult.diferencaPower >= 0 ? '+' : '') + simResult.percentualMudanca.toFixed(2) + '%) <span style="opacity:.75;">sem bônus de rack</span></p>';
      html += '</div>';

      // Card 4: Espaço
      const corEspaco = simResult.espacoLivre < 0 ? '#dc3545' : '#28a745';
      html += '<div style="background: ' + corEspaco + '; border-radius: 6px; padding: 15px; color: white;">';
      html += '<p style="margin: 0; font-size: 12px; opacity: 0.9;">Espaço</p>';
      html += '<p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold;">' + simResult.celulasOcupadas + ' / ' + simResult.capacidadeTotal + '</p>';
      html += '<p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">' + (simResult.espacoLivre >= 0 ? '+' + simResult.espacoLivre + ' livres' : '⚠️ ' + Math.abs(simResult.espacoLivre) + ' faltando') + '</p>';
      html += '</div>';

      html += '</div>';
      
      // Sumário de mudanças (se houver)
      if (simCounts.removidas > 0 || simCounts.adicionadas > 0) {
        html += '<div style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">';

        if (simCounts.removidas > 0) {
          html += '<div style="background: rgba(220,53,69,0.1); border-left: 4px solid #dc3545; padding: 12px; border-radius: 4px;">';
          html += '<p style="margin: 0; font-size: 12px; color: #dc3545;"><strong>🗑️ Removidas:</strong> ' + simCounts.removidas + '</p>';
          html += '</div>';
        }

        if (simCounts.adicionadas > 0) {
          html += '<div style="background: rgba(40,167,69,0.1); border-left: 4px solid #28a745; padding: 12px; border-radius: 4px;">';
          html += '<p style="margin: 0; font-size: 12px; color: #28a745;"><strong>➕ Adicionadas:</strong> ' + simCounts.adicionadas + '</p>';
          html += '</div>';
        }

        html += '</div>';
      }

      html += '<p style="margin: 15px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.85);">📍 Essa é a simulação própria do Inventário — sem rack específico, o poder estimado aqui não conta bônus de rack (só bônus de coleção). Pra montar um layout de racks, use o SmartRoom, que tem a simulação dele à parte.</p>';
      html += '<div style="display: flex; gap: 10px; margin-top: 12px;">';
      html += '<button onclick="UI_Inventario.limparSimulacao()" style="flex: 1; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.2s;">🔄 Limpar Simulação</button>';
      html += '</div>';
      html += '</div>';
    }
    
    if (salaCheia) {
      html += '<div class="inv-box-red">';
      html += '<h4 style="margin: 0;">⚠️ Sala Cheia! (' + capacidadeTotal + ' células)</h4>';
      html += '<p style="margin: 5px 0 0 0; font-size: 13px;">Use a simulação para testar trocas</p>';
      html += '</div>';
    } else {
      html += '<div class="inv-box-green">';
      html += '<h4 style="margin: 0;">✅ Você tem ' + espacoLivre + ' células livres!</h4>';
      html += '</div>';
    }
    
    // SEÇÃO DE SETS — baseada nas miners INSTALADAS
    const setTotals = {};
    MINERS_DATABASE.forEach(m => {
      if (m.isInSet && m.setTitle) {
        setTotals[m.setTitle] = (setTotals[m.setTitle] || 0) + 1;
      }
    });

    const setsInstalados = {};
    minersFracasCompleto.forEach(m => {
      const dbMiner = MINERS_DATABASE.find(d => d.name.toLowerCase() === m.name.toLowerCase() && d.isInSet);
      if (dbMiner) {
        if (!setsInstalados[dbMiner.setTitle]) setsInstalados[dbMiner.setTitle] = [];
        setsInstalados[dbMiner.setTitle].push({ ...m, setTitle: dbMiner.setTitle });
      }
    });

    const temSets = Object.keys(setsInstalados).length > 0;

    if (temSets) {
      html += '<div style="margin-bottom: 25px;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';
      html += '<h3 style="margin: 0;">🎯 Sets Detectados na Sala</h3>';
      html += '<button onclick="UI_Inventario.toggleOcultarSets()" style="padding: 6px 14px; border: 1px solid #6c757d; border-radius: 4px; cursor: pointer; font-size: 12px; background: ' + (this.ocultarSets ? '#6c757d' : 'white') + '; color: ' + (this.ocultarSets ? 'white' : '#333') + ';">';
      html += this.ocultarSets ? '👁️ Mostrar na tabela' : '🙈 Ocultar da tabela';
      html += '</button>';
      html += '</div>';

      html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">';

      Object.entries(setsInstalados).sort((a, b) => a[0].localeCompare(b[0])).forEach(([setName, setMiners]) => {
        const total = setTotals[setName] || '?';
        const count = setMiners.length;
        const completo = count >= total;
        const setKey = setName.replace(/\s+/g, '_');
        const colapsado = this.setsColapsados[setKey];
        const corBorda = completo ? '#28a745' : '#667eea';

        html += '<div style="border: 2px solid ' + corBorda + '; border-radius: 8px; overflow: hidden;">';

        html += '<div onclick="UI_Inventario.toggleSet(\'' + setKey + '\')" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: ' + corBorda + '20; cursor: pointer;">';
        html += '<div>';
        html += '<strong style="font-size: 14px;">' + setName + '</strong>';
        if (completo) html += ' <span style="background: #28a745; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">✅ Completo</span>';
        html += '</div>';
        html += '<div style="display: flex; align-items: center; gap: 8px;">';
        html += '<span style="font-size: 13px; font-weight: bold; color: ' + corBorda + ';">' + count + '/' + total + '</span>';
        html += '<span style="font-size: 11px; color: #666;">' + (colapsado ? '▼' : '▲') + '</span>';
        html += '</div>';
        html += '</div>';

        if (!colapsado) {
          html += '<div style="padding: 8px;">';
          setMiners.forEach(m => {
            const emojiMap = { 'Common': '⚪', 'Uncommon': '🟢', 'Rare': '🔵', 'Epic': '🟣', 'Legendary': '🟡', 'Unreal': '🔴' };
            const emoji = emojiMap[m.level] || '❓';
            html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 6px; border-bottom: 1px solid #eee; font-size: 12px;">';
            html += '<span>' + emoji + ' <strong>' + m.name + '</strong></span>';
            html += '<span style="color: #666;">' + m.level + ' &nbsp;|&nbsp; ' + Utils.formatPower(m.basePower * 1e9) + '</span>';
            html += '</div>';
          });
          html += '</div>';
        }

        html += '</div>';
      });

      html += '</div>';
      html += '</div>';
    }

    html += '<div class="tables-grid">';

// COLUNA 1: MINERS INSTALADAS
html += '<div>'; // ← ADICIONAR ESTA LINHA

if (minersFracas && minersFracas.length > 0) {
  html += '<div class="inv-box-orange">';
  html += '<h4>🔍 Suas ' + minersFracas.length + ' Miners Instaladas</h4>';
  html += '</div>';
  
  html += '<div id="installedMinersScroll" class="table-scroll">';
  html += '<table><tr>';
  html += '<th>Pos</th>';
  html += '<th onclick="UI_Inventario.ordenarInstaladas(\'nome\')" style="cursor: pointer;">Nome ' + (this.instaladaSort.column === 'nome' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
  html += '<th onclick="UI_Inventario.ordenarInstaladas(\'level\')" style="cursor: pointer;">Lvl ' + (this.instaladaSort.column === 'level' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
  html += '<th>Local</th>';
  html += '<th onclick="UI_Inventario.ordenarInstaladas(\'cells\')" style="cursor: pointer;">Cél ' + (this.instaladaSort.column === 'cells' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
  html += '<th onclick="UI_Inventario.ordenarInstaladas(\'power\')" style="cursor: pointer;">Power ' + (this.instaladaSort.column === 'power' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
  html += '<th onclick="UI_Inventario.ordenarInstaladas(\'bonus\')" style="cursor: pointer;">Bônus ' + (this.instaladaSort.column === 'bonus' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
  html += '<th onclick="UI_Inventario.ordenarInstaladas(\'impacto\')" style="cursor: pointer;">Impacto ' + (this.instaladaSort.column === 'impacto' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
  html += '<th>Vende</th>';
  html += '<th style="width: 35px;">Ação</th>';
  html += '</tr>';

  // Criar mapa de racks
  const racksPorSala = {};
  userData.roomData.racks.forEach((rack) => {
    const sala = (rack.placement?.room_level || 0) + 1;
    if (!racksPorSala[sala]) {
      racksPorSala[sala] = [];
    }
    racksPorSala[sala].push({
      id: rack._id,
      x: rack.placement?.x || 0,
      y: rack.placement?.y || 0
    });
  });
  
  Object.keys(racksPorSala).forEach(sala => {
    racksPorSala[sala].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  });
  
  const rackMap = {};
  Object.keys(racksPorSala).forEach(sala => {
    racksPorSala[sala].forEach((rack, index) => {
      rackMap[rack.id] = {
        sala: parseInt(sala),
        rack: index + 1
      };
    });
  });
  
  for (let i = 0; i < minersFracas.length; i++) {
    const m = minersFracas[i];
    const cor = i < 10 ? 'low-impact' : (i < 30 ? 'medium-impact' : 'high-impact');
    const isRemoved = this.sim.estaRemovida(m.minerIndex);
    const trStyle = isRemoved ? 'opacity: 0.5; text-decoration: line-through;' : '';
    
    html += '<tr class="' + cor + '" style="' + trStyle + '">';
    html += '<td>#' + (i + 1);
    if (isRemoved) html += ' <span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">🔴</span>';
    html += '</td>';
    const dbMinerInstalled = MINERS_DATABASE.find(d => d.name.toLowerCase() === m.name.toLowerCase() && d.isInSet);
    const dbMinerImg = MINERS_DATABASE.find(d => d.name.toLowerCase() === m.name.toLowerCase() && d.imageUrl);
    const salaImgHtml = dbMinerImg?.imageUrl ? `<img src="${dbMinerImg.imageUrl}" alt="${m.name}" style="width:30px;height:30px;object-fit:contain;vertical-align:middle;margin-right:5px;border-radius:3px;">` : '';
    html += '<td>' + salaImgHtml + '<strong>' + m.name + '</strong>';
    if (dbMinerInstalled) html += ' <span style="background: #667eea; color: white; padding: 1px 5px; border-radius: 3px; font-size: 9px;">🎯 ' + dbMinerInstalled.setTitle + '</span>';
    html += '</td>';
    html += '<td>' + m.level + '</td>';

    const rackInfo = rackMap[m.rackId] || { sala: '?', rack: '?' };
    html += '<td style="font-size: 9px; color: #666;">S' + rackInfo.sala + ' rack ' + rackInfo.rack + '</td>';
    
    html += '<td>' + (m.width || 2) + '</td>';
    html += '<td>' + Utils.formatPower(m.basePower * 1e9) + '</td>';
    html += '<td><strong>' + (m.minerBonusPercent * 100).toFixed(2) + '%</strong></td>';
    html += '<td>' + Utils.formatPower(m.impact * 1e9) + '</td>';
    
    let canBeSold = undefined;
    if (typeof APIData !== 'undefined' && APIData.miners) {
      const catalogData = APIData.findByNameAndPower(m.name, m.basePower);
      if (catalogData) {
        canBeSold = catalogData.canBeSold;
      }
    }
    const vendeText = canBeSold === true ? '✅' : (canBeSold === false ? '❌' : '❓');
    html += '<td>' + vendeText + '</td>';
    
    html += '<td style="text-align: center;">';
    html += '<button onclick="UI_Inventario.toggleRemoverMiner(' + m.minerIndex + ')" style="padding: 2px 4px; background: ' + (isRemoved ? '#6c757d' : '#dc3545') + '; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">';
    html += isRemoved ? '🔄' : '❌';
    html += '</button>';
    html += '</td>';
    html += '</tr>';
  }
  
  html += '</table></div>';
}

html += '</div>'; // ← ADICIONAR ESTA LINHA
    
// COLUNA 2: INVENTÁRIO
html += '<div>';
html += '<div class="inv-box-blue">';
html += '<h4>📋 Seu Inventário</h4>';
html += '</div>';

html += '<div id="inventoryMinersScroll" class="table-scroll">';
html += '<table><tr>';
html += '<th>#</th>';
html += '<th onclick="UI_Inventario.ordenar(\'nome\')" style="cursor: pointer;">Nome ' + (this.currentSort.column === 'nome' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th onclick="UI_Inventario.ordenar(\'level\')" style="cursor: pointer;">Lvl ' + (this.currentSort.column === 'level' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th onclick="UI_Inventario.ordenar(\'quantity\')" style="cursor: pointer;">Qty ' + (this.currentSort.column === 'quantity' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th onclick="UI_Inventario.ordenar(\'cells\')" style="cursor: pointer;">Cél ' + (this.currentSort.column === 'cells' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th onclick="UI_Inventario.ordenar(\'power\')" style="cursor: pointer;">Power ' + (this.currentSort.column === 'power' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th onclick="UI_Inventario.ordenar(\'bonus\')" style="cursor: pointer;">Bônus ' + (this.currentSort.column === 'bonus' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th onclick="UI_Inventario.ordenar(\'impacto\')" style="cursor: pointer;">Ganho ' + (this.currentSort.column === 'impacto' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th onclick="UI_Inventario.ordenar(\'status\')" style="cursor: pointer;">Status ' + (this.currentSort.column === 'status' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
html += '<th>Vende</th>';
html += '<th style="width: 35px;">Ação</th>';
html += '</tr>';

    for (let i = 0; i < miners.length; i++) {
      const m = miners[i];
      const cor = i < 5 ? 'high-impact' : (i < 15 ? 'medium-impact' : '');
      
      const emojiMap = {
        'Basic': '⚫', 'Common': '⚪', 'Uncommon': '🟢',
        'Rare': '🔵', 'Epic': '🟣', 'Legendary': '🟡', 'Unreal': '🔴'
      };
      
      const nivel = m.level || 'Unknown';
      const emoji = nivel.startsWith('Merge') ? '🔀' : (emojiMap[nivel] || '❓');
      
      const statusText = m.jaPossui 
        ? '<span style="color: #28a745;">✔</span>'
        : '<span style="color: #999;">✗</span>';
      
      const vendeText = m.canBeSold === true ? '✅' : (m.canBeSold === false ? '❌' : '❓');
      
      const qtyAdicionada = this.sim.contarPorOrigem(this.getMinerUniqueId(m));
      const isAdded = qtyAdicionada > 0;
      
      const trStyle = isAdded ? 'background: #e8f5e8;' : '';
      
      html += '<tr class="' + cor + '" style="' + trStyle + '">';
      html += '<td>' + (i + 1);
      if (isAdded) html += ' <span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">' + qtyAdicionada + 'x</span>';
      html += '</td>';
      const invImgUrl = m.catalogData?.imageUrl || MINERS_DATABASE.find(d => d.name.toLowerCase() === m.name.toLowerCase() && d.imageUrl)?.imageUrl || '';
      const invImgHtml = invImgUrl ? `<img src="${invImgUrl}" alt="${m.name}" style="width:30px;height:30px;object-fit:contain;vertical-align:middle;margin-right:5px;border-radius:3px;">` : '';
      html += '<td>' + invImgHtml + '<strong>' + m.name + '</strong>';
      if (m.isManual) html += ' <span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9px; margin-left: 5px;">✏️ MANUAL</span>';
      html += '</td>';
      html += '<td>' + emoji + ' ' + nivel + '</td>';
      html += '<td><strong>' + m.quantity + '</strong></td>';
      html += '<td>' + m.cells + '</td>';
      html += '<td>' + Utils.formatPower(m.power * 1e9) + '</td>';
      html += '<td><strong>' + (m.bonus || 0).toFixed(2) + '%</strong></td>';
      html += '<td>' + Utils.formatPower(m.impacto * 1e9) + '</td>';
      html += '<td>' + statusText + '</td>';
      html += '<td>' + vendeText + '</td>';
      html += '<td style="text-align: center; white-space: nowrap;">';

      const uniqueId = this.getMinerUniqueId(m);
      const btnId = 'btn-inv-' + i;
      html += '<button id="' + btnId + '" data-minerid="' + uniqueId + '" style="padding: 2px 4px; background: ' + (isAdded ? '#6c757d' : '#28a745') + '; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;">';
      html += isAdded ? '🔄' : '✅';
      html += '</button>';

      if (this.getTotalMinerCount(m) >= 2) {
        const mergeInfo = this.getMergeInfoForMiner(m);
        if (mergeInfo) {
          const isExpanded = this.expandedMergeRows[uniqueId];
          const mergeColor = mergeInfo.podeFazer ? '#28a745' : '#fd7e14';
          html += ' <button onclick="UI_Inventario.toggleMergeRow(\'' + uniqueId.replace(/'/g, "\\'") + '\')" style="padding: 2px 4px; background: ' + mergeColor + '; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;" title="Ver merge possível">';
          html += isExpanded ? '▲' : '🔧';
          html += '</button>';
        }
      }

      html += '</td>';
      html += '</tr>';

      // Sub-linha expandida de merge
      if (this.getTotalMinerCount(m) >= 2 && this.expandedMergeRows[uniqueId]) {
        const mergeInfo = this.getMergeInfoForMiner(m);
        if (mergeInfo) {
          const { nextTier, ingredientes, podeFazer, tiers, userHasLevel, nextTierAlreadyOwned, currentPowerHz, resultPowerHz, currentDbEntry } = mergeInfo;
          const rarityLabels = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
          const currentPower = Utils.formatPower(currentPowerHz);
          const resultPower  = Utils.formatPower(resultPowerHz);
          const gainPower    = Utils.formatPower(resultPowerHz - currentPowerHz);

          html += '<tr><td colspan="11" style="padding:0;">';
          html += '<div class="merge-subrow' + (!podeFazer ? ' merge-warning' : '') + '">';

          // Cabeçalho
          const rarityLabelsLocal2 = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
          const nextTierLabel = nextTier.type === 'merge' ? (rarityLabelsLocal2[nextTier.level] || 'Lv' + nextTier.level) : (nextTier.rarityGroup?.title || 'Common');
          html += '<div class="merge-subrow-header">';
          html += '<span><strong>🔧 Merge → ' + nextTier.name + ' ' + nextTierLabel + '</strong></span>';
          html += '<span>Power atual: <strong>' + currentPower + '</strong></span>';
          html += '<span>→ Resultado: <strong>' + resultPower + '</strong></span>';
          html += '<span><strong>+' + gainPower + '</strong></span>';
          if (nextTier.bonusPower) {
            const curBonus  = (((currentDbEntry?.bonusPower  || 0)) / 100).toFixed(2);
            const nextBonus = (nextTier.bonusPower / 100).toFixed(2);
            const diffBonus = ((nextTier.bonusPower - (currentDbEntry?.bonusPower || 0)) / 100).toFixed(2);
            html += '<span style="opacity:.65; font-size:11px;">🎯 ' + curBonus + '% → ' + nextBonus + '% <strong style="color:#28a745;">+' + diffBonus + '%</strong> bônus</span>';
          }
          if (podeFazer && !nextTierAlreadyOwned) html += '<span>✅ <strong>Pode fazer agora!</strong></span>';
          html += '</div>';

          // Aviso se já possui o próximo nível
          if (nextTierAlreadyOwned) {
            const rarityLabelsLocal = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
            const nextLbl = nextTier.type === 'merge' ? (rarityLabelsLocal[nextTier.level] || 'Lv' + nextTier.level) : (nextTier.rarityGroup?.title || 'Common');
            const { status: dupStatus, count: dupCount } = userHasLevel[nextTier.id] || { status: null, count: 1 };
            const onde = dupStatus === 'room' ? 'na sala' : 'no inventário';
            const minerIngredient = ingredientes.find(i => i.tipo === 'miner');
            const consumeDesc = minerIngredient ? minerIngredient.precisa + '× ' + m.level : '2× ' + m.level;
            html += '<div class="merge-alert">'
              + '⚠️ Este merge consome <strong>' + consumeDesc + '</strong> e produz <strong>1 ' + nextLbl + '</strong>. '
              + 'Você já tem <strong>' + dupCount + ' ' + nextLbl + '</strong> ' + onde
              + ' — ficará com <strong>' + (dupCount + 1) + ' ' + nextLbl + 's</strong> instalados.'
              + '</div>';
          }

          // Linha de níveis
          html += '<div style="font-size:12px; margin-bottom:6px; font-weight:600;">Níveis de ' + m.name + ':</div>';
          html += '<div class="merge-levels">';
          const rarityEmojiSub = { 'Common': '⚪', 'Uncommon': '🟢', 'Rare': '🔵', 'Epic': '🟣', 'Legendary': '🟡', 'Unreal': '🔴' };
          tiers.forEach(t => {
            const label = t.type === 'merge' ? (rarityLabels[t.level] || 'Lv' + t.level) : (t.rarityGroup?.title || 'Common');
            const { status, count } = userHasLevel[t.id] || { status: null, count: 0 };
            const isNext = t.id === nextTier.id;
            const chipClass = status === 'inv' ? 'has-inv' : status === 'room' ? 'has-room' : 'missing';
            const statusIcon = status === 'inv' ? '✅' : status === 'room' ? '🏠' : '❌';
            const rarityDot = rarityEmojiSub[label] || '';
            const countBadge = count > 0 ? ' <span class="chip-count">×' + count + '</span>' : '';
            const statusTip = status === 'inv' ? 'No inventário (' + count + '×)' : status === 'room' ? 'Instalada na sala (' + count + '×)' : 'Não possui';
            const powerVal = Utils.formatPower(t.power * 1e9);
            const bonusVal = t.bonusPower ? (t.bonusPower / 100).toFixed(2) + '%' : '';
            const costVal = t.price ? (t.price / 1e6).toFixed(2) + ' RLT' : (t.level > 0 ? 'gratuito' : '');
            const partsEncoded = (t.craftRecipe || []).map(r => r.name + '|' + (r.rarity || '') + '|' + r.count).join('~');
            const extra = isNext ? ' next-tier' : '';
            html += '<span class="merge-level-chip ' + chipClass + extra + '" data-tip-status="' + statusTip + '" data-tip-power="' + powerVal + '" data-tip-bonus="' + bonusVal + '" data-tip-cost="' + costVal + '" data-tip-parts="' + partsEncoded + '">' + statusIcon + ' ' + rarityDot + ' ' + label + countBadge + (isNext ? ' ←' : '') + '</span>';
          });
          html += '</div>';

          // Custo do merge
          if (nextTier.price) {
            const priceRlt = (nextTier.price / 1000000).toFixed(2);
            html += '<div style="font-size:12px; margin-bottom:8px;">💰 Custo base: <strong>' + priceRlt + ' RLT</strong> <span style="opacity:.6;">(valor sem desconto — o seu custo real depende do nível da sua forja)</span></div>';
          }

          // Ingredientes
          html += '<div class="merge-ingredients">';
          ingredientes.forEach(ing => {
            const label = ing.tipo === 'miner'
              ? ing.precisa + '× ' + ing.nome + ' (' + ing.rarity + ')'
              : ing.precisa + '× ' + ing.rarity + ' ' + ing.nome;
            html += '<div class="merge-ingredient-chip ' + (ing.ok ? 'ok' : 'nok') + '">';
            html += (ing.ok ? '✅ ' : '❌ ') + label + ' <span style="opacity:0.65;">(tem: ' + ing.tem + ')</span>';
            html += '</div>';
          });
          html += '</div>';

          html += '</div></td></tr>';
        }
      }
    }
    
    html += '</table></div>';
    html += '</div>';
    html += '</div>';

    div.innerHTML = html;
    ChipTooltip.init();

    // Event listeners
    const inventoryButtons = div.querySelectorAll('button[data-minerid]');
    inventoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const minerId = btn.getAttribute('data-minerid');
        this.mostrarModalQuantidade(minerId);
      });
    });
    
    // Restaurar scroll
    setTimeout(() => {
      const installedContainer = document.getElementById('installedMinersScroll');
      const inventoryContainer = document.getElementById('inventoryMinersScroll');
      
      if (installedContainer && scrollPosInstalled > 0) {
        installedContainer.scrollTop = scrollPosInstalled;
      }
      if (inventoryContainer && scrollPosInventory > 0) {
        inventoryContainer.scrollTop = scrollPosInventory;
      }
    }, 0);
  },
  
  recarregar: function() {
    if (this.minersCached && this.minersCached.length > 0) {
      this.renderResultado();
    }
  },

};

window.UI_Inventario = UI_Inventario;