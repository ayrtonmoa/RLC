// js/ui/inventario.js - VERSÃO FINAL COM CONTROLE DE QUANTIDADE

const UI_Inventario = {
  currentSort: { column: 'impacto', direction: 'desc' },
  currentFilter: 'all',
  instaladaSort: { column: 'impacto', direction: 'asc' },
  
  // Estado da simulação
  simulationState: {
    removedMiners: [],
    addedMiners: [], // Agora com { ...miner, quantidadeAdicionada }
    active: false
  },

  mostrar: function(user) {
    const div = document.getElementById('inventario');
    div.innerHTML = `
      <h2>Inventário</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50;">
        <h4>💡 Como Usar</h4>
        <p>1. Vá em <a href="https://rollercoin.com/storage/inventory/miners" target="_blank">Storage > Miners no RollerCoin 🔗</a></p>
        <p>2. Clique "Load more" até carregar tudo</p>
        <p>3. Ctrl+A, Ctrl+C para copiar</p>
        <p>4. Cole abaixo e clique em Analisar</p>
      </div>

      <textarea id="inventarioText" rows="8" placeholder="Cole aqui..." style="width: 100%; padding: 10px; margin: 15px 0;"></textarea>
      <button onclick="UI_Inventario.analisar()">🔍 Analisar Inventário</button>
      <button onclick="UI_Inventario.debugParsing()" style="background: #6c757d;">🐛 Debug Parsing</button>
      
      <div id="resultadoInventario" style="margin-top: 20px;"></div>
    `;
  },
  
  analisar: function() {
    const texto = document.getElementById('inventarioText').value;
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
      
      this.mostrarResultado(comImpacto, minersFracas);
      
    } catch (error) {
      resultDiv.innerHTML = '<p class="error">Erro: ' + error.message + '</p>';
      console.error(error);
    }
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
    
    console.log('📋 Total de linhas:', linhas.length);
    
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
    
    console.log('\n📊 RESULTADO FINAL:', miners.length, 'miners extraídas');
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
      
      // Calcular impacto de APENAS 1 unidade (para referência)
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
        impacto: impactoUmaUnidade, // Impacto de 1 unidade
        jaPossui: jaPossui,
        minerInstalada: minerInstalada,
        tipoMatch: tipoMatch,
        description: m.catalogData?.description,
        collection: m.catalogData?.collectionDescription,
        supply: m.catalogData?.supply,
        canBeSold: m.catalogData?.canBeSold,
        rarityGroup: m.catalogData?.rarityGroup,
        catalogData: m.catalogData
      };
    }).sort((a, b) => b.impacto - a.impacto);
  },
  
  mostrarResultado: function(miners, minersFracas) {
    this.minersCached = miners;
    this.minersFracasCached = minersFracas;
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
  
  // ========== FUNÇÕES DE SIMULAÇÃO (COM QUANTIDADE) ==========
  
  toggleRemoverMiner: function(minerIndex) {
    const idx = this.simulationState.removedMiners.findIndex(m => m.minerIndex === minerIndex);
    
    if (idx > -1) {
      this.simulationState.removedMiners.splice(idx, 1);
      Utils.mostrarNotificacao('🔄 Remoção desfeita!', 'info');
    } else {
      const userData = State.getUserData();
      const impacts = Calculations.calcularImpactos(userData);
      const impact = impacts.find(i => i.minerIndex === minerIndex);
      
      if (impact) {
        this.simulationState.removedMiners.push(impact);
        Utils.mostrarNotificacao('❌ Miner marcada para remoção!', 'warning');
      }
    }
    
    this.simulationState.active = this.simulationState.removedMiners.length > 0 || this.simulationState.addedMiners.length > 0;
    this.renderResultado();
  },
  
  mostrarModalQuantidade: function(inventoryIndex) {
    const miner = this.minersCached[inventoryIndex];
    if (!miner) return;
    
    // Verificar se já foi adicionada
    const jaAdicionada = this.simulationState.addedMiners.find(am => 
      am.name === miner.name && 
      am.level === miner.level && 
      Math.abs(am.power - miner.power) < 10
    );
    
    if (jaAdicionada) {
      // Remover
      const idx = this.simulationState.addedMiners.indexOf(jaAdicionada);
      this.simulationState.addedMiners.splice(idx, 1);
      this.simulationState.active = this.simulationState.removedMiners.length > 0 || this.simulationState.addedMiners.length > 0;
      this.renderResultado();
      Utils.mostrarNotificacao('🔄 Adição desfeita!', 'info');
      return;
    }
    
    // Se só tem 1, adicionar direto
    if (miner.quantity === 1) {
      this.adicionarMinerComQuantidade(inventoryIndex, 1);
      return;
    }
    
    // Criar modal
    const modalHTML = `
      <div id="quantidadeModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
          <h3 style="margin: 0 0 20px 0;">📦 Quantas unidades adicionar?</h3>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0;">${miner.name} (${miner.level})</h4>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Disponível no inventário:</strong> ${miner.quantity} unidades</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Células por unidade:</strong> ${miner.cells}</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Power por unidade:</strong> ${Utils.formatPower(miner.power * 1e9)}</p>
          </div>
          
          <div style="background: #fff3e0; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 12px; border-left: 4px solid #FF9800;">
            <strong>⚠️ Importante:</strong><br>
            • <strong>1ª unidade:</strong> Ganha bônus de coleção ${miner.jaPossui ? '❌ (você já possui)' : '✅ (você não possui)'}<br>
            • <strong>2ª+ unidades:</strong> ❌ NÃO ganham bônus de coleção (duplicatas)
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold;">Quantidade (1 a ${miner.quantity}):</label>
            <input type="number" id="quantidadeInput" min="1" max="${miner.quantity}" value="1" 
                   style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #007bff; border-radius: 5px;">
          </div>
          
          <div id="previewImpacto" style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
            <div id="impactoCalculado"></div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button onclick="UI_Inventario.fecharModal()" style="padding: 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">❌ Cancelar</button>
            <button onclick="UI_Inventario.confirmarAdicao(${inventoryIndex})" style="padding: 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">✅ Adicionar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Atualizar preview em tempo real
    const input = document.getElementById('quantidadeInput');
    const updatePreview = () => {
      const qty = parseInt(input.value) || 1;
      const preview = this.calcularImpactoMultiplo(miner, qty);
      
      document.getElementById('impactoCalculado').innerHTML = `
        <h4 style="margin: 0 0 10px 0;">💎 Impacto de ${qty} unidade${qty > 1 ? 's' : ''}:</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
          <div>
            <strong>Células ocupadas:</strong><br>
            ${preview.celulasTotal}
          </div>
          <div>
            <strong>Ganho de power:</strong><br>
            <span style="color: #28a745; font-weight: bold;">${Utils.formatPower(preview.impactoTotal * 1e9)}</span>
          </div>
        </div>
        <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 3px; font-size: 12px;">
          <strong>Detalhamento:</strong><br>
          • 1ª unidade: ${Utils.formatPower(preview.impactoPrimeira * 1e9)} ${preview.comBonus ? '(com bônus ✅)' : '(sem bônus ❌)'}<br>
          ${qty > 1 ? '• Demais ' + (qty - 1) + ' unidade' + (qty > 2 ? 's' : '') + ': ' + Utils.formatPower(preview.impactoDemais * 1e9) + ' (sem bônus de coleção)' : ''}
        </div>
      `;
    };
    
    input.addEventListener('input', updatePreview);
    updatePreview();
  },
  
  calcularImpactoMultiplo: function(miner, quantidade) {
    const userData = State.getUserData();
    const baseAtual = userData.roomData.miners.reduce((s, m) => s + m.power, 0);
    const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
    
    const ganhoBasePorUnidade = miner.power;
    const ganhoBonusQueReceberaPorUnidade = miner.power * bonusPercentualAtual;
    const ganhoBonusDeColecao = miner.jaPossui ? 0 : (baseAtual * (miner.bonus / 100));
    
    // Primeira unidade (com ou sem bônus de coleção)
    const impactoPrimeira = ganhoBasePorUnidade + ganhoBonusQueReceberaPorUnidade + ganhoBonusDeColecao;
    
    // Demais unidades (sem bônus de coleção)
    const impactoPorDuplicata = ganhoBasePorUnidade + ganhoBonusQueReceberaPorUnidade;
    
    const impactoDemais = (quantidade - 1) * impactoPorDuplicata;
    const impactoTotal = impactoPrimeira + impactoDemais;
    
    return {
      impactoTotal,
      impactoPrimeira,
      impactoDemais,
      comBonus: !miner.jaPossui,
      celulasTotal: quantidade * miner.cells
    };
  },
  
  confirmarAdicao: function(inventoryIndex) {
    const quantidade = parseInt(document.getElementById('quantidadeInput').value);
    this.fecharModal();
    this.adicionarMinerComQuantidade(inventoryIndex, quantidade);
  },
  
  adicionarMinerComQuantidade: function(inventoryIndex, quantidade) {
    const miner = this.minersCached[inventoryIndex];
    if (!miner) return;
    
    const impactoCalculado = this.calcularImpactoMultiplo(miner, quantidade);
    
    // Adicionar com quantidade
    const minerParaAdicionar = {
      ...miner,
      quantidadeAdicionada: quantidade,
      impactoTotal: impactoCalculado.impactoTotal,
      celulasTotal: impactoCalculado.celulasTotal
    };
    
    this.simulationState.addedMiners.push(minerParaAdicionar);
    
    const userData = State.getUserData();
    const simResult = this.calcularPowerSimulado(userData);
    
    if (simResult.espacoLivre < 0) {
      Utils.mostrarNotificacao('⚠️ Espaço insuficiente! Faltam ' + Math.abs(simResult.espacoLivre) + ' células.', 'warning');
    } else {
      Utils.mostrarNotificacao('✅ ' + quantidade + ' unidade' + (quantidade > 1 ? 's' : '') + ' adicionada' + (quantidade > 1 ? 's' : '') + ' à simulação!', 'success');
    }
    
    this.simulationState.active = true;
    this.renderResultado();
  },
  
  fecharModal: function() {
    const modal = document.getElementById('quantidadeModal');
    if (modal) modal.remove();
  },
  
  calcularPowerSimulado: function(userData) {
    const powerAtual = userData.powerData.current_power;
    
    const capacidadeTotal = userData.roomData.racks.reduce((sum, r) => {
      return sum + (r.rack_info ? r.rack_info.width * r.rack_info.height : 0);
    }, 0);
    
    const celulasOcupadasOriginais = userData.roomData.miners.reduce((sum, m) => {
      return sum + (m.width || 2);
    }, 0);
    
    const celulasRemovidas = this.simulationState.removedMiners.reduce((sum, m) => {
      return sum + (m.width || 2);
    }, 0);
    
    const celulasAdicionadas = this.simulationState.addedMiners.reduce((sum, m) => {
      return sum + m.celulasTotal; // ✅ Usa celulasTotal (quantidade × cells)
    }, 0);
    
    const celulasOcupadasSimuladas = celulasOcupadasOriginais - celulasRemovidas + celulasAdicionadas;
    const espacoLivre = capacidadeTotal - celulasOcupadasSimuladas;
    
    const perdaPower = this.simulationState.removedMiners.reduce((sum, m) => sum + m.impact, 0);
    const ganhoPower = this.simulationState.addedMiners.reduce((sum, m) => sum + m.impactoTotal, 0); // ✅ Usa impactoTotal
    
    const powerSimulado = powerAtual - perdaPower + ganhoPower;
    const diferenca = powerSimulado - powerAtual;
    
    return {
      powerAtual,
      powerSimulado,
      diferenca,
      espacoLivre,
      celulasOcupadasSimuladas
    };
  },
  

  
  resetarSimulacao: function() {
    this.simulationState = {
      removedMiners: [],
      addedMiners: [],
      active: false
    };
    
    this.renderResultado();
    Utils.mostrarNotificacao('🔄 Simulação resetada!', 'info');
  },
  
  renderResultado: function() {
    if (!this.minersCached) return;
    
    const div = document.getElementById('resultadoInventario');
    const userData = State.getUserData();
    
    let miners = [...this.minersCached];
    let minersFracas = [...this.minersFracasCached];
    
    // FILTRAR
    if (this.currentFilter === 'nao_possui') {
      miners = miners.filter(m => !m.jaPossui && m.tipoMatch !== 'nome_diferente_tier');
    } else if (this.currentFilter === 'possui_outra') {
      miners = miners.filter(m => m.tipoMatch === 'nome_diferente_tier');
    } else if (this.currentFilter === 'possui_exata') {
      miners = miners.filter(m => m.jaPossui && m.tipoMatch === 'exato');
    }
    
    // ORDENAR (código de ordenação igual ao anterior)
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
          const levelOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Unreal': 6 };
          valA = levelOrder[a.level] || 0;
          valB = levelOrder[b.level] || 0;
          break;
        
        case 'cells':
          valA = a.width || 2;
          valB = b.width || 2;
          break;
        
        case 'bonus':
          valA = a.minerBonusPercent;
          valB = b.minerBonusPercent;
          break;
        
        case 'power':
          valA = a.basePower;
          valB = b.basePower;
          break;
        
        case 'impacto':
          valA = a.impact;
          valB = b.impact;
          break;
        
        default:
          valA = a.impact;
          valB = b.impact;
      }
      
      if (this.instaladaSort.column !== 'nome') {
        return this.instaladaSort.direction === 'desc' ? valB - valA : valA - valB;
      }
    });
    
    const totalUnidades = this.minersCached.reduce((sum, m) => sum + m.quantity, 0);
    const minersUnicas = this.minersCached.length;
    
    const capacidadeTotal = userData.roomData.racks.reduce((sum, r) => {
      return sum + (r.rack_info ? r.rack_info.width * r.rack_info.height : 0);
    }, 0);
    
    const celulasOcupadas = userData.roomData.miners.reduce((sum, m) => {
      return sum + (m.width || 2);
    }, 0);
    
    const espacoLivre = capacidadeTotal - celulasOcupadas;
    const salaCheia = espacoLivre <= 0;
    
    let html = '<h3>📦 ' + totalUnidades + ' unidades encontradas (' + minersUnicas + ' miners únicas)</h3>';
    html += '<p style="font-size: 12px; color: #666;">Miners agrupadas por tipo | Mostrando: ' + miners.length + ' miners</p>';
    
    // PAINEL DE SIMULAÇÃO (igual ao anterior, mas mostra quantidade)
    if (this.simulationState.active) {
      const simResult = this.calcularPowerSimulado(userData);
      
      html += '<div style="background: #e3f2fd; border: 3px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 8px;">';
      html += '<h3 style="margin: 0 0 15px 0;">🔄 Simulação de Trocas Ativa</h3>';
      
      html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">';
      
      html += '<div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">';
      html += '<div style="font-size: 12px; color: #666;">⚡ Power Atual</div>';
      html += '<div style="font-size: 24px; font-weight: bold; color: #333;">' + Utils.formatPower(simResult.powerAtual * 1e9) + '</div>';
      html += '</div>';
      
      html += '<div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">';
      html += '<div style="font-size: 12px; color: #666;">🎯 Power Simulado</div>';
      html += '<div style="font-size: 24px; font-weight: bold; color: ' + (simResult.diferenca >= 0 ? '#28a745' : '#dc3545') + ';">' + Utils.formatPower(simResult.powerSimulado * 1e9) + '</div>';
      html += '</div>';
      
      const diferencaPercent = (simResult.diferenca / simResult.powerAtual) * 100;
      html += '<div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">';
      html += '<div style="font-size: 12px; color: #666;">' + (simResult.diferenca >= 0 ? '📈' : '📉') + ' Diferença</div>';
      html += '<div style="font-size: 24px; font-weight: bold; color: ' + (simResult.diferenca >= 0 ? '#28a745' : '#dc3545') + ';">';
      html += (simResult.diferenca >= 0 ? '+' : '') + Utils.formatPower(simResult.diferenca * 1e9) + '</div>';
      html += '<div style="font-size: 11px; color: #666;">(' + (simResult.diferenca >= 0 ? '+' : '') + diferencaPercent.toFixed(2) + '%)</div>';
      html += '</div>';
      
      html += '</div>';
      
      html += '<div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">';
      html += '<strong>🏠 Espaço:</strong> ';
      html += simResult.espacoLivre + ' células livres';
      if (simResult.espacoLivre < 0) {
        html += ' <span style="color: #dc3545; font-weight: bold;">❌ SALA LOTADA!</span>';
      } else if (simResult.espacoLivre === 0) {
        html += ' <span style="color: #ff9800;">⚠️ Espaço justo</span>';
      } else {
        html += ' <span style="color: #28a745;">✅ OK</span>';
      }
      html += '</div>';
      
      if (this.simulationState.removedMiners.length > 0 || this.simulationState.addedMiners.length > 0) {
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">';
        
        html += '<div style="background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">';
        html += '<h4 style="margin: 0 0 10px 0;">❌ Removidas (' + this.simulationState.removedMiners.length + ')</h4>';
        if (this.simulationState.removedMiners.length > 0) {
          html += '<div style="max-height: 150px; overflow-y: auto; font-size: 12px;">';
          this.simulationState.removedMiners.forEach((m) => {
            html += '<div style="padding: 5px 0; border-bottom: 1px dashed #ddd;">';
            html += '<strong>' + m.name + '</strong> (' + m.level + ')<br>';
            html += '<span style="color: #666;">-' + Utils.formatPower(m.impact * 1e9) + ' | ' + m.width + ' cél</span>';
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
        
        html += '<div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">';
        html += '<h4 style="margin: 0 0 10px 0;">✅ Adicionadas (' + this.simulationState.addedMiners.length + ' tipos)</h4>';
        if (this.simulationState.addedMiners.length > 0) {
          html += '<div style="max-height: 150px; overflow-y: auto; font-size: 12px;">';
          this.simulationState.addedMiners.forEach((m) => {
            html += '<div style="padding: 5px 0; border-bottom: 1px dashed #ddd;">';
            html += '<strong>' + m.quantidadeAdicionada + 'x ' + m.name + '</strong> (' + m.level + ')<br>';
            html += '<span style="color: #666;">+' + Utils.formatPower(m.impactoTotal * 1e9) + ' | ' + m.celulasTotal + ' cél</span>';
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
        
        html += '</div>';
      }
      
html += '<div style="text-align: center;">';
html += '<button onclick="UI_Inventario.resetarSimulacao()" style="padding: 12px 30px; background: #dc3545; color: white; font-weight: bold; border: none; border-radius: 5px; cursor: pointer;">🔄 Resetar Simulação</button>';
html += '</div>';
      
      html += '</div>';
    }
    
    // INSTRUÇÕES
    html += '<div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 5px; border-left: 4px solid #FF9800;">';
    html += '<strong>🔄 Como usar:</strong> ';
    html += 'Clique nos botões ❌/✅ nas tabelas. Para miners com quantidade > 1, escolha quantas adicionar. ';
    html += 'Use a simulação para ver o impacto antes de fazer mudanças reais no inventário.';
    html += '</div>';
    
    // FILTROS
    html += '<div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">';
    html += '<strong>🔍 Filtros:</strong> ';
    html += '<button onclick="UI_Inventario.filtrar(\'all\')" style="margin: 0 5px; ' + (this.currentFilter === 'all' ? 'background: #007bff; color: white;' : '') + '">Todas</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'nao_possui\')" style="margin: 0 5px; ' + (this.currentFilter === 'nao_possui' ? 'background: #28a745; color: white;' : '') + '">🆕 Não Possuo</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'possui_outra\')" style="margin: 0 5px; ' + (this.currentFilter === 'possui_outra' ? 'background: #ff9800; color: white;' : '') + '">⚠️ Tier Diferente</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'possui_exata\')" style="margin: 0 5px; ' + (this.currentFilter === 'possui_exata' ? 'background: #6c757d; color: white;' : '') + '">✔️ Já Possuo</button>';
    html += '</div>';
    
    if (salaCheia) {
      html += '<div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0;">';
      html += '<h4 style="margin: 0;">⚠️ Sala Cheia! (' + capacidadeTotal + ' células)</h4>';
      html += '<p style="margin: 5px 0 0 0; font-size: 13px;">Use a simulação para testar trocas</p>';
      html += '</div>';
    } else {
      html += '<div style="background: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0;">';
      html += '<h4 style="margin: 0;">✅ Você tem ' + espacoLivre + ' células livres!</h4>';
      html += '</div>';
    }
    
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">';
    
    // ========== COLUNA 1: MINERS INSTALADAS ==========
    html += '<div>';
    if (minersFracas && minersFracas.length > 0) {
      html += '<div style="background: #fff3e0; border-left: 4px solid #FF9800; padding: 15px; margin-bottom: 15px;">';
      html += '<h4 style="margin: 0 0 10px 0;">🔍 Suas ' + minersFracas.length + ' Miners Instaladas</h4>';
      html += '</div>';
      
      html += '<div style="max-height: 600px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">';
      html += '<table style="font-size: 11px; width: 100%;"><tr>';
      html += '<th>Pos</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'nome\')" style="cursor: pointer;">Nome ' + (this.instaladaSort.column === 'nome' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'level\')" style="cursor: pointer;">Level ' + (this.instaladaSort.column === 'level' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'cells\')" style="cursor: pointer;">Cél ' + (this.instaladaSort.column === 'cells' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'power\')" style="cursor: pointer;">Power ' + (this.instaladaSort.column === 'power' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'impacto\')" style="cursor: pointer;">Impacto ' + (this.instaladaSort.column === 'impacto' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th style="width: 80px;">Ação</th>';
      html += '</tr>';
      
      for (let i = 0; i < minersFracas.length; i++) {
        const m = minersFracas[i];
        const cor = i < 10 ? 'low-impact' : (i < 30 ? 'medium-impact' : 'high-impact');
        const isRemoved = this.simulationState.removedMiners.some(rm => rm.minerIndex === m.minerIndex);
        const trStyle = isRemoved ? 'opacity: 0.5; text-decoration: line-through;' : '';
        
        html += '<tr class="' + cor + '" style="' + trStyle + '">';
        html += '<td>#' + (i + 1);
        if (isRemoved) html += ' <span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">🔴</span>';
        html += '</td>';
        html += '<td><strong>' + m.name + '</strong></td>';
        html += '<td>' + m.level + '</td>';
        html += '<td>' + (m.width || 2) + '</td>';
        html += '<td>' + Utils.formatPower(m.basePower * 1e9) + '</td>';
        html += '<td>' + Utils.formatPower(m.impact * 1e9) + '</td>';
        html += '<td style="text-align: center;">';
        html += '<button onclick="UI_Inventario.toggleRemoverMiner(' + m.minerIndex + ')" style="padding: 5px 10px; background: ' + (isRemoved ? '#6c757d' : '#dc3545') + '; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">';
        html += isRemoved ? '🔄' : '❌';
        html += '</button>';
        html += '</td>';
        html += '</tr>';
      }
      
      html += '</table></div>';
    }
    html += '</div>';
    
    // ========== COLUNA 2: INVENTÁRIO ==========
    html += '<div>';
    html += '<div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin-bottom: 15px;">';
    html += '<h4 style="margin: 0 0 10px 0;">📋 Seu Inventário</h4>';
    html += '</div>';
    
    html += '<div style="max-height: 600px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">';
    html += '<table style="font-size: 11px; width: 100%;"><tr>';
    html += '<th>#</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'nome\')" style="cursor: pointer;">Nome ' + (this.currentSort.column === 'nome' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'level\')" style="cursor: pointer;">Lvl ' + (this.currentSort.column === 'level' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'quantity\')" style="cursor: pointer;">Qty ' + (this.currentSort.column === 'quantity' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'cells\')" style="cursor: pointer;">Cél ' + (this.currentSort.column === 'cells' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'power\')" style="cursor: pointer;">Power ' + (this.currentSort.column === 'power' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'impacto\')" style="cursor: pointer;">Ganho/un ' + (this.currentSort.column === 'impacto' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'status\')" style="cursor: pointer;">Status ' + (this.currentSort.column === 'status' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th style="width: 80px;">Ação</th>';
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
      
      const isAdded = this.simulationState.addedMiners.some(am => 
        am.name === m.name && 
        am.level === m.level && 
        Math.abs(am.power - m.power) < 10
      );
      
      const qtyAdicionada = isAdded ? this.simulationState.addedMiners.find(am => 
        am.name === m.name && am.level === m.level
      ).quantidadeAdicionada : 0;
      
      const trStyle = isAdded ? 'background: #e8f5e8;' : '';
      
      html += '<tr class="' + cor + '" style="' + trStyle + '">';
      html += '<td>' + (i + 1);
      if (isAdded) html += ' <span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">' + qtyAdicionada + 'x</span>';
      html += '</td>';
      html += '<td><strong>' + m.name + '</strong></td>';
      html += '<td>' + emoji + ' ' + nivel + '</td>';
      html += '<td><strong>' + m.quantity + '</strong></td>';
      html += '<td>' + m.cells + '</td>';
      html += '<td>' + Utils.formatPower(m.power * 1e9) + '</td>';
      html += '<td>' + Utils.formatPower(m.impacto * 1e9) + '</td>';
      html += '<td>' + statusText + '</td>';
      html += '<td style="text-align: center;">';
      html += '<button onclick="UI_Inventario.mostrarModalQuantidade(' + i + ')" style="padding: 5px 10px; background: ' + (isAdded ? '#6c757d' : '#28a745') + '; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">';
      html += isAdded ? '🔄' : '✅';
      html += '</button>';
      html += '</td>';
      html += '</tr>';
    }
    
    html += '</table></div>';
    html += '</div>';
    html += '</div>';
    
    div.innerHTML = html;
  },
  
debugParsing: function() {
    const texto = document.getElementById('inventarioText').value;
    if (!texto) {
      alert('Cole o texto primeiro!');
      return;
    }
    
    console.log('\n\n🐛🐛🐛 DEBUG PARSING INICIADO 🐛🐛🐛\n');
    const resultado = this.extrair(texto);
    
    console.log('\n📊 RESULTADO:');
    console.log('Total extraídas:', resultado.length);
    resultado.forEach((m, i) => {
      console.log((i + 1) + '.', m.name, '→', m.level, '|', m.quantity, 'unidades');
    });
    
    alert('✅ Veja o Console (F12) para detalhes!');
  },  // ⬅️ ADICIONE UMA VÍRGULA AQUI!
  
  // ⬇️ ADICIONE ESTA FUNÇÃO AQUI
  recarregar: function() {
    if (this.minersCached && this.minersCached.length > 0) {
      this.renderResultado();
    }
  }  // ⬅️ SEM VÍRGULA NA ÚLTIMA FUNÇÃO
};

window.UI_Inventario = UI_Inventario;
console.log('✅ UI_Inventario v4 FINAL (Com Controle de Quantidade) loaded');