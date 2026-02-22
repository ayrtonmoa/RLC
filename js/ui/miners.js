// js/ui/miners.js - COM BUSCA NOS FILTROS E ORDENAÇÃO

const UI_Miners = {
  currentFilter: 'all',
  tableData: [],
  currentSort: { column: null, direction: 'asc' },
  activeFilters: {},
  
  mostrar(user) {
    if (!user.powerData || !user.roomData) {
      document.getElementById('miners').innerHTML = '<p class="error">Dados insuficientes para análise de impacto.</p>';
      return;
    }

    const impacts = Calculations.calcularImpactos(user);
    this.prepararDados(impacts, user);
    this.renderizar();
  },
  
  prepararDados(impacts, user) {
    const minerCountMap = {};
    impacts.forEach(m => {
      if (!minerCountMap[m.minerId]) {
        minerCountMap[m.minerId] = 0;
      }
      minerCountMap[m.minerId]++;
    });

    const primeiraDoTipo = new Set();
    const poderTotalAtual = user.powerData.current_power;
    const maiorImpacto = impacts[0].impact;

    this.tableData = impacts.map((m, index) => {
      const percentualRelativo = (m.impact / maiorImpacto) * 100;
      const minerCount = minerCountMap[m.minerId];
      const isUnique = minerCount === 1;
      const isFirst = !primeiraDoTipo.has(m.minerId) && minerCount > 1;
      const isDuplicate = primeiraDoTipo.has(m.minerId);
      
      if (!primeiraDoTipo.has(m.minerId)) {
        primeiraDoTipo.add(m.minerId);
      }

      let statusIcon = '';
      let statusText = '';
      
      if (isUnique) {
        statusIcon = '⚪';
        statusText = 'Única';
      } else if (isFirst) {
        statusIcon = '🔷';
        statusText = 'Primeira';
      } else if (isDuplicate) {
        statusIcon = '🔄';
        statusText = 'Duplicata';
      }

      const rack = user.roomData.racks.find(r => r._id === m.rackId);
      const sala = rack ? (rack.placement?.room_level || 0) + 1 : 0;
      const rackName = rack?.name || 'N/A';

      const impactClass = percentualRelativo > 80 ? 'high-impact' : 
                          percentualRelativo > 40 ? 'medium-impact' : 'low-impact';

      return {
        ranking: index + 1,
        name: m.name,
        level: m.level,
        statusIcon: statusIcon,
        statusText: statusText,
        sala: sala,
        rackName: rackName,
        basePower: m.basePower,
        minerBonusPercent: m.minerBonusPercent,
        rackBonus: m.rackBonus,
        impact: m.impact,
        perdaBase: m.perdaBase,
        perdaBonusTotal: m.perdaBonusBase + m.perdaBonusPropia + m.perdaRackBonus,
        percentualRelativo: percentualRelativo,
        minerIndex: m.minerIndex,
        minerCount: minerCount,
        isDuplicate: isDuplicate,
        impactClass: impactClass,
        impactType: percentualRelativo > 80 ? 'high' : percentualRelativo > 40 ? 'medium' : 'low',
        originalData: m
      };
    });
  },
  
  renderizar() {
    const userData = State.getUserData();
    const poderTotalAtual = userData.powerData.current_power;
    const impacts = Calculations.calcularImpactos(userData);
    
    const div = document.getElementById('miners');
    
    let html = `
      <h2>Impact Analyzer - Detalhado</h2>
      
      <div class="stats-box">
        <p class="stats-title">Estatísticas Gerais</p>
        <div class="summary-grid">
          <div><strong>Total de Miners:</strong> ${this.tableData.length}</div>
          <div><strong>Miners Únicas:</strong> ${Calculations.calcularMinersUnicas(impacts)}</div>
          <div><strong>Poder Total Atual:</strong> ${Utils.formatPower(poderTotalAtual * 1e9)}</div>
          <div><strong>Maior Impacto Individual:</strong> ${Utils.formatPower(impacts[0].impact * 1e9)}</div>
        </div>
        <p class="stats-note">
          <strong>⚠️ Importante:</strong> Os impactos individuais não podem ser somados porque os bônus de miners se afetam mutuamente.
        </p>
      </div>
      
      <div class="info-box-orange">
        <h4>📋 Sobre Duplicatas (Mesmo Tipo de Miner)</h4>
        <p>Miners <strong>duplicatas</strong> são aquelas que você tem mais de uma unidade <strong>idêntica</strong> (mesmo modelo, não apenas mesmo nome).</p>
        <ul>
          <li><strong class="status-unique">⚪ Única:</strong> Apenas 1 desta miner. Remover causa perda de bônus.</li>
          <li><strong class="status-first">🔷 Primeira:</strong> Primeira de várias iguais. Remover causa perda de bônus.</li>
          <li><strong class="status-duplicate">🔄 Duplicata:</strong> 2ª, 3ª... da mesma miner. Remover NÃO perde bônus.</li>
        </ul>
      </div>
      
<div class="action-buttons">
  <button onclick="UI_Miners.exportarCSV()" class="btn-export">📊 Exportar CSV</button>
  <button onclick="UI_Miners.restaurarTodas()" class="btn-restore">🔄 Restaurar Todas</button>
  <button onclick="UI_Miners.limparFiltros()" class="btn-clear">🔍 Limpar Filtros</button>
  <button onclick="UI_Miners.filtrarRapido('duplicates')" class="btn-filter-dup">🔍 Duplicadas</button>
</div>
      
      <div id="filtrosAtivos"></div>

      <table id="minersTable" class="miners-table">
        <thead>
          <tr>
            <th onclick="UI_Miners.ordenar('ranking')">
              Ranking ${this.getSortIcon('ranking')}
            </th>
            <th>Nome ${this.getFilterIcon('name')}</th>
            <th>Level ${this.getFilterIcon('level')}</th>
            <th>Status ${this.getFilterIcon('statusText')}</th>
            <th>Sala ${this.getFilterIcon('sala')}</th>
            <th onclick="UI_Miners.ordenar('basePower')">
              Poder Base ${this.getSortIcon('basePower')}
            </th>
            <th onclick="UI_Miners.ordenar('minerBonusPercent')">
              Bônus % ${this.getSortIcon('minerBonusPercent')}
            </th>
            <th onclick="UI_Miners.ordenar('rackBonus')">
              Rack % ${this.getSortIcon('rackBonus')}
            </th>
            <th onclick="UI_Miners.ordenar('impact')">
              Impacto Real ${this.getSortIcon('impact')}
            </th>
            <th onclick="UI_Miners.ordenar('perdaBase')">
              Perda Base ${this.getSortIcon('perdaBase')}
            </th>
            <th onclick="UI_Miners.ordenar('perdaBonusTotal')">
              Perda Bônus ${this.getSortIcon('perdaBonusTotal')}
            </th>
            <th onclick="UI_Miners.ordenar('percentualRelativo')">
              % Relativo ${this.getSortIcon('percentualRelativo')}
            </th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody id="minersTableBody"></tbody>
      </table>
    `;
    
    div.innerHTML = html;
    this.renderizarLinhas();
    this.atualizarFiltrosAtivos();
  },
  
  renderizarLinhas() {
    let dados = [...this.tableData];
    
    Object.keys(this.activeFilters).forEach(column => {
      const valores = this.activeFilters[column];
      if (valores && valores.length > 0) {
        dados = dados.filter(row => valores.includes(String(row[column])));
      }
    });
    
    if (this.currentSort.column) {
      dados.sort((a, b) => {
        let valA = a[this.currentSort.column];
        let valB = b[this.currentSort.column];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.currentSort.direction === 'asc' ? valA - valB : valB - valA;
        }
        
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        
        if (this.currentSort.direction === 'asc') {
          return valA < valB ? -1 : valA > valB ? 1 : 0;
        } else {
          return valA > valB ? -1 : valA < valB ? 1 : 0;
        }
      });
    }
    
    const tbody = document.getElementById('minersTableBody');
    if (!tbody) return;
    
    let html = '';
    
    dados.forEach((row) => {
      html += `
        <tr class="${row.impactClass}" data-type="${row.impactType}" data-duplicate="${row.isDuplicate}">
          <td><strong>#${row.ranking}</strong></td>
          <td><strong>${row.name}</strong>${row.minerCount > 1 ? ` <span class="miner-count-badge">🔢${row.minerCount}</span>` : ''}</td>
          <td>${row.level}</td>
          <td class="status-icon">${row.statusIcon}</td>
          <td><strong>Sala ${row.sala}</strong><br><small>${row.rackName}</small></td>
          <td>${Utils.formatPower(row.basePower * 1e9)}<br><small>${row.basePower.toFixed(3)} GH/s</small></td>
          <td>${(row.minerBonusPercent * 100).toFixed(2)}%${row.isDuplicate ? '<br><small class="bonus-not-applied">(não aplicado)</small>' : ''}</td>
          <td>${(row.rackBonus * 100).toFixed(2)}%</td>
          <td><strong>${Utils.formatPower(row.impact * 1e9)}</strong><br><small>${row.impact.toFixed(3)} GH/s</small></td>
          <td>${Utils.formatPower(row.perdaBase * 1e9)}<br><small>Base perdida</small></td>
          <td>${Utils.formatPower(row.perdaBonusTotal * 1e9)}<br><small>Bônus perdido</small></td>
          <td><strong>${row.percentualRelativo.toFixed(1)}%</strong><br><small>vs maior</small></td>
          <td><button onclick="UI_Miners.simularRemocao(${row.minerIndex})" class="btn-simulate">🗑️ Simular</button></td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  },
  
  getSortIcon(column) {
    if (this.currentSort.column !== column) {
      return '<span class="sort-icon">▲▼</span>';
    }
    return this.currentSort.direction === 'asc' ? 
      '<span class="sort-icon-active">▲</span>' : 
      '<span class="sort-icon-active">▼</span>';
  },
  
  getFilterIcon(column) {
    const hasFilter = this.activeFilters[column] && this.activeFilters[column].length > 0;
    const iconClass = hasFilter ? 'filter-icon-active' : 'filter-icon-inactive';
    return `<span onclick="UI_Miners.mostrarFiltro('${column}', event)" class="filter-icon ${iconClass}" title="Filtrar">🔽</span>`;
  },
  
  ordenar(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = 'asc';
    }
    this.renderizarLinhas();
    this.renderizar();
  },
  
  mostrarFiltro(column, event) {
    event.stopPropagation();
    
    const existente = document.getElementById('filterDropdown');
    if (existente) existente.remove();
    
    const valoresUnicos = [...new Set(this.tableData.map(row => String(row[column])))].sort();
    
    const dropdown = document.createElement('div');
    dropdown.id = 'filterDropdown';
    dropdown.className = 'filter-dropdown';
    
    const rect = event.target.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    
    const filtrosAtivos = this.activeFilters[column] || [];
    
    let html = '<div class="filter-header">';
    html += '<button onclick="UI_Miners.selecionarTodosFiltro(\'' + column + '\')" class="filter-btn-all">✓ Todos</button>';
    html += '<button onclick="UI_Miners.limparFiltroColuna(\'' + column + '\')" class="filter-btn-clear-col">✗ Limpar</button>';
    html += '</div>';
    
    html += `<div class="filter-search-box">
      <input type="text" 
             id="filterSearch" 
             placeholder="🔍 Buscar..." 
             class="filter-search-input"
             oninput="UI_Miners.filtrarOpcoes('${column}')">
    </div>`;
    
    html += '<div id="filterOptions" class="filter-options">';
    
    valoresUnicos.forEach(valor => {
      const checked = filtrosAtivos.includes(String(valor));
      
      html += `
        <div class="filter-option" data-value="${valor.toLowerCase()}">
          <label>
            <input type="checkbox" 
                   value="${valor}" 
                   ${checked ? 'checked' : ''}
                   onchange="UI_Miners.toggleFiltroValor('${column}', '${valor}')">
            <span>${valor}</span>
          </label>
        </div>
      `;
    });
    
    html += '</div>';
    
    dropdown.innerHTML = html;
    document.body.appendChild(dropdown);
    
    setTimeout(() => {
      const searchInput = document.getElementById('filterSearch');
      if (searchInput) searchInput.focus();
    }, 100);
    
    setTimeout(() => {
      document.addEventListener('click', function fecharDropdown(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener('click', fecharDropdown);
        }
      });
    }, 100);
  },
  
  filtrarOpcoes(column) {
    const searchTerm = document.getElementById('filterSearch').value.toLowerCase();
    const options = document.querySelectorAll('.filter-option');
    
    options.forEach(option => {
      const valor = option.getAttribute('data-value');
      if (valor.includes(searchTerm)) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });
  },
  
  toggleFiltroValor(column, valor) {
    if (!this.activeFilters[column]) {
      this.activeFilters[column] = [];
    }
    
    const index = this.activeFilters[column].indexOf(valor);
    
    if (index > -1) {
      this.activeFilters[column].splice(index, 1);
    } else {
      this.activeFilters[column].push(valor);
    }
    
    this.renderizarLinhas();
    this.atualizarFiltrosAtivos();
  },
  
  selecionarTodosFiltro(column) {
    this.activeFilters[column] = [];
    this.renderizarLinhas();
    this.atualizarFiltrosAtivos();
    
    const dropdown = document.getElementById('filterDropdown');
    if (dropdown) dropdown.remove();
  },
  
  limparFiltroColuna(column) {
    delete this.activeFilters[column];
    this.renderizarLinhas();
    this.atualizarFiltrosAtivos();
    this.renderizar();
  },
  
  limparFiltros() {
    this.activeFilters = {};
    this.currentFilter = 'all';
    this.renderizarLinhas();
    this.atualizarFiltrosAtivos();
    this.renderizar();
  },
  
  filtrarRapido(tipo) {
    this.limparFiltros();
    
    if (tipo === 'duplicates') {
      this.activeFilters['statusText'] = ['Duplicata'];
    } else {
      const mapping = {
        'high': ['high-impact'],
        'medium': ['medium-impact'],
        'low': ['low-impact']
      };
      
      const dadosFiltrados = this.tableData.filter(row => row.impactClass === mapping[tipo][0]);
      const nomes = [...new Set(dadosFiltrados.map(row => row.name))];
      this.activeFilters['name'] = nomes;
    }
    
    this.renderizarLinhas();
    this.atualizarFiltrosAtivos();
  },
  
  atualizarFiltrosAtivos() {
    const div = document.getElementById('filtrosAtivos');
    if (!div) return;
    
    const filtros = Object.keys(this.activeFilters).filter(k => this.activeFilters[k].length > 0);
    
    if (filtros.length === 0) {
      div.innerHTML = '';
      return;
    }
    
    let html = '<div class="filters-active"><strong>Filtros ativos:</strong> ';
    
    filtros.forEach(column => {
      const valores = this.activeFilters[column];
      html += `<span class="filter-tag">`;
      html += `<strong>${column}:</strong> ${valores.length} selecionado(s) `;
      html += `<span onclick="UI_Miners.limparFiltroColuna('${column}')" class="filter-remove">✗</span>`;
      html += `</span> `;
    });
    
    html += '</div>';
    div.innerHTML = html;
  },
  
  simularRemocao(minerIndex) {
    const userData = State.getUserData();
    if (!userData) return;
    
    const allMiners = userData.roomData.miners;
    const minerParaRemover = allMiners[minerIndex];
    
    if (!minerParaRemover) return;
    
    const impacts = Calculations.calcularImpactos(userData);
    const impactData = impacts.find(i => i.minerIndex === minerIndex);
    
    const poderAtual = userData.powerData.current_power;
    const novoPoderTotal = poderAtual - impactData.impact;
    const percentualPerda = (impactData.impact / poderAtual) * 100;
    
    const minerCount = impacts.filter(other => other.minerId === impactData.minerId).length;
    const isUnique = minerCount === 1;
    const primeiraIndex = impacts.findIndex(m => m.minerId === impactData.minerId);
    const isFirst = primeiraIndex === impacts.indexOf(impactData);
    const isDuplicate = !isFirst && minerCount > 1;
    
    let statusText = '';
    let bonusInfo = '';
    
    if (isUnique) {
      statusText = '<span class="status-unique">⚪ Única</span>';
      bonusInfo = '<div class="info-box-orange"><p class="value-danger">⚠️ Esta é a <strong>única</strong> miner deste tipo. Removê-la <strong>causará perda</strong> de bônus de coleção!</p></div>';
    } else if (isFirst) {
      statusText = '<span class="status-first">🔷 Primeira do tipo</span>';
      bonusInfo = '<div class="info-box-orange"><p class="value-danger">⚠️ Esta é a <strong>primeira de ' + minerCount + '</strong> miners iguais. Removê-la <strong>causará perda</strong> de bônus de coleção!</p></div>';
    } else {
      statusText = '<span class="status-duplicate">🔄 Duplicata</span>';
      bonusInfo = '<div class="info-box-green"><p class="value-success">✅ Esta é uma duplicata (' + minerCount + ' unidades total). Removê-la <strong>NÃO causará</strong> perda de bônus de coleção porque você tem outras miners iguais!</p></div>';
    }
    
    const modalHTML = `
      <div id="simulationModal" class="modal-overlay">
        <div class="modal-content">
          <h3 class="modal-title">🗑️ Simulação de Remoção</h3>
          <div class="modal-info-box">
            <h4>${minerParaRemover.name} (${minerParaRemover.level_label})</h4>
            <p><strong>Status:</strong> ${statusText}</p>
            <p><strong>Poder Base:</strong> ${Utils.formatPower(minerParaRemover.power * 1e9)}</p>
            <p><strong>Bônus Total:</strong> ${((minerParaRemover.bonus_percent/10000) * 100).toFixed(2)}%</p>
            ${isDuplicate ? 
              '<p><strong>Bônus Aplicado:</strong> <span class="value-muted">0% (duplicata não perde)</span></p>' :
              '<p><strong>Bônus Aplicado:</strong> <span class="value-danger">' + ((minerParaRemover.bonus_percent/10000) * 100).toFixed(2) + '% (será perdido!)</span></p>'
            }
          </div>
          ${bonusInfo}
          <hr>
          <div class="modal-grid">
            <div class="modal-grid-item">
              <h4 class="modal-power-current">Poder Atual</h4>
              <p class="modal-power-value">${Utils.formatPower(poderAtual * 1e9)}</p>
            </div>
            <div class="modal-grid-item">
              <h4 class="modal-power-after">Após Remoção</h4>
              <p class="modal-power-value">${Utils.formatPower(novoPoderTotal * 1e9)}</p>
            </div>
          </div>
          <div class="modal-impact-box">
            <h4>📉 Impacto da Remoção</h4>
            <p><strong>Perda Total:</strong> <span class="value-danger">${Utils.formatPower(impactData.impact * 1e9)}</span></p>
            <p><strong>Percentual de Perda:</strong> <span class="value-danger">${percentualPerda.toFixed(2)}%</span></p>
          </div>
          <div class="modal-actions">
            <button onclick="UI_Miners.fecharModal()" class="modal-btn-close">Fechar</button>
            <button onclick="UI_Miners.confirmarRemocao(${minerIndex})" class="modal-btn-confirm">⚠️ Confirmar Remoção</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },
  
  fecharModal() {
    const modal = document.getElementById('simulationModal');
    if (modal) modal.remove();
  },
  
  confirmarRemocao(minerIndex) {
    const userData = State.getUserData();
    if (!userData) return;
    
    const minerOriginal = userData.roomData.miners[minerIndex];
    
    if (minerOriginal) {
      State.addMinerRemovida(minerOriginal);
      userData.roomData.miners.splice(minerIndex, 1);
      
      Calculations.recalcularPoderTotal(userData);
      
      UI_Resumo.mostrar(userData);
      UI_Miners.mostrar(userData);
      UI_Racks.mostrar(userData);
      
      this.fecharModal();
      Utils.mostrarNotificacao('✅ Miner "' + minerOriginal.name + '" removida temporariamente. Use "Restaurar Todas" para desfazer.', 'success');
      
      UI_Tabs.switchTo('resumo');
    }
  },
  
  restaurarTodas() {
    const userData = State.getUserData();
    if (!userData) return;
    
    if (State.getMinersRemovidas().length === 0) {
      Utils.mostrarNotificacao('⚠️ Nenhuma miner foi removida temporariamente.', 'warning');
      return;
    }
    
    const quantidade = State.restaurarMiners();
    
    Calculations.recalcularPoderOriginal(userData);
    
    UI_Resumo.mostrar(userData);
    UI_Miners.mostrar(userData);
    UI_Racks.mostrar(userData);
    
    Utils.mostrarNotificacao('🔄 ' + quantidade + ' miner(s) restaurada(s) com sucesso!', 'success');
  },
  
  exportarCSV() {
    const userData = State.getUserData();
    if (!userData) return;
    
    const impacts = Calculations.calcularImpactos(userData);
    
    const minerCountMap = {};
    impacts.forEach(m => {
      if (!minerCountMap[m.minerId]) {
        minerCountMap[m.minerId] = 0;
      }
      minerCountMap[m.minerId]++;
    });
    
    const primeiraDoTipo = new Set();
    
    let csv = 'Ranking,Nome,Level,Miner ID,Status,Qtd Total,Poder Base (H/s),Bonus Miner (%),Bonus Rack (%),Impacto Real (H/s),Percentual Total (%)\n';
    
    impacts.forEach((m, index) => {
      const minerCount = minerCountMap[m.minerId];
      const isUnique = minerCount === 1;
      const isFirst = !primeiraDoTipo.has(m.minerId);
      const isDuplicate = primeiraDoTipo.has(m.minerId);
      
      if (!primeiraDoTipo.has(m.minerId)) {
        primeiraDoTipo.add(m.minerId);
      }
      
      let status = '';
      if (isUnique) {
        status = 'Única';
      } else if (isFirst) {
        status = 'Primeira';
      } else {
        status = 'Duplicata';
      }
      
      csv += `${index + 1},"${m.name}","${m.level}","${m.minerId}","${status}",${minerCount},${(m.basePower * 1e9)},${(m.minerBonusPercent * 100).toFixed(2)},${(m.rackBonus * 100).toFixed(2)},${(m.impact * 1e9)},${m.impactPercent.toFixed(2)}\n`;
    });
    
    Utils.exportarCSV(csv, 'rollercoin_impact_' + userData.name + '_' + new Date().toISOString().split('T')[0] + '.csv');
  }
};

window.UI_Miners = UI_Miners;
console.log('✅ UI_Miners loaded');