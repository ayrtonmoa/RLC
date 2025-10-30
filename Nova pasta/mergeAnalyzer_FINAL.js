// js/ui/mergeAnalyzer.js - Interface do Merge Analyzer (SEM MergeCalculator)

const UI_MergeAnalyzer = {
  currentPrices: null,
  mergesData: [],
  currentSort: { column: 'powerRatio', direction: 'asc' },
  currentFilter: { level: 'all', status: 'all' },
  searchTerm: '',
  customCosts: {},

  mostrar(user) {
    const div = document.getElementById('merge');
    this.currentPrices = MergePrices.load();
    this.loadCustomCosts();

    div.innerHTML = `
      <h2>🔄 Merge Analyzer PRO</h2>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">Análise completa de merges com cálculo de ROI</p>

      <div class="card" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h3>💡 Passo a Passo</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
          <div>
            <strong>1. Configure Preços</strong>
            <p style="font-size: 13px; margin: 5px 0;"><a href="https://rollercoin.com/storage/merge/parts" target="_blank">Storage → Parts 🔗</a></p>
          </div>
          <div>
            <strong>2. Cole e Salve</strong>
            <p style="font-size: 13px; margin: 5px 0;">Copie tudo da página Parts</p>
          </div>
          <div>
            <strong>3. Analise Merges</strong>
            <p style="font-size: 13px; margin: 5px 0;"><a href="https://rollercoin.com/storage/merge/miners" target="_blank">Storage → Merge 🔗</a></p>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3>💰 Preços das Partes</h3>
          <button onclick="UI_MergeAnalyzer.resetPrices()" style="background: #6c757d;">🔄 Resetar</button>
        </div>

        ${this.renderPricesGrid()}

        <div style="margin-top: 20px;">
          <textarea id="pricesPasteArea" placeholder="Cole TODO o conteúdo da página Storage → Parts aqui..." rows="6" style="width: 100%; padding: 10px;"></textarea>
          <button onclick="UI_MergeAnalyzer.updatePricesFromPaste()" style="margin-top: 10px;">📋 Atualizar Preços</button>
        </div>
      </div>

      <div class="card">
        <h3>📊 Análise de Merges</h3>
        
        <textarea id="mergeText" placeholder="Cole TODO o conteúdo da página Storage → Merge aqui (Load all primeiro)..." rows="8" style="width: 100%; padding: 10px; margin: 15px 0;"></textarea>
        
        <div style="margin-bottom: 15px;">
          <button onclick="UI_MergeAnalyzer.analisarMerges()">🔍 Analisar Merges</button>
          <button onclick="UI_MergeAnalyzer.exportarCSV()" style="background: #6c757d;">📊 Exportar CSV</button>
        </div>

        <div id="mergeResults"></div>
      </div>
    `;
  },

  renderPricesGrid() {
    const levels = [
      { key: 'common', name: 'Common', roman: 'I', icon: '⚪' },
      { key: 'uncommon', name: 'Uncommon', roman: 'II', icon: '🟢' },
      { key: 'rare', name: 'Rare', roman: 'III', icon: '🔵' },
      { key: 'epic', name: 'Epic', roman: 'IV', icon: '🟣' },
      { key: 'legendary', name: 'Legendary', roman: 'V', icon: '🟡' }
    ];

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0;">';
    
    levels.forEach(level => {
      const prices = this.currentPrices[level.key];
      html += `
        <div class="summary-item">
          <h4>${level.icon} ${level.name} (${level.roman})</h4>
          <div style="display: grid; gap: 8px; margin-top: 10px;">
            <div>
              <label style="font-size: 12px; display: block; margin-bottom: 3px;">Fan:</label>
              <input type="number" step="0.000001" value="${prices.part1}" id="price_${level.key}_1" onchange="UI_MergeAnalyzer.updateSinglePrice('${level.key}', 1)" style="width: 100%; padding: 5px; font-size: 13px;">
            </div>
            <div>
              <label style="font-size: 12px; display: block; margin-bottom: 3px;">Wire:</label>
              <input type="number" step="0.000001" value="${prices.part2}" id="price_${level.key}_2" onchange="UI_MergeAnalyzer.updateSinglePrice('${level.key}', 2)" style="width: 100%; padding: 5px; font-size: 13px;">
            </div>
            <div>
              <label style="font-size: 12px; display: block; margin-bottom: 3px;">Hashboard:</label>
              <input type="number" step="0.000001" value="${prices.part3}" id="price_${level.key}_3" onchange="UI_MergeAnalyzer.updateSinglePrice('${level.key}', 3)" style="width: 100%; padding: 5px; font-size: 13px;">
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  },

  updateSinglePrice(level, partNum) {
    const input = document.getElementById(`price_${level}_${partNum}`);
    const value = parseFloat(input.value);
    if (!isNaN(value) && value >= 0) {
      this.currentPrices[level][`part${partNum}`] = value;
      MergePrices.save(this.currentPrices);
      input.style.background = '#d4edda';
      setTimeout(() => { input.style.background = ''; }, 500);
    }
  },

  updatePricesFromPaste() {
    const text = document.getElementById('pricesPasteArea').value;
    if (!text.trim()) {
      Utils.mostrarNotificacao('⚠️ Cole os preços primeiro!', 'warning');
      return;
    }

    try {
      const newPrices = MergePrices.parseFromText(text);
      this.currentPrices = newPrices;
      MergePrices.save(newPrices);
      
      Object.keys(newPrices).forEach(level => {
        for (let i = 1; i <= 3; i++) {
          const input = document.getElementById(`price_${level}_${i}`);
          if (input) {
            input.value = newPrices[level][`part${i}`];
            input.style.background = '#d4edda';
            setTimeout(() => { input.style.background = ''; }, 1000);
          }
        }
      });

      Utils.mostrarNotificacao('✅ Preços atualizados e salvos!', 'success');
      document.getElementById('pricesPasteArea').value = '';
    } catch (error) {
      Utils.mostrarNotificacao('❌ Erro: ' + error.message, 'error');
      console.error(error);
    }
  },

  resetPrices() {
    if (!confirm('Resetar todos os preços para o padrão?')) return;
    this.currentPrices = MergePrices.reset();
    Object.keys(this.currentPrices).forEach(level => {
      for (let i = 1; i <= 3; i++) {
        const input = document.getElementById(`price_${level}_${i}`);
        if (input) input.value = this.currentPrices[level][`part${i}`];
      }
    });
    Utils.mostrarNotificacao('🔄 Preços resetados!', 'success');
  },

  analisarMerges() {
    const text = document.getElementById('mergeText').value;
    if (!text.trim()) {
      document.getElementById('mergeResults').innerHTML = '<p class="error">Cole o conteúdo primeiro!</p>';
      return;
    }

    const userData = State.getUserData();
    if (!userData) {
      document.getElementById('mergeResults').innerHTML = '<p class="error">Analise seu perfil primeiro!</p>';
      return;
    }

    try {
      const merges = MergeParser.parse(text);
      if (merges.length === 0) {
        document.getElementById('mergeResults').innerHTML = '<p class="warning">Nenhum merge encontrado no texto colado.</p>';
        return;
      }

      // ✅ CALCULAR DIRETO AQUI (SEM MergeCalculator)
      this.mergesData = this.calcularMerges(merges, userData);
      this.sortMerges();
      this.renderResults();

    } catch (error) {
      document.getElementById('mergeResults').innerHTML = `<p class="error">Erro: ${error.message}</p>`;
      console.error(error);
    }
  },

  // ✅ NOVA FUNÇÃO: Calcular merges direto aqui
  calcularMerges(merges, userData) {
    console.log('🔢 Calculando', merges.length, 'merges');
    
    return merges.map(merge => {
      const levelKey = merge.currentLevel.toLowerCase();
      const levelPrices = this.currentPrices[levelKey];
      
      if (!levelPrices) {
        console.warn('⚠️ Preços não encontrados para level:', merge.currentLevel);
        return null;
      }

      // Calcular custo das partes necessárias
      let partsCost = 0;
      merge.components.forEach((comp, idx) => {
        const partPrice = levelPrices[`part${idx + 1}`];
        const needToBuy = Math.max(0, comp.needed - comp.available);
        partsCost += needToBuy * partPrice;
      });

      // Taxa de merge
      const mergeFee = MergePrices.getMergeFee(merge.currentLevel);
      const partsPlusFee = partsCost + mergeFee;

      // Calcular ganhos
      const powerGain = merge.powerAfter - merge.powerBefore;
      const bonusGain = merge.bonusAfter - merge.bonusBefore;

      // Calcular impacto real
      const impacto = this.calcularImpactoReal(merge, userData, powerGain, bonusGain);

      // Calcular ratios (custo por ganho)
      const powerRatio = powerGain > 0 ? partsPlusFee / powerGain : 999999;
      const bonusRatio = bonusGain > 0 ? partsPlusFee / bonusGain : 999999;

      return {
        name: merge.name,
        currentLevel: merge.currentLevel,
        nextLevel: this.getNextLevel(merge.currentLevel),
        minerQty: merge.minerQty,
        minerNeeded: merge.minerNeeded,
        components: merge.components,
        powerBefore: merge.powerBefore,
        powerAfter: merge.powerAfter,
        powerGain: powerGain,
        bonusBefore: merge.bonusBefore,
        bonusAfter: merge.bonusAfter,
        bonusGain: bonusGain,
        partsCost: partsCost,
        mergeFee: mergeFee,
        partsPlusFee: partsPlusFee,
        finalCost: partsPlusFee,
        isCustomCost: false,
        powerRatio: powerRatio,
        bonusRatio: bonusRatio,
        isPossible: merge.isPossible,
        impactoReal: impacto
      };
    }).filter(m => m !== null);
  },

  getNextLevel(currentLevel) {
    const levels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    const index = levels.indexOf(currentLevel);
    return index >= 0 && index < levels.length - 1 ? levels[index + 1] : currentLevel;
  },

  calcularImpactoReal(merge, userData, powerGain, bonusGain) {
    const baseTotalAtual = userData.roomData.miners.reduce((s, m) => s + m.power, 0);
    const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;

    // Converter power gain de Th/s para GH/s
    const powerGainGH = powerGain * 1000;

    // Verificar se já possui miner deste tipo (próximo level)
    const nextLevel = this.getNextLevel(merge.currentLevel);
    const jaPossui = userData.roomData.miners.some(m => 
      m.name === merge.name && m.level_label === nextLevel
    );

    // Calcular ganho
    const ganhoBase = powerGainGH;
    const ganhoBonusQueReceberá = powerGainGH * bonusPercentualAtual;
    const ganhoBonusDeColecao = jaPossui ? 0 : (baseTotalAtual * (bonusGain / 100));

    const impactoTotal = ganhoBase + ganhoBonusQueReceberá + ganhoBonusDeColecao;
    
    return impactoTotal; // Em GH/s
  },

  sortMerges() {
    const { column, direction } = this.currentSort;
    this.mergesData.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];
      
      if (column === 'name') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      if (column === 'level') {
        const levels = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
        valA = levels[valA] || 0;
        valB = levels[valB] || 0;
      }
      
      if (column === 'status') {
        valA = a.isPossible ? 1 : 0;
        valB = b.isPossible ? 1 : 0;
      }
      
      return direction === 'asc' ? valA - valB : valB - valA;
    });
  },

  renderResults() {
    let filtered = this.mergesData;

    // Filtro de level
    if (this.currentFilter.level !== 'all') {
      filtered = filtered.filter(m => m.currentLevel === this.currentFilter.level);
    }

    // Filtro de status
    if (this.currentFilter.status === 'possible') {
      filtered = filtered.filter(m => m.isPossible);
    } else if (this.currentFilter.status === 'impossible') {
      filtered = filtered.filter(m => !m.isPossible);
    }

    // Busca
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(term));
    }

    const html = `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h4>📋 ${filtered.length} Merge${filtered.length !== 1 ? 's' : ''} Encontrado${filtered.length !== 1 ? 's' : ''}</h4>
          <input type="text" placeholder="🔍 Buscar miner..." oninput="UI_MergeAnalyzer.updateSearch(this.value)" style="padding: 8px; width: 250px;">
        </div>

        <div style="margin-bottom: 15px;">
          <strong>Filtros:</strong>
          <div style="display: inline-block; margin-left: 10px;">
            ${this.renderLevelFilters()}
          </div>
          <div style="display: inline-block; margin-left: 10px;">
            <strong>Status:</strong> ${this.renderStatusFilters()}
          </div>
        </div>
      </div>

      ${this.renderTable(filtered)}
    `;

    document.getElementById('mergeResults').innerHTML = html;
  },

  renderLevelFilters() {
    const levels = [
      { key: 'all', label: 'Todos' },
      { key: 'Common', label: '⚪ I' },
      { key: 'Uncommon', label: '🟢 II' },
      { key: 'Rare', label: '🔵 III' },
      { key: 'Epic', label: '🟣 IV' },
      { key: 'Legendary', label: '🟡 V' }
    ];

    return levels.map(l => 
      `<button onclick="UI_MergeAnalyzer.setLevelFilter('${l.key}')" style="margin: 0 3px; padding: 5px 12px; ${this.currentFilter.level === l.key ? 'background: #007bff; color: white;' : ''}">${l.label}</button>`
    ).join('');
  },

  renderStatusFilters() {
    return [
      { key: 'all', label: 'Todos' },
      { key: 'possible', label: '✅ Possível' },
      { key: 'impossible', label: '❌ Faltam Peças' }
    ].map(s => 
      `<button onclick="UI_MergeAnalyzer.setStatusFilter('${s.key}')" style="margin: 0 3px; padding: 5px 12px; ${this.currentFilter.status === s.key ? 'background: #007bff; color: white;' : ''}">${s.label}</button>`
    ).join('');
  },

  renderTable(data) {
    if (data.length === 0) return '<div style="text-align: center; padding: 30px; color: #666;">😔 Nenhum merge encontrado</div>';

    let html = `
      <div style="overflow-x: auto;">
        <table id="mergeTable" style="position: relative;">
          <thead>
            <tr>
              <th onclick="UI_MergeAnalyzer.sort('status')" style="cursor: pointer;">Status ${this.getSortIcon('status')}</th>
              <th onclick="UI_MergeAnalyzer.sort('name')" style="cursor: pointer;">Miner ${this.getSortIcon('name')}</th>
              <th onclick="UI_MergeAnalyzer.sort('level')" style="cursor: pointer;">Level ${this.getSortIcon('level')}</th>
              <th>Miners</th>
              <th>Fan</th>
              <th>Wire</th>
              <th>Hashboard</th>
              <th onclick="UI_MergeAnalyzer.sort('partsCost')" style="cursor: pointer;">Parts Cost ${this.getSortIcon('partsCost')}</th>
              <th onclick="UI_MergeAnalyzer.sort('mergeFee')" style="cursor: pointer;">Fee ${this.getSortIcon('mergeFee')}</th>
              <th onclick="UI_MergeAnalyzer.sort('powerGain')" style="cursor: pointer;">Power Δ ${this.getSortIcon('powerGain')}</th>
              <th onclick="UI_MergeAnalyzer.sort('bonusGain')" style="cursor: pointer;">Bonus Δ ${this.getSortIcon('bonusGain')}</th>
              <th onclick="UI_MergeAnalyzer.sort('finalCost')" style="cursor: pointer;">Final Cost ${this.getSortIcon('finalCost')}</th>
              <th onclick="UI_MergeAnalyzer.sort('powerRatio')" style="cursor: pointer;">Power Ratio ${this.getSortIcon('powerRatio')}</th>
              <th onclick="UI_MergeAnalyzer.sort('bonusRatio')" style="cursor: pointer;">Bonus Ratio ${this.getSortIcon('bonusRatio')}</th>
            </tr>
          </thead>
          <tbody id="mergeTableBody">
    `;

    data.forEach((m) => {
      const customCost = this.getCustomCost(m.name, m.currentLevel);
      
      const minerStatus = m.minerQty >= m.minerNeeded;
      const partsStatus = m.components.map((comp) => {
        const hasEnough = comp.needed === 0 || comp.available >= comp.needed;
        const statusIcon = comp.needed === 0 ? '—' : (hasEnough ? '✅' : '❌');
        return { hasEnough, statusIcon, available: comp.available, needed: comp.needed };
      });
      
      const allPossible = m.isPossible;
      const rowClass = allPossible ? 'low-impact' : 'high-impact';
      
      // Classe de ratio (melhor = verde)
      let ratioClass = '';
      if (m.powerRatio < 10) ratioClass = 'low-impact';
      else if (m.powerRatio < 50) ratioClass = 'medium-impact';
      else ratioClass = 'high-impact';

      html += `
        <tr class="${rowClass}">
          <td style="font-size: 18px; text-align: center;">${allPossible ? '✅' : '❌'}</td>
          <td><strong>${m.name}</strong></td>
          <td>${this.getLevelBadge(m.currentLevel)}</td>
          <td style="text-align: center;">
            <span style="color: ${minerStatus ? 'green' : 'red'}; font-weight: bold;">
              ${minerStatus ? '✅' : '❌'} ${m.minerQty}/${m.minerNeeded}
            </span>
          </td>
          ${partsStatus.map(part => `
            <td style="text-align: center;">
              <span style="font-size: 14px;">${part.statusIcon}</span> ${part.available}/${part.needed}
            </td>
          `).join('')}
          <td><strong>${m.partsCost.toFixed(2)}</strong></td>
          <td>${m.mergeFee.toFixed(2)}</td>
          <td style="color: green; font-weight: bold;">+${m.powerGain.toFixed(2)}</td>
          <td style="color: blue; font-weight: bold;">+${m.bonusGain.toFixed(2)}%</td>
          <td>
            <input type="number" 
                   step="0.01" 
                   value="${customCost !== null ? customCost.toFixed(2) : ''}" 
                   placeholder="${m.partsPlusFee.toFixed(2)}"
                   style="width: 80px; padding: 3px; ${m.isCustomCost ? 'background: #fff3cd;' : ''}"
                   onchange="UI_MergeAnalyzer.setCustomCost('${m.name.replace(/'/g, "\\'")}', '${m.currentLevel}', this.value)">
            ${m.isCustomCost ? '<br><small style="color: #ff9800;">💰 Customizado</small>' : ''}
          </td>
          <td class="${ratioClass}"><strong>${m.powerRatio.toFixed(2)}</strong></td>
          <td class="${ratioClass}"><strong>${m.bonusRatio.toFixed(2)}</strong></td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>

      <div class="summary-item" style="margin-top: 20px; background: #e8f5e8; border-left: 4px solid #4CAF50;">
        <h4>💡 Legenda</h4>
        <ul style="font-size: 13px; line-height: 1.8;">
          <li><strong>Status:</strong> ✅ = Merge possível | ❌ = Faltam peças/miners | — = Peça não necessária</li>
          <li><strong>Miners/Parts:</strong> "disponível/necessário" (ex: 1700/1200 = tenho 1700, preciso 1200)</li>
          <li><strong>Power Δ / Bonus Δ:</strong> Ganho ao fazer o merge</li>
          <li><strong>Power Ratio:</strong> RLT por 1 Th/s ganho (menor = melhor! Verde < 10, Amarelo < 50, Vermelho > 50)</li>
          <li><strong>Bonus Ratio:</strong> RLT por 1% bonus ganho (menor = melhor!)</li>
          <li><strong>Final Cost:</strong> Digite custo customizado se comprou miner pronta 💰</li>
        </ul>
      </div>
    `;

    return html;
  },

  getLevelBadge(level) {
    const badges = {
      'Common': '⚪ I',
      'Uncommon': '🟢 II',
      'Rare': '🔵 III',
      'Epic': '🟣 IV',
      'Legendary': '🟡 V'
    };
    return badges[level] || level;
  },

  getSortIcon(column) {
    if (this.currentSort.column !== column) {
      return '<span style="color: #ccc; font-size: 10px;">▲▼</span>';
    }
    return this.currentSort.direction === 'asc' ? 
      '<span style="color: #007bff; font-size: 12px;">▲</span>' : 
      '<span style="color: #007bff; font-size: 12px;">▼</span>';
  },

  sort(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = column === 'powerRatio' || column === 'bonusRatio' ? 'asc' : 'desc';
    }
    this.sortMerges();
    this.renderResults();
  },

  setLevelFilter(level) { 
    this.currentFilter.level = level; 
    this.renderResults(); 
  },
  
  setStatusFilter(status) { 
    this.currentFilter.status = status; 
    this.renderResults(); 
  },
  
  updateSearch(term) { 
    this.searchTerm = term; 
    this.renderResults(); 
  },

  // Custom Costs Management
  loadCustomCosts() {
    try {
      const saved = localStorage.getItem('rollercoin_merge_custom_costs');
      this.customCosts = saved ? JSON.parse(saved) : {};
    } catch (e) {
      this.customCosts = {};
    }
  },

  saveCustomCosts() {
    try {
      localStorage.setItem('rollercoin_merge_custom_costs', JSON.stringify(this.customCosts));
    } catch (e) {
      console.error('Error saving custom costs:', e);
    }
  },

  getCustomCost(name, level) {
    const key = `${name}_${level}`;
    return this.customCosts[key] !== undefined ? this.customCosts[key] : null;
  },

  setCustomCost(name, level, value) {
    const key = `${name}_${level}`;
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || value === '') {
      delete this.customCosts[key];
    } else {
      this.customCosts[key] = numValue;
    }
    
    this.saveCustomCosts();
    
    // Recalcular merges com novo custo
    if (this.mergesData.length > 0) {
      const userData = State.getUserData();
      this.mergesData = this.mergesData.map(m => {
        if (m.name === name && m.currentLevel === level) {
          const customCost = this.getCustomCost(name, level);
          return {
            ...m,
            finalCost: customCost !== null ? customCost : m.partsPlusFee,
            isCustomCost: customCost !== null,
            powerRatio: customCost !== null ? (customCost / m.powerGain) : (m.partsPlusFee / m.powerGain),
            bonusRatio: customCost !== null ? (customCost / m.bonusGain) : (m.partsPlusFee / m.bonusGain)
          };
        }
        return m;
      });
      this.sortMerges();
      this.renderResults();
    }
  },

  exportarCSV() {
    if (this.mergesData.length === 0) {
      Utils.mostrarNotificacao('⚠️ Nenhum merge analisado!', 'warning');
      return;
    }

    let csv = 'Miner,Level,Miners,Fan,Wire,Hashboard,PartsCost,MergeFee,Parts+Fee,PowerGain,BonusGain,FinalCost,CustomCost,PowerRatio,BonusRatio,Possible\n';
    this.mergesData.forEach(m => {
      csv += `"${m.name}","${m.currentLevel}","${m.minerQty}/${m.minerNeeded}","${m.components[0].available}/${m.components[0].needed}","${m.components[1].available}/${m.components[1].needed}","${m.components[2].available}/${m.components[2].needed}",${m.partsCost.toFixed(2)},${m.mergeFee.toFixed(2)},${m.partsPlusFee.toFixed(2)},${m.powerGain.toFixed(2)},${m.bonusGain.toFixed(2)},${m.finalCost.toFixed(2)},${m.isCustomCost ? 'Yes' : 'No'},${m.powerRatio.toFixed(2)},${m.bonusRatio.toFixed(2)},${m.isPossible?'Y':'N'}\n`;
    });

    Utils.exportarCSV(csv, 'rollercoin_merge_analysis_' + new Date().toISOString().split('T')[0] + '.csv');
  }
};

window.UI_MergeAnalyzer = UI_MergeAnalyzer;
console.log('✅ UI_MergeAnalyzer loaded (sem MergeCalculator)');
