// js/ui/racks.js - Impact Rack Analyzer (CSS Cleanup)

const UI_Racks = {
  currentFilter: 'all',
  
  mostrar(user) {
    if (!user.roomData || !user.powerData) {
      document.getElementById('racks').innerHTML = '<p class="error">Dados de racks não disponíveis.</p>';
      return;
    }

    const impactosRacks = this.calcularImpactosRacks(user);
    
    const div = document.getElementById('racks');
    let html = `
      <h2>Impact Rack Analyzer</h2>
      
      <div class="racks-stats-box">
        <p class="racks-stats-title">Estatísticas Gerais</p>
        <div class="summary-grid">
          <div><strong>Total de Racks:</strong> ${impactosRacks.length}</div>
          <div><strong>Racks Ocupados:</strong> ${impactosRacks.filter(r => r.numMiners > 0).length}</div>
          <div><strong>Racks Vazios:</strong> ${impactosRacks.filter(r => r.numMiners === 0).length}</div>
          <div><strong>Maior Impacto:</strong> ${impactosRacks[0] ? Utils.formatPower(impactosRacks[0].impactoReal * 1e9) : 'N/A'}</div>
        </div>
      </div>
      
      <div class="racks-filters">
        <button onclick="UI_Racks.exportarCSV()" class="racks-filter-btn">📊 Exportar CSV</button>
        <button onclick="UI_Racks.filtrar('high')" class="racks-filter-btn ${this.currentFilter === 'high' ? 'active-high' : ''}">🔴 Alto Impacto</button>
        <button onclick="UI_Racks.filtrar('medium')" class="racks-filter-btn ${this.currentFilter === 'medium' ? 'active-medium' : ''}">🟡 Médio Impacto</button>
        <button onclick="UI_Racks.filtrar('low')" class="racks-filter-btn ${this.currentFilter === 'low' ? 'active-low' : ''}">🟢 Baixo Impacto</button>
        <button onclick="UI_Racks.filtrar('empty')" class="racks-filter-btn ${this.currentFilter === 'empty' ? 'active-empty' : ''}">⚪ Vazios</button>
        <button onclick="UI_Racks.filtrar('all')" class="racks-filter-btn ${this.currentFilter === 'all' ? 'active-all' : ''}">Todos</button>
      </div>

      <table id="racksTable">
        <tr>
          <th>Ranking</th>
          <th>Ordem</th>
          <th>Nome do Rack</th>
          <th>Sala</th>
          <th>Bônus Rack</th>
          <th>Miners</th>
          <th>Ocupação</th>
          <th>Eficiência</th>
          <th>Poder Base</th>
          <th>🎯 Impacto Real</th>
          <th>Contribuição Bônus</th>
          <th>ROI/Célula</th>
        </tr>
    `;

    impactosRacks.forEach((rack, index) => {
      const maiorImpacto = impactosRacks[0]?.impactoReal || 1;
      const percentualRelativo = (rack.impactoReal / maiorImpacto) * 100;
      
      let impactClass = 'debug';
      if (rack.numMiners === 0) {
        impactClass = 'debug';
      } else if (percentualRelativo > 70) {
        impactClass = 'high-impact';
      } else if (percentualRelativo > 30) {
        impactClass = 'medium-impact';
      } else {
        impactClass = 'low-impact';
      }
      
      html += `
        <tr class="${impactClass}" data-type="${rack.numMiners === 0 ? 'empty' : percentualRelativo > 70 ? 'high' : percentualRelativo > 30 ? 'medium' : 'low'}" onclick="UI_Racks.mostrarMinersDoRack('${rack.rackId}')">
          <td><strong>#${index + 1}</strong></td>
          <td><strong>Rack #${rack.ordem}</strong></td>
          <td><strong>${rack.nome}</strong></td>
          <td>Sala ${rack.sala}</td>
          <td>${rack.bonusRack.toFixed(2)}%</td>
          <td>${rack.numMiners}</td>
          <td>${rack.ocupacao} / ${rack.capacidade}</td>
          <td><strong>${rack.eficiencia.toFixed(1)}%</strong></td>
          <td>${Utils.formatPower(rack.poderBase * 1e9)}<br><small>${rack.poderBase.toFixed(3)} GH/s</small></td>
          <td><strong>${Utils.formatPower(rack.impactoReal * 1e9)}</strong><br><small>${rack.impactoReal.toFixed(3)} GH/s</small></td>
          <td>${Utils.formatPower(rack.contribuicaoBonus * 1e9)}<br><small>${rack.contribuicaoBonus.toFixed(3)} GH/s</small></td>
          <td><strong>${Utils.formatPower(rack.roiPorCelula * 1e9)}</strong><br><small>por célula</small></td>
        </tr>
      `;
    });

    html += "</table>";
    
    html += `
      <div class="racks-info-box">
        <h4>💡 Como Interpretar</h4>
        <ul>
          <li><strong>Ordem:</strong> Posição visual do rack (1º da esquerda pra direita, cima pra baixo, começando pela Sala 1)</li>
          <li><strong>Impacto Real:</strong> Quanto poder você perderia removendo TODAS as miners desse rack</li>
          <li><strong>Contribuição Bônus:</strong> Diferença entre impacto real e poder base (mostra efeito dos bônus)</li>
          <li><strong>ROI/Célula:</strong> Impacto real dividido pelo espaço ocupado - útil para comparar eficiência</li>
          <li><strong>Eficiência:</strong> Percentual de ocupação do rack (células usadas / capacidade total)</li>
          <li><strong>👆 Clique em qualquer rack</strong> para ver as miners instaladas nele!</li>
        </ul>
        <p class="racks-info-tip">
          <strong>💡 Dica:</strong> Racks com alto ROI/Célula são mais eficientes. Considere mover miners fortes para estes racks!
        </p>
      </div>
    `;
    
    div.innerHTML = html;
  },
  
  mostrarMinersDoRack(rackId) {
    const userData = State.getUserData();
    if (!userData) return;
    
    const allMiners = userData.roomData.miners || [];
    const racks = userData.roomData.racks || [];
    const impacts = Calculations.calcularImpactos(userData);
    
    const rack = racks.find(r => r._id === rackId);
    if (!rack) return;
    
    const racksOrdenados = [...racks].sort((a, b) => {
      const salaA = a.placement?.room_level || 0;
      const salaB = b.placement?.room_level || 0;
      if (salaA !== salaB) return salaA - salaB;
      
      const linhaA = a.placement?.y || 0;
      const linhaB = b.placement?.y || 0;
      if (linhaA !== linhaB) return linhaA - linhaB;
      
      return (a.placement?.x || 0) - (b.placement?.x || 0);
    });
    
    const rackIndex = racksOrdenados.findIndex(r => r._id === rackId);
    const rackOrdem = rackIndex >= 0 ? rackIndex + 1 : '?';
    
    const minersNoRack = allMiners.filter(m => m.placement?.user_rack_id === rackId);
    
    if (minersNoRack.length === 0) {
      Utils.mostrarNotificacao('⚠️ Este rack está vazio!', 'warning');
      return;
    }
    
    const minersComImpacto = minersNoRack.map(miner => {
      const minerIndex = allMiners.indexOf(miner);
      const impact = impacts.find(i => i.minerIndex === minerIndex);
      return {
        ...impact,
        miner: miner
      };
    }).sort((a, b) => b.impact - a.impact);
    
    let modalHTML = `
      <div id="rackModal" class="racks-modal-overlay" onclick="UI_Racks.fecharModal(event)">
        <div class="racks-modal-content" onclick="event.stopPropagation();">
          <div class="racks-modal-header">
            <h3>🏠 Rack #${rackOrdem}: ${rack.name}</h3>
            <button onclick="UI_Racks.fecharModal()" class="racks-modal-close">✕</button>
          </div>
          
          <div class="racks-modal-info">
            <div class="racks-modal-grid">
              <div><strong>Sala:</strong> ${(rack.placement?.room_level || 0) + 1}</div>
              <div><strong>Bônus:</strong> ${(rack.bonus / 100).toFixed(2)}%</div>
              <div><strong>Miners:</strong> ${minersNoRack.length}</div>
            </div>
          </div>
          
          <h4 style="margin: 20px 0 10px 0;">📋 Miners neste Rack (ordenadas por impacto)</h4>
          
          <table>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Level</th>
              <th>Status</th>
              <th>Cél</th>
              <th>Bônus</th>
              <th>Power Base</th>
              <th>Impacto</th>
            </tr>
    `;
    
    const maiorImpacto = minersComImpacto[0]?.impact || 1;
    
    minersComImpacto.forEach((m, index) => {
      const percentualRelativo = (m.impact / maiorImpacto) * 100;
      const impactClass = percentualRelativo > 80 ? 'high-impact' : 
                          percentualRelativo > 40 ? 'medium-impact' : 'low-impact';
      
      const statusIcon = m.isFirstOfType ? '🔷' : (m.isDuplicate ? '🔄' : '⚪');
      
      modalHTML += `
        <tr class="${impactClass}">
          <td><strong>#${index + 1}</strong></td>
          <td><strong>${m.name}</strong></td>
          <td>${m.level}</td>
          <td style="text-align: center; font-size: 16px;">${statusIcon}</td>
          <td style="text-align: center;"><strong>${m.width || 2}</strong></td>
          <td>${(m.minerBonusPercent * 100).toFixed(2)}%</td>
          <td>${Utils.formatPower(m.basePower * 1e9)}</td>
          <td><strong>${Utils.formatPower(m.impact * 1e9)}</strong></td>
        </tr>
      `;
    });
    
    modalHTML += `
          </table>
          
          <div class="racks-modal-legend">
            <p style="font-size: 12px; margin: 5px 0;"><strong>Legenda:</strong></p>
            <p>🔷 = Primeira do tipo (alto impacto com perda de bônus)</p>
            <p>🔄 = Duplicata (impacto menor, sem perda de bônus)</p>
            <p>⚪ = Única (impacto com perda de bônus)</p>
          </div>
          
          <div class="racks-modal-actions">
            <button onclick="UI_Racks.fecharModal()" style="padding: 10px 30px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Fechar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },
  
  fecharModal(event) {
    if (event && event.target.id !== 'rackModal') return;
    
    const modal = document.getElementById('rackModal');
    if (modal) {
      modal.remove();
    }
  },
  
  calcularImpactosRacks(user) {
    const racks = user.roomData.racks || [];
    const allMiners = user.roomData.miners || [];
    const impacts = Calculations.calcularImpactos(user);
    
    const racksOrdenados = [...racks].sort((a, b) => {
      const salaA = a.placement?.room_level || 0;
      const salaB = b.placement?.room_level || 0;
      if (salaA !== salaB) return salaA - salaB;
      
      const linhaA = a.placement?.y || 0;
      const linhaB = b.placement?.y || 0;
      if (linhaA !== linhaB) return linhaA - linhaB;
      
      return (a.placement?.x || 0) - (b.placement?.x || 0);
    });
    
    const impactosRacks = racksOrdenados.map((rack, rackIndex) => {
      const rackId = rack._id;
      const minersNoRack = allMiners.filter(m => m.placement?.user_rack_id === rackId);
      
      let impactoTotal = 0;
      let poderBaseTotal = 0;
      let celulasOcupadas = 0;
      
      minersNoRack.forEach(miner => {
        const impact = impacts.find(i => i.minerIndex === allMiners.indexOf(miner));
        if (impact) {
          impactoTotal += impact.impact;
          poderBaseTotal += impact.basePower;
        }
        celulasOcupadas += (miner.width || 2);
      });
      
      const capacidade = rack.rack_info ? (rack.rack_info.width * rack.rack_info.height) : 0;
      const eficiencia = capacidade > 0 ? (celulasOcupadas / capacidade) * 100 : 0;
      const contribuicaoBonus = impactoTotal - poderBaseTotal;
      const roiPorCelula = celulasOcupadas > 0 ? impactoTotal / celulasOcupadas : 0;
      
      return {
        nome: rack.name || 'N/A',
        ordem: rackIndex + 1,
        sala: (rack.placement?.room_level || 0) + 1,
        bonusRack: (rack.bonus || 0) / 100,
        numMiners: minersNoRack.length,
        ocupacao: celulasOcupadas,
        capacidade: capacidade,
        eficiencia: eficiencia,
        poderBase: poderBaseTotal,
        impactoReal: impactoTotal,
        contribuicaoBonus: contribuicaoBonus,
        roiPorCelula: roiPorCelula,
        rackId: rackId
      };
    });
    
    return impactosRacks.sort((a, b) => b.impactoReal - a.impactoReal);
  },
  
  filtrar(tipo) {
    this.currentFilter = tipo;
    const table = document.getElementById('racksTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr[data-type]');
    
    rows.forEach(row => {
      if (tipo === 'all') {
        row.style.display = '';
      } else if (row.dataset.type === tipo) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  },
  
  exportarCSV() {
    const userData = State.getUserData();
    if (!userData) return;
    
    const impactosRacks = this.calcularImpactosRacks(userData);
    
    let csv = 'Ranking,Ordem,Nome,Sala,Bonus Rack (%),Miners,Ocupacao,Capacidade,Eficiencia (%),Poder Base (H/s),Impacto Real (H/s),Contribuicao Bonus (H/s),ROI por Celula (H/s)\n';
    
    impactosRacks.forEach((rack, index) => {
      csv += `${index + 1},Rack #${rack.ordem},"${rack.nome}",${rack.sala},${rack.bonusRack.toFixed(2)},${rack.numMiners},${rack.ocupacao},${rack.capacidade},${rack.eficiencia.toFixed(1)},${(rack.poderBase * 1e9)},${(rack.impactoReal * 1e9)},${(rack.contribuicaoBonus * 1e9)},${(rack.roiPorCelula * 1e9)}\n`;
    });
    
    Utils.exportarCSV(csv, 'rollercoin_racks_impact_' + userData.name + '_' + new Date().toISOString().split('T')[0] + '.csv');
  }
};

window.UI_Racks = UI_Racks;