// js/ui/mergeAnalyzer.js - VERSÃO CORRIGIDA COM INSTRUÇÕES MELHORADAS

const UI_MergeAnalyzer = {
  merges: [],
  prices: null,
  currentSort: { column: 'roi', direction: 'desc' },
  
mostrar() {
  // ✅ ADICIONAR VERIFICAÇÃO
  if (typeof MergePrices === 'undefined') {
    const div = document.getElementById('mergeanalyzer');
    div.innerHTML = '<p class="error">⚠️ Erro ao carregar módulos. Recarregue a página.</p>';
    console.error('MergePrices não carregado!');
    return;
  }
    this.prices = MergePrices.load();
    
    const div = document.getElementById('mergeanalyzer');
    div.innerHTML = `
      <h2>💎 Merge Analyzer</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h4>💡 Como Usar - Guia Rápido</h4>
        <ol style="font-size: 14px; line-height: 1.8;">
          <li><strong>PASSO 1:</strong> Copie os preços das Parts (opcional, mas recomendado)</li>
          <li><strong>PASSO 2:</strong> Copie a lista de Merges disponíveis</li>
          <li><strong>PASSO 3:</strong> Cole os dados nos campos abaixo e analise!</li>
        </ol>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div class="summary-item">
          <h4>💰 PASSO 1: Preços das Peças (Opcional)</h4>
          
          <!-- INSTRUÇÕES DETALHADAS PARA PARTS -->
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin-bottom: 15px; font-size: 12px;">
            <strong style="color: #1976D2;">📋 Como copiar os preços das Parts:</strong>
            <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
              <li>Acesse: <a href="https://rollercoin.com/marketplace/buy" target="_blank" style="font-weight: bold; color: #007bff;">Marketplace 🔗</a></li>
              <li><strong>Marque APENAS "Parts"</strong> (desmarque Miners, Racks, etc)</li>
              <li><strong>Mude de 12 para 24 resultados</strong> no final da página</li>
              <li>Pressione <kbd>Ctrl+A</kbd> para selecionar tudo</li>
              <li>Pressione <kbd>Ctrl+C</kbd> para copiar</li>
              <li>Cole abaixo e clique "Atualizar Preços"</li>
            </ol>
            <p style="margin: 5px 0 0 0; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 11px;">
              ⚠️ <strong>Importante:</strong> Copie a página inteira (Ctrl+A)!
            </p>
          </div>
          
          <textarea id="pricesText" rows="6" placeholder="Cole aqui os dados da página Parts..." style="width: 100%; padding: 10px; font-size: 12px;"></textarea>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
            <button onclick="UI_MergeAnalyzer.atualizarPrecos()" style="padding: 12px; font-size: 13px;">💾 Atualizar Preços</button>
            <button onclick="UI_MergeAnalyzer.resetarPrecos()" style="padding: 12px; background: #6c757d; font-size: 13px;">🔄 Resetar</button>
          </div>
        </div>

        <div class="summary-item">
          <h4>🔄 PASSO 2: Lista de Merges</h4>
          
          <!-- INSTRUÇÕES DETALHADAS PARA MERGES -->
          <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #9C27B0; margin-bottom: 15px; font-size: 12px;">
            <strong style="color: #7B1FA2;">📋 Como copiar a lista de Merges:</strong>
            <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
              <li>No marketplace, vá para a <strong>aba "Merges"</strong></li>
              <li><strong>Clique em "Load more"</strong> até carregar tudo</li>
              <li style="background: #ffebee; padding: 5px; border-radius: 3px; margin: 5px 0;">
                <strong>⚠️ ATENÇÃO:</strong> Ignore merges com <strong>0/2 miners</strong>!<br>
                Copie APENAS merges com <strong>1/2</strong> ou <strong>2/2</strong>
              </li>
              <li>Pressione <kbd>Ctrl+A</kbd> para selecionar tudo</li>
              <li>Pressione <kbd>Ctrl+C</kbd> para copiar</li>
              <li>Cole abaixo e clique "Analisar Merges"</li>
            </ol>
            <p style="margin: 5px 0 0 0; padding: 8px; background: #d1ecf1; border-radius: 4px; font-size: 11px;">
              💡 <strong>Dica:</strong> O sistema identifica automaticamente quais merges você pode fazer!
            </p>
          </div>
          
          <textarea id="mergeText" rows="6" placeholder="Cole aqui os dados da aba Merges (somente 1/2 ou 2/2)..." style="width: 100%; padding: 10px; font-size: 12px;"></textarea>
          <button onclick="UI_MergeAnalyzer.analisar()" style="width: 100%; margin-top: 10px; padding: 12px; font-size: 16px; font-weight: bold;">🔍 Analisar Merges</button>
        </div>
      </div>

      <div id="pricesSummary" style="margin-bottom: 20px;"></div>
      <div id="resultadoMerge"></div>
    `;
    
    this.mostrarPrecos();
  },
  
  mostrarPrecos() {
    const div = document.getElementById('pricesSummary');
    if (!div) return;
    
    const levelNames = {
      common: 'Common',
      uncommon: 'Uncommon', 
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary'
    };
    
    let html = '<div class="summary-item" style="background: #f8f9fa;">';
    html += '<h4>💰 Preços Atuais das Peças</h4>';
    html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; font-size: 12px;">';
    
    Object.keys(this.prices).forEach(level => {
      html += `<div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">`;
      html += `<strong>${levelNames[level]}</strong><br>`;
      html += `Fan: ${this.prices[level].part1.toFixed(6)} RLT<br>`;
      html += `Wire: ${this.prices[level].part2.toFixed(6)} RLT<br>`;
      html += `Hash: ${this.prices[level].part3.toFixed(6)} RLT`;
      html += `</div>`;
    });
    
    html += '</div>';
    html += '<p style="font-size: 11px; color: #666; margin-top: 10px; text-align: center;">💡 Atualize os preços colando dados da página Parts acima</p>';
    html += '</div>';
    
    div.innerHTML = html;
  },
  
  atualizarPrecos() {
    const text = document.getElementById('pricesText').value.trim();
    
    if (!text) {
      Utils.mostrarNotificacao('⚠️ Cole os dados da página Parts primeiro!', 'warning');
      return;
    }
    
    try {
      const newPrices = MergePrices.parseFromText(text);
      this.prices = newPrices;
      MergePrices.save(newPrices);
      
      this.mostrarPrecos();
      Utils.mostrarNotificacao('✅ Preços atualizados com sucesso!', 'success');
      
      // Recalcular merges se já tiver analisado
      if (this.merges.length > 0) {
        this.renderResultado();
      }
    } catch (error) {
      Utils.mostrarNotificacao('❌ Erro ao processar preços: ' + error.message, 'error');
      console.error(error);
    }
  },
  
  resetarPrecos() {
    this.prices = MergePrices.reset();
    this.mostrarPrecos();
    Utils.mostrarNotificacao('🔄 Preços resetados para padrão!', 'info');
    
    if (this.merges.length > 0) {
      this.renderResultado();
    }
  },
  
  analisar() {
    const text = document.getElementById('mergeText').value.trim();
    
    if (!text) {
      Utils.mostrarNotificacao('⚠️ Cole os dados da página Merge primeiro!', 'warning');
      return;
    }
    
    try {
      this.merges = MergeParser.parse(text);
      
      if (this.merges.length === 0) {
        Utils.mostrarNotificacao('⚠️ Nenhum merge encontrado. Verifique se copiou da página correta.', 'warning');
        return;
      }
      
      // Calcular custos e ROI
      this.merges.forEach(merge => {
        this.calcularCustoMerge(merge);
      });
      
      this.renderResultado();
      Utils.mostrarNotificacao(`✅ ${this.merges.length} merges analisados com sucesso!`, 'success');
      
    } catch (error) {
      Utils.mostrarNotificacao('❌ Erro ao processar: ' + error.message, 'error');
      console.error(error);
    }
  },
  
  calcularCustoMerge(merge) {
    // Determinar nível das peças necessárias (nível ANTES do merge)
    const levelMap = {
      'Uncommon': 'common',
      'Rare': 'uncommon',
      'Epic': 'rare',
      'Legendary': 'epic'
    };
    
    const partsLevel = levelMap[merge.currentLevel];
    
    if (!partsLevel) {
      merge.custoTotal = 0;
      merge.roi = 0;
      merge.pecasFaltando = [];
      return;
    }
    
    const prices = this.prices[partsLevel];
    const mergeFee = MergePrices.getMergeFee(merge.currentLevel);
    
    let custoTotal = mergeFee;
    const pecasFaltando = [];
    
    // Calcular custo das peças
    merge.components.forEach((comp, index) => {
      const faltam = Math.max(0, comp.needed - comp.available);
      
      if (faltam > 0) {
        const partNames = ['Fan', 'Wire', 'Hashboard'];
        const partKeys = ['part1', 'part2', 'part3'];
        const preco = prices[partKeys[index]];
        const custo = faltam * preco;
        
        custoTotal += custo;
        
        pecasFaltando.push({
          name: partNames[index],
          level: partsLevel,
          quantity: faltam,
          priceUnit: preco,
          priceTotal: custo
        });
      }
    });
    
    // Calcular ganho de poder
    const ganhoTh = merge.powerAfter - merge.powerBefore;
    const ganhoGh = ganhoTh * 1000;
    
    // ROI = Ganho de Poder (GH/s) / Custo (RLT)
    const roi = custoTotal > 0 ? ganhoGh / custoTotal : 0;
    
    merge.custoTotal = custoTotal;
    merge.custoMergeFee = mergeFee;
    merge.custoPartes = custoTotal - mergeFee;
    merge.ganhoTh = ganhoTh;
    merge.ganhoGh = ganhoGh;
    merge.roi = roi;
    merge.pecasFaltando = pecasFaltando;
    merge.partsLevel = partsLevel;
  },
  
  renderResultado() {
    const div = document.getElementById('resultadoMerge');
    
    // Filtrar e ordenar
    let merges = [...this.merges];
    
    // Ordenar
    merges.sort((a, b) => {
      const col = this.currentSort.column;
      const dir = this.currentSort.direction;
      
      let valA = a[col];
      let valB = b[col];
      
      if (col === 'name') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      return dir === 'asc' ? valA - valB : valB - valA;
    });
    
    const possiveisMerges = merges.filter(m => m.isPossible).length;
    const totalMerges = merges.length;
    
    let html = `
      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3; margin-bottom: 20px;">
        <h4>📊 Resumo da Análise</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div><strong>Total de Merges:</strong> ${totalMerges}</div>
          <div><strong>✅ Possíveis Agora:</strong> ${possiveisMerges}</div>
          <div><strong>❌ Faltam Peças:</strong> ${totalMerges - possiveisMerges}</div>
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <button onclick="UI_MergeAnalyzer.filtrar('all')" style="${!this.currentFilter || this.currentFilter === 'all' ? 'background: #007bff; color: white;' : ''}">Todos</button>
        <button onclick="UI_MergeAnalyzer.filtrar('possible')" style="${this.currentFilter === 'possible' ? 'background: #28a745; color: white;' : ''}">✅ Possíveis</button>
        <button onclick="UI_MergeAnalyzer.filtrar('impossible')" style="${this.currentFilter === 'impossible' ? 'background: #dc3545; color: white;' : ''}">❌ Faltam Peças</button>
      </div>

      <table style="font-size: 12px;">
        <thead>
          <tr>
            <th onclick="UI_MergeAnalyzer.ordenar('name')" style="cursor: pointer;">
              Nome ${this.getSortIcon('name')}
            </th>
            <th>Nível Atual → Resultado</th>
            <th>Miners</th>
            <th onclick="UI_MergeAnalyzer.ordenar('ganhoTh')" style="cursor: pointer;">
              Ganho Power ${this.getSortIcon('ganhoTh')}
            </th>
            <th>Bonus</th>
            <th>Peças Necessárias</th>
            <th onclick="UI_MergeAnalyzer.ordenar('custoTotal')" style="cursor: pointer;">
              Custo Total ${this.getSortIcon('custoTotal')}
            </th>
            <th onclick="UI_MergeAnalyzer.ordenar('roi')" style="cursor: pointer;">
              ROI ${this.getSortIcon('roi')}
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    merges.forEach(merge => {
      const levelBefore = this.getLevelBefore(merge.currentLevel);
      const roiClass = merge.roi > 50000 ? 'high-impact' : merge.roi > 20000 ? 'medium-impact' : 'low-impact';
      
      html += `
          <tr class="${roiClass}" data-possible="${merge.isPossible}">
          <td><strong>${merge.name}</strong></td>
          <td>${levelBefore} → <strong>${merge.currentLevel}</strong></td>
          <td>${merge.minerQty}/${merge.minerNeeded}</td>
          <td>
            <strong>+${merge.ganhoTh.toFixed(2)} Th/s</strong><br>
            <small>+${merge.ganhoGh.toFixed(0)} Gh/s</small>
          </td>
          <td>
            ${merge.bonusBefore}% → <strong>${merge.bonusAfter}%</strong><br>
            <small>+${(merge.bonusAfter - merge.bonusBefore).toFixed(2)}%</small>
          </td>
          <td style="text-align: left; font-size: 11px;">
            ${this.renderPecasNecessarias(merge)}
          </td>
          <td>
            <strong>${merge.custoTotal.toFixed(2)} RLT</strong><br>
            <small>Fee: ${merge.custoMergeFee} RLT</small>
            ${merge.custoPartes > 0 ? `<br><small>Peças: ${merge.custoPartes.toFixed(2)} RLT</small>` : ''}
          </td>
          <td>
            <strong>${Utils.formatPower(merge.roi * 1e9)}</strong><br>
            <small>por RLT</small>
          </td>
          <td>
            ${merge.isPossible ? 
              '<span style="color: green; font-weight: bold;">✅ POSSÍVEL</span>' : 
              '<span style="color: red; font-weight: bold;">❌ FALTA PEÇAS</span>'
            }
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    
    html += `
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-top: 20px;">
        <h4>💡 Como Interpretar</h4>
        <ul style="font-size: 13px; line-height: 1.6;">
          <li><strong>ROI (Return on Investment):</strong> Ganho de poder (GH/s) por RLT gasto</li>
          <li><strong>Custo Total:</strong> Taxa de merge + custo das peças que faltam</li>
          <li><strong>Peças Necessárias:</strong> Lista o que falta para fazer o merge, com nível e preço</li>
          <li><strong>Status Possível:</strong> Você tem todas as miners e peças necessárias</li>
          <li><strong>Cores:</strong> 🟢 Baixo ROI | 🟡 Médio ROI | 🔴 Alto ROI</li>
        </ul>
      </div>
    `;
    
    div.innerHTML = html;
  },
  
  renderPecasNecessarias(merge) {
    if (merge.pecasFaltando.length === 0) {
      return '<span style="color: green;">✅ Tem todas!</span>';
    }
    
    const levelEmojis = {
      'common': '⚪',
      'uncommon': '🟢',
      'rare': '🔵',
      'epic': '🟣',
      'legendary': '🟡'
    };
    
    const levelNames = {
      'common': 'Common',
      'uncommon': 'Uncommon',
      'rare': 'Rare',
      'epic': 'Epic',
      'legendary': 'Legendary'
    };
    
    let html = '<div style="line-height: 1.5;">';
    
    merge.pecasFaltando.forEach(part => {
      const emoji = levelEmojis[part.level] || '⚪';
      const levelName = levelNames[part.level] || part.level;
      
      html += `<div style="margin: 2px 0;">`;
      html += `${emoji} <strong>${part.quantity}x</strong> ${part.name} (${levelName})`;
      html += `<br><small style="color: #666;">R$ ${part.priceTotal.toFixed(6)} (${part.priceUnit.toFixed(6)} cada)</small>`;
      html += `</div>`;
    });
    
    html += '</div>';
    return html;
  },
  
  getLevelBefore(currentLevel) {
    const map = {
      'Uncommon': 'Common',
      'Rare': 'Uncommon',
      'Epic': 'Rare',
      'Legendary': 'Epic'
    };
    return map[currentLevel] || '?';
  },
  
  getSortIcon(column) {
    if (this.currentSort.column !== column) {
      return '<span style="color: #ccc; font-size: 10px;">▲▼</span>';
    }
    return this.currentSort.direction === 'asc' ? 
      '<span style="color: #007bff; font-size: 12px;">▲</span>' : 
      '<span style="color: #007bff; font-size: 12px;">▼</span>';
  },
  
  ordenar(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = column === 'name' ? 'asc' : 'desc';
    }
    this.renderResultado();
  },
  
  filtrar(tipo) {
    this.currentFilter = tipo;
    
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
      const isPossible = row.dataset.possible === 'true';
      
      if (tipo === 'all') {
        row.style.display = '';
      } else if (tipo === 'possible' && isPossible) {
        row.style.display = '';
      } else if (tipo === 'impossible' && !isPossible) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
};

window.UI_MergeAnalyzer = UI_MergeAnalyzer;
console.log('✅ UI_MergeAnalyzer loaded');