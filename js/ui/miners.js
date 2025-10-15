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
      
      <div style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="font-weight: bold; margin-bottom: 10px; text-align: center;">Estatísticas Gerais</p>
        <div class="summary-grid">
          <div><strong>Total de Miners:</strong> ${this.tableData.length}</div>
          <div><strong>Miners Únicas:</strong> ${Calculations.calcularMinersUnicas(impacts)}</div>
          <div><strong>Poder Total Atual:</strong> ${Utils.formatPower(poderTotalAtual * 1e9)}</div>
          <div><strong>Maior Impacto Individual:</strong> ${Utils.formatPower(impacts[0].impact * 1e9)}</div>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          <strong>⚠️ Importante:</strong> Os impactos individuais não podem ser somados porque os bônus de miners se afetam mutuamente.
        </p>
      </div>
      
      <div style="background: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0;">
        <h4>📋 Sobre Duplicatas (Mesmo Tipo de Miner)</h4>
        <p style="font-size: 13px;">Miners <strong>duplicatas</strong> são aquelas que você tem mais de uma unidade <strong>idêntica</strong> (mesmo modelo, não apenas mesmo nome).</p>
        <ul style="font-size: 13px; margin: 10px 0;">
          <li><strong style="color: #666;">⚪ Única:</strong> Apenas 1 desta miner. Remover causa perda de bônus.</li>
          <li><strong style="color: #2196F3;">🔷 Primeira:</strong> Primeira de várias iguais. Remover causa perda de bônus.</li>
          <li><strong style="color: #FF9800;">🔄 Duplicata:</strong> 2ª, 3ª... da mesma miner. Remover NÃO perde bônus.</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 15px;">
        <button onclick="UI_Miners.exportarCSV()">📊 Exportar CSV</button>
        <button onclick="UI_Miners.restaurarTodas()" style="background: #28a745;">🔄 Restaurar Todas</button>
        <button onclick="UI_Miners.limparFiltros()" style="background: #6c757d;">🔍 Limpar Filtros</button>
        <button onclick="UI_Miners.filtrarRapido('high')">🔴 Alto Impacto</button>
        <button onclick="UI_Miners.filtrarRapido('medium')">🟡 Médio Impacto</button>
        <button onclick="UI_Miners.filtrarRapido('low')">🟢 Baixo Impacto</button>
        <button onclick="UI_Miners.filtrarRapido('duplicates')">🔍 Duplicadas</button>
      </div>
      
      <div id="filtrosAtivos" style="margin-bottom: 10px; min-height: 20px;"></div>

      <table id="minersTable" style="position: relative;">
        <thead>
          <tr>
            <th onclick="UI_Miners.ordenar('ranking')" style="cursor: pointer;">
              Ranking ${this.getSortIcon('ranking')}
            </th>
            <th style="position: relative;">
              Nome ${this.getFilterIcon('name')}
            </th>
            <th style="position: relative;">
              Level ${this.getFilterIcon('level')}
            </th>
            <th style="position: relative;">
              Status ${this.getFilterIcon('statusText')}
            </th>
            <th style="position: relative;">
              Sala ${this.getFilterIcon('sala')}
            </th>
            <th onclick="UI_Miners.ordenar('basePower')" style="cursor: pointer;">
              Poder Base ${this.getSortIcon('basePower')}
            </th>
            <th onclick="UI_Miners.ordenar('minerBonusPercent')" style="cursor: pointer;">
              Bônus % ${this.getSortIcon('minerBonusPercent')}
            </th>
            <th onclick="UI_Miners.ordenar('rackBonus')" style="cursor: pointer;">
              Rack % ${this.getSortIcon('rackBonus')}
            </th>
            <th onclick="UI_Miners.ordenar('impact')" style="cursor: pointer;">
              Impacto Real ${this.getSortIcon('impact')}
            </th>
            <th onclick="UI_Miners.ordenar('perdaBase')" style="cursor: pointer;">
              Perda Base ${this.getSortIcon('perdaBase')}
            </th>
            <th onclick="UI_Miners.ordenar('perdaBonusTotal')" style="cursor: pointer;">
              Perda Bônus ${this.getSortIcon('perdaBonusTotal')}
            </th>
            <th onclick="UI_Miners.ordenar('percentualRelativo')" style="cursor: pointer;">
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
          <td><strong>${row.name}</strong>${row.minerCount > 1 ? ` <span style="color: orange;">🔢${row.minerCount}</span>` : ''}</td>
          <td>${row.level}</td>
          <td style="font-size: 20px;">${row.statusIcon}</td>
          <td><strong>Sala ${row.sala}</strong><br><small>${row.rackName}</small></td>
          <td>${Utils.formatPower(row.basePower * 1e9)}<br><small>${row.basePower.toFixed(3)} GH/s</small></td>
          <td>${(row.minerBonusPercent * 100).toFixed(2)}%${row.isDuplicate ? '<br><small style="color: #999;">(não aplicado)</small>' : ''}</td>
          <td>${(row.rackBonus * 100).toFixed(2)}%</td>
          <td><strong>${Utils.formatPower(row.impact * 1e9)}</strong><br><small>${row.impact.toFixed(3)} GH/s</small></td>
          <td>${Utils.formatPower(row.perdaBase * 1e9)}<br><small>Base perdida</small></td>
          <td>${Utils.formatPower(row.perdaBonusTotal * 1e9)}<br><small>Bônus perdido</small></td>
          <td><strong>${row.percentualRelativo.toFixed(1)}%</strong><br><small>vs maior</small></td>
          <td><button onclick="UI_Miners.simularRemocao(${row.minerIndex})" style="padding: 5px 10px; font-size: 12px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">🗑️ Simular</button></td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  },
  
  getSortIcon(column) {
    if (this.currentSort.column !== column) {
      return '<span style="color: #ccc; font-size: 10px;">▲▼</span>';
    }
    return this.currentSort.direction === 'asc' ? 
      '<span style="color: #007bff; font-size: 12px;">▲</span>' : 
      '<span style="color: #007bff; font-size: 12px;">▼</span>';
  },
  
  getFilterIcon(column) {
    const hasFilter = this.activeFilters[column] && this.activeFilters[column].length > 0;
    const color = hasFilter ? '#007bff' : '#999';
    return `<span onclick="UI_Miners.mostrarFiltro('${column}', event)" style="cursor: pointer; color: ${color}; margin-left: 5px; font-size: 14px;" title="Filtrar">🔽</span>`;
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
    dropdown.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      max-height: 400px;
      overflow-y: auto;
      min-width: 250px;
    `;
    
    const rect = event.target.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    
    const filtrosAtivos = this.activeFilters[column] || [];
    
    let html = '<div style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">';
    html += '<button onclick="UI_Miners.selecionarTodosFiltro(\'' + column + '\')" style="font-size: 11px; padding: 3px 8px; margin-right: 5px;">✓ Todos</button>';
    html += '<button onclick="UI_Miners.limparFiltroColuna(\'' + column + '\')" style="font-size: 11px; padding: 3px 8px;">✗ Limpar</button>';
    html += '</div>';
    
    html += `
      <div style="margin-bottom: 10px;">
        <input type="text" 
               id="filterSearch" 
               placeholder="🔍 Buscar..." 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 13px;"
               oninput="UI_Miners.filtrarOpcoes('${column}')">
      </div>
    `;
    
    html += '<div id="filterOptions" style="max-height: 250px; overflow-y: auto;">';
    
    valoresUnicos.forEach(valor => {
      const checked = filtrosAtivos.includes(String(valor));
      
      html += `
        <div class="filter-option" data-value="${valor.toLowerCase()}" style="margin: 5px 0;">
          <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px;">
            <input type="checkbox" 
                   value="${valor}" 
                   ${checked ? 'checked' : ''}
                   onchange="UI_Miners.toggleFiltroValor('${column}', '${valor}')"
                   style="margin-right: 8px;">
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
    
    let html = '<div style="background: #e3f2fd; padding: 10px; border-radius: 5px; font-size: 12px;"><strong>Filtros ativos:</strong> ';
    
    filtros.forEach(column => {
      const valores = this.activeFilters[column];
      html += `<span style="background: white; padding: 3px 8px; margin: 2px; border-radius: 3px; display: inline-block;">`;
      html += `<strong>${column}:</strong> ${valores.length} selecionado(s) `;
      html += `<span onclick="UI_Miners.limparFiltroColuna('${column}')" style="cursor: pointer; color: red; font-weight: bold;">✗</span>`;
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
    const novoPoderTotal = impactData.novoPoderTotal;
    const percentualPerda = (impactData.impact / poderAtual) * 100;
    
    const minerCount = impacts.filter(other => other.minerId === impactData.minerId).length;
    const isUnique = minerCount === 1;
    const primeiraIndex = impacts.findIndex(m => m.minerId === impactData.minerId);
    const isFirst = primeiraIndex === impacts.indexOf(impactData);
    const isDuplicate = !isFirst && minerCount > 1;
    
    let statusText = '';
    let bonusInfo = '';
    
    if (isUnique) {
      statusText = '<span style="color: #666; font-weight: bold;">⚪ Única</span>';
      bonusInfo = '<div style="background: #fff3e0; padding: 10px; border-radius: 5px; border-left: 4px solid #FF9800;"><p style="color: #e65100; font-size: 13px; margin: 0;">⚠️ Esta é a <strong>única</strong> miner deste tipo. Removê-la <strong>causará perda</strong> de bônus de coleção!</p></div>';
    } else if (isFirst) {
      statusText = '<span style="color: #2196F3; font-weight: bold;">🔷 Primeira do tipo</span>';
      bonusInfo = '<div style="background: #fff3e0; padding: 10px; border-radius: 5px; border-left: 4px solid #FF9800;"><p style="color: #e65100; font-size: 13px; margin: 0;">⚠️ Esta é a <strong>primeira de ' + minerCount + '</strong> miners iguais. Removê-la <strong>causará perda</strong> de bônus de coleção!</p></div>';
    } else {
      statusText = '<span style="color: #FF9800; font-weight: bold;">🔄 Duplicata</span>';
      bonusInfo = '<div style="background: #e8f5e8; padding: 10px; border-radius: 5px; border-left: 4px solid #4CAF50;"><p style="color: #2e7d32; font-size: 13px; margin: 0;">✅ Esta é uma duplicata (' + minerCount + ' unidades total). Removê-la <strong>NÃO causará</strong> perda de bônus de coleção porque você tem outras miners iguais!</p></div>';
    }
    
    const modalHTML = `
      <div id="simulationModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
          <h3 style="margin-top: 0; color: #dc3545;">🗑️ Simulação de Remoção</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4>${minerParaRemover.name} (${minerParaRemover.level_label})</h4>
            <p><strong>Status:</strong> ${statusText}</p>
            <p><strong>Poder Base:</strong> ${Utils.formatPower(minerParaRemover.power * 1e9)}</p>
            <p><strong>Bônus Total:</strong> ${((minerParaRemover.bonus_percent/10000) * 100).toFixed(2)}%</p>
            ${isDuplicate ? 
              '<p><strong>Bônus Aplicado:</strong> <span style="color: #999;">0% (duplicata não perde)</span></p>' :
              '<p><strong>Bônus Aplicado:</strong> <span style="color: #dc3545;">' + ((minerParaRemover.bonus_percent/10000) * 100).toFixed(2) + '% (será perdido!)</span></p>'
            }
          </div>
          ${bonusInfo}
          <hr>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="text-align: center;">
              <h4 style="color: #007bff;">Poder Atual</h4>
              <p style="font-size: 1.2em; font-weight: bold;">${Utils.formatPower(poderAtual * 1e9)}</p>
            </div>
            <div style="text-align: center;">
              <h4 style="color: #dc3545;">Após Remoção</h4>
              <p style="font-size: 1.2em; font-weight: bold;">${Utils.formatPower(novoPoderTotal * 1e9)}</p>
            </div>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0;">📉 Impacto da Remoção</h4>
            <p><strong>Perda Total:</strong> <span style="color: #dc3545; font-weight: bold;">${Utils.formatPower(impactData.impact * 1e9)}</span></p>
            <p><strong>Percentual de Perda:</strong> <span style="color: #dc3545; font-weight: bold;">${percentualPerda.toFixed(2)}%</span></p>
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="UI_Miners.fecharModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Fechar</button>
            <button onclick="UI_Miners.confirmarRemocao(${minerIndex})" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">⚠️ Confirmar Remoção</button>
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