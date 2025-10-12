// js/ui/miners.js - Aba Impact Analyzer (COM INDICADOR DE DUPLICATAS)

const UI_Miners = {
  currentFilter: 'all',
  
  mostrar(user) {
    if (!user.powerData || !user.roomData) {
      document.getElementById('miners').innerHTML = '<p class="error">Dados insuficientes para análise de impacto.</p>';
      return;
    }

    const impacts = Calculations.calcularImpactos(user);
    const div = document.getElementById('miners');
    
    const poderTotalAtual = user.powerData.current_power;

    let html = `
      <h2>Impact Analyzer - Detalhado</h2>
      
      <div style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="font-weight: bold; margin-bottom: 10px; text-align: center;">Estatísticas Gerais</p>
        <div class="summary-grid">
          <div><strong>Total de Miners:</strong> ${impacts.length}</div>
          <div><strong>Miners Únicas:</strong> ${Calculations.calcularMinersUnicas(impacts)}</div>
          <div><strong>Poder Total Atual:</strong> ${Utils.formatPower(poderTotalAtual * 1e9)}</div>
          <div><strong>Maior Impacto Individual:</strong> ${Utils.formatPower(impacts[0].impact * 1e9)}</div>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          <strong>⚠️ Importante:</strong> Os impactos individuais não podem ser somados porque os bônus de miners se afetam mutuamente.
        </p>
      </div>
      
      <div style="background: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0;">
        <h4>📋 Sobre Status das Miners</h4>
        <ul style="font-size: 13px; margin: 5px 0;">
          <li><strong style="color: #666;">⚪ Única:</strong> Você tem apenas 1 desta miner. Impacto INCLUI perda de bônus de coleção.</li>
          <li><strong style="color: #2196F3;">🔷 Primeira do tipo:</strong> Primeira de várias iguais. Impacto INCLUI perda de bônus de coleção.</li>
          <li><strong style="color: #FF9800;">🔄 Duplicata:</strong> 2ª, 3ª, 4ª... da mesma miner. Impacto NÃO inclui perda de bônus.</li>
        </ul>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
          <strong>💡 Exemplo:</strong> Se você tem 3x "Rare Miner", a primeira (🔷) tem alto impacto, as outras 2 (🔄) têm impacto menor. Se você tem apenas 1x "Epic Miner" (⚪), ela tem alto impacto.
        </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <button onclick="UI_Miners.exportarCSV()">📊 Exportar CSV</button>
        <button onclick="UI_Miners.restaurarTodas()" style="background: #28a745;">🔄 Restaurar Todas</button>
        <button onclick="UI_Miners.filtrar('high')">🔴 Alto Impacto</button>
        <button onclick="UI_Miners.filtrar('medium')">🟡 Médio Impacto</button>
        <button onclick="UI_Miners.filtrar('low')">🟢 Baixo Impacto</button>
        <button onclick="UI_Miners.filtrar('duplicates')">🔍 Duplicadas</button>
        <button onclick="UI_Miners.filtrar('all')">Todos</button>
      </div>

      <table id="minersTable">
        <tr>
          <th>Ranking</th><th>Nome</th><th>Level</th><th>Status</th><th>Localização</th>
          <th>Poder Base</th><th>Bônus %</th><th>Rack %</th>
          <th>Impacto Real</th><th>Perda Base</th><th>Perda Bônus</th>
          <th>% Relativo</th><th>Ação</th>
        </tr>
    `;

    impacts.forEach((m, index) => {
      const maiorImpacto = impacts[0].impact;
      const percentualRelativo = (m.impact / maiorImpacto) * 100;
      
      const impactClass = percentualRelativo > 80 ? 'high-impact' : 
                          percentualRelativo > 40 ? 'medium-impact' : 'low-impact';
      
      // Contar quantas miners deste tipo existem (usando a mesma chave do cálculo)
      const minerCount = impacts.filter(other => other.tipoKey === m.tipoKey).length;
      const isDuplicate = m.isDuplicate; // Duplicata (2ª, 3ª, 4ª...)
      const isFirst = m.isFirstOfType && minerCount > 1; // Primeira (quando há mais de uma)
      const isUnique = minerCount === 1; // Única (só tem uma)
      
      // Ícone de status
      let statusIcon = '';
      let statusTooltip = '';
      let statusColor = '';
      
      if (isUnique) {
        statusIcon = '⚪';
        statusTooltip = 'Única - Impacto inclui perda de bônus de coleção';
        statusColor = 'color: #666;';
      } else if (isFirst) {
        statusIcon = '🔷';
        statusTooltip = `Primeira de ${minerCount} unidades - Impacto INCLUI perda de bônus de coleção`;
        statusColor = 'color: #2196F3;';
      } else if (isDuplicate) {
        statusIcon = '🔄';
        statusTooltip = `Duplicata (${minerCount} unidades total) - Impacto NÃO inclui perda de bônus`;
        statusColor = 'color: #FF9800;';
      }
      
      // Buscar o rack para pegar informações de posição
      const rack = user.roomData.racks.find(r => r._id === m.rackId);
      const sala = rack ? (rack.placement?.room_level || 0) + 1 : 'N/A';
      const rackName = rack?.name || 'N/A';
      
      // Encontrar ordem VISUAL do rack (ordenado por sala -> linha -> coluna)
      const racksOrdenados = [...user.roomData.racks].sort((a, b) => {
        const salaA = a.placement?.room_level || 0;
        const salaB = b.placement?.room_level || 0;
        if (salaA !== salaB) return salaA - salaB;
        
        const linhaA = a.placement?.y || 0;
        const linhaB = b.placement?.y || 0;
        if (linhaA !== linhaB) return linhaA - linhaB;
        
        return (a.placement?.x || 0) - (b.placement?.x || 0);
      });
      
      const rackOrdemVisual = racksOrdenados.findIndex(r => r._id === m.rackId) + 1;
      const rackOrdem = rackOrdemVisual > 0 ? `Rack #${rackOrdemVisual}` : 'N/A';
      
      // Dimensões do rack
      const rackHeight = rack?.rack_info?.height || 4;
      
      // Posição da miner dentro do rack (linha de cima pra baixo)
      const minerY = m.position.y;
      
      // Criar descrição simplificada e clara
      const localizacao = `<strong>Sala ${sala}</strong><br>` +
                         `${rackOrdem}: ${rackName}<br>` +
                         `<small>Linha ${minerY + 1} de ${rackHeight} do rack</small>`;
      
      html += `
        <tr class="${impactClass}" data-type="${percentualRelativo > 80 ? 'high' : percentualRelativo > 40 ? 'medium' : 'low'}" data-duplicate="${isDuplicate}">
          <td><strong>#${index + 1}</strong></td>
          <td><strong>${m.name}</strong>${minerCount > 1 ? ` <span style="color: orange;">🔢</span>` : ''}</td>
          <td>${m.level}</td>
          <td title="${statusTooltip}" style="font-size: 20px; ${statusColor}">${statusIcon}</td>
          <td>${localizacao}</td>
          <td>${Utils.formatPower(m.basePower * 1e9)}<br><small>${m.basePower.toFixed(3)} GH/s</small></td>
          <td>${(m.minerBonusPercent * 100).toFixed(2)}%${m.isDuplicate ? '<br><small style="color: #999;">(não aplicado)</small>' : ''}</td>
          <td>${(m.rackBonus * 100).toFixed(2)}%</td>
          <td><strong>${Utils.formatPower(m.impact * 1e9)}</strong><br><small>${m.impact.toFixed(3)} GH/s</small></td>
          <td>${Utils.formatPower(m.perdaBase * 1e9)}<br><small>Base perdida</small></td>
          <td>${Utils.formatPower((m.perdaBonusBase + m.perdaBonusPropia + m.perdaRackBonus) * 1e9)}<br><small>Bônus perdido</small></td>
          <td><strong>${percentualRelativo.toFixed(1)}%</strong><br><small>vs maior</small></td>
          <td><button onclick="UI_Miners.simularRemocao(${m.minerIndex})" style="padding: 5px 10px; font-size: 12px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">🗑️ Simular</button></td>
        </tr>
      `;
    });
    
    html += "</table>";
    div.innerHTML = html;
  },
  
  filtrar(tipo) {
    this.currentFilter = tipo;
    const table = document.getElementById('minersTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr[data-type]');
    
    rows.forEach(row => {
      if (tipo === 'all') {
        row.style.display = '';
      } else if (tipo === 'duplicates') {
        row.style.display = row.dataset.duplicate === 'true' ? '' : 'none';
      } else if (row.dataset.type === tipo) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
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
    
    // Determinar se é duplicata
    const minerCount = impacts.filter(other => other.tipoKey === impactData.tipoKey).length;
    const isUnique = minerCount === 1;
    
    let statusText = '';
    let bonusInfo = '';
    
    if (isUnique) {
      statusText = '<span style="color: #666; font-weight: bold;">⚪ Única</span>';
      bonusInfo = '<div style="background: #fff3e0; padding: 10px; border-radius: 5px; border-left: 4px solid #FF9800;"><p style="color: #e65100; font-size: 13px; margin: 0;">⚠️ Esta é a <strong>única</strong> miner deste tipo. Removê-la <strong>causará perda</strong> de bônus de coleção!</p></div>';
    } else if (impactData.isFirstOfType) {
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
            <p><strong>Bônus Total Oferecido:</strong> ${((minerParaRemover.bonus_percent/10000) * 100).toFixed(2)}%</p>
            ${impactData.isDuplicate ? 
              '<p><strong>Bônus Aplicado no Impacto:</strong> <span style="color: #999;">0% (duplicata não perde)</span></p>' :
              '<p><strong>Bônus Aplicado no Impacto:</strong> <span style="color: #dc3545;">' + ((minerParaRemover.bonus_percent/10000) * 100).toFixed(2) + '% (será perdido!)</span></p>'
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
    
    let csv = 'Ranking,Nome,Level,Status,Poder Base (H/s),Bonus Miner (%),Bonus Aplicado (%),Bonus Rack (%),Impacto Real (H/s),Bonus Removido (H/s),Sem Bonus Colecao (H/s),Percentual Total (%)\n';
    
    impacts.forEach((m, index) => {
      const minerCount = impacts.filter(other => other.tipoKey === m.tipoKey).length;
      const isUnique = minerCount === 1;
      
      let status = '';
      if (isUnique) {
        status = 'Única';
      } else if (m.isFirstOfType) {
        status = 'Primeira';
      } else {
        status = 'Duplicata';
      }
      
      const bonusAplicado = m.minerBonusPercentAplicado * 100;
      
      csv += `${index + 1},"${m.name}","${m.level}","${status}",${(m.basePower * 1e9)},${(m.minerBonusPercent * 100).toFixed(2)},${bonusAplicado.toFixed(2)},${(m.rackBonus * 100).toFixed(2)},${(m.impact * 1e9)},${(m.perdaRackBonus * 1e9)},${(m.perdaBase * 1e9)},${m.impactPercent.toFixed(2)}\n`;
    });
    
    Utils.exportarCSV(csv, 'rollercoin_impact_' + userData.name + '_' + new Date().toISOString().split('T')[0] + '.csv');
  }
};

window.UI_Miners = UI_Miners;