// js/ui/racks.js - Impact Rack Analyzer (POSIÇÕES ATUALIZADAS)

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
      
      <div style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="font-weight: bold; margin-bottom: 10px; text-align: center;">Estatísticas Gerais</p>
        <div class="summary-grid">
          <div><strong>Total de Racks:</strong> ${impactosRacks.length}</div>
          <div><strong>Racks Ocupados:</strong> ${impactosRacks.filter(r => r.numMiners > 0).length}</div>
          <div><strong>Racks Vazios:</strong> ${impactosRacks.filter(r => r.numMiners === 0).length}</div>
          <div><strong>Maior Impacto:</strong> ${impactosRacks[0] ? Utils.formatPower(impactosRacks[0].impactoReal * 1e9) : 'N/A'}</div>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <button onclick="UI_Racks.exportarCSV()">📊 Exportar CSV</button>
        <button onclick="UI_Racks.filtrar('high')" style="${this.currentFilter === 'high' ? 'background: #dc3545; color: white;' : ''}">🔴 Alto Impacto</button>
        <button onclick="UI_Racks.filtrar('medium')" style="${this.currentFilter === 'medium' ? 'background: #ff9800; color: white;' : ''}">🟡 Médio Impacto</button>
        <button onclick="UI_Racks.filtrar('low')" style="${this.currentFilter === 'low' ? 'background: #28a745; color: white;' : ''}">🟢 Baixo Impacto</button>
        <button onclick="UI_Racks.filtrar('empty')" style="${this.currentFilter === 'empty' ? 'background: #6c757d; color: white;' : ''}">⚪ Vazios</button>
        <button onclick="UI_Racks.filtrar('all')" style="${this.currentFilter === 'all' ? 'background: #007bff; color: white;' : ''}">Todos</button>
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
        <tr class="${impactClass}" data-type="${rack.numMiners === 0 ? 'empty' : percentualRelativo > 70 ? 'high' : percentualRelativo > 30 ? 'medium' : 'low'}" onclick="UI_Racks.mostrarMinersDoRack('${rack.rackId}')" style="cursor: pointer;">
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
      <div style="background: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin-top: 20px;">
        <h4>💡 Como Interpretar</h4>
        <ul style="font-size: 13px; margin: 5px 0;">
          <li><strong>Ordem:</strong> Posição visual do rack (1º da esquerda pra direita, cima pra baixo, começando pela Sala 1)</li>
          <li><strong>Impacto Real:</strong> Quanto poder você perderia removendo TODAS as miners desse rack</li>
          <li><strong>Contribuição Bônus:</strong> Diferença entre impacto real e poder base (mostra efeito dos bônus)</li>
          <li><strong>ROI/Célula:</strong> Impacto real dividido pelo espaço ocupado - útil para comparar eficiência</li>
          <li><strong>Eficiência:</strong> Percentual de ocupação do rack (células usadas / capacidade total)</li>
          <li><strong>👆 Clique em qualquer rack</strong> para ver as miners instaladas nele!</li>
        </ul>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
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
    
    // Encontrar o rack
    const rack = racks.find(r => r._id === rackId);
    if (!rack) return;
    
    // ORDENAR RACKS POR POSIÇÃO VISUAL para encontrar ordem correta
    const racksOrdenados = [...racks].sort((a, b) => {
      const salaA = a.placement?.room_level || 0;
      const salaB = b.placement?.room_level || 0;
      if (salaA !== salaB) return salaA - salaB;
      
      const linhaA = a.placement?.y || 0;
      const linhaB = b.placement?.y || 0;
      if (linhaA !== linhaB) return linhaA - linhaB;
      
      return (a.placement?.x || 0) - (b.placement?.x || 0);
    });
    
    // Encontrar índice/ordem VISUAL do rack
    const rackIndex = racksOrdenados.findIndex(r => r._id === rackId);
    const rackOrdem = rackIndex >= 0 ? rackIndex + 1 : '?';
    
    // Encontrar miners neste rack
    const minersNoRack = allMiners.filter(m => m.placement?.user_rack_id === rackId);
    
    if (minersNoRack.length === 0) {
      Utils.mostrarNotificacao('⚠️ Este rack está vazio!', 'warning');
      return;
    }
    
    // Pegar impactos dessas miners e ordenar
    const minersComImpacto = minersNoRack.map(miner => {
      const minerIndex = allMiners.indexOf(miner);
      const impact = impacts.find(i => i.minerIndex === minerIndex);
      return {
        ...impact,
        miner: miner
      };
    }).sort((a, b) => b.impact - a.impact);
    
    // Criar modal
    let modalHTML = `
      <div id="rackModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: center; justify-content: center;" onclick="UI_Racks.fecharModal(event)">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation();">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">🏠 Rack #${rackOrdem}: ${rack.name}</h3>
            <button onclick="UI_Racks.fecharModal()" style="background: #dc3545; color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 18px;">✕</button>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 14px;">
              <div><strong>Sala:</strong> ${(rack.placement?.room_level || 0) + 1}</div>
              <div><strong>Bônus:</strong> ${(rack.bonus / 100).toFixed(2)}%</div>
              <div><strong>Miners:</strong> ${minersNoRack.length}</div>
            </div>
          </div>
          
          <h4 style="margin: 20px 0 10px 0;">📋 Miners neste Rack (ordenadas por impacto)</h4>
          
          <table style="width: 100%; font-size: 12px;">
            <tr style="background: #eee;">
              <th style="padding: 8px;">#</th>
              <th style="padding: 8px;">Nome</th>
              <th style="padding: 8px;">Level</th>
              <th style="padding: 8px;">Status</th>
              <th style="padding: 8px;">Cél</th>
              <th style="padding: 8px;">Bônus</th>
              <th style="padding: 8px;">Power Base</th>
              <th style="padding: 8px;">Impacto</th>
            </tr>
    `;
    
    const maiorImpacto = minersComImpacto[0]?.impact || 1;
    
    minersComImpacto.forEach((m, index) => {
      const percentualRelativo = (m.impact / maiorImpacto) * 100;
      const impactClass = percentualRelativo > 80 ? 'high-impact' : 
                          percentualRelativo > 40 ? 'medium-impact' : 'low-impact';
      
      const statusIcon = m.isFirstOfType ? '🔷' : (m.isDuplicate ? '🔄' : '⚪');
      
      modalHTML += `
        <tr class="${impactClass}" style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;"><strong>#${index + 1}</strong></td>
          <td style="padding: 8px;"><strong>${m.name}</strong></td>
          <td style="padding: 8px;">${m.level}</td>
          <td style="padding: 8px; text-align: center; font-size: 16px;">${statusIcon}</td>
          <td style="padding: 8px; text-align: center;"><strong>${m.width || 2}</strong></td>
          <td style="padding: 8px;">${(m.minerBonusPercent * 100).toFixed(2)}%</td>
          <td style="padding: 8px;">${Utils.formatPower(m.basePower * 1e9)}</td>
          <td style="padding: 8px;"><strong>${Utils.formatPower(m.impact * 1e9)}</strong></td>
        </tr>
      `;
    });
    
    modalHTML += `
          </table>
          
          <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #4CAF50;">
            <p style="font-size: 12px; margin: 5px 0;"><strong>Legenda:</strong></p>
            <p style="font-size: 11px; margin: 3px 0;">🔷 = Primeira do tipo (alto impacto com perda de bônus)</p>
            <p style="font-size: 11px; margin: 3px 0;">🔄 = Duplicata (impacto menor, sem perda de bônus)</p>
            <p style="font-size: 11px; margin: 3px 0;">⚪ = Única (impacto com perda de bônus)</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <button onclick="UI_Racks.fecharModal()" style="padding: 10px 30px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Fechar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },
  
  fecharModal(event) {
    // Se event existe e não é o background, não fecha
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
    
    // ORDENAR RACKS POR POSIÇÃO VISUAL (sala -> linha -> coluna)
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
      
      // Somar impactos das miners neste rack
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
        ordem: rackIndex + 1, // Ordem VISUAL (1º visualmente, 2º visualmente, etc)
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
    
    // Ordenar por impacto real (maior primeiro)
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