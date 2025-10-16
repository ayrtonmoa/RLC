// js/ui/resumo.js - Aba Resumo & Perfil (COM VALORES EXATOS)

const UI_Resumo = {
  mostrar(user) {
    const powerData = user.powerData;
    const roomData = user.roomData;

    if (!powerData || !roomData) {
      document.getElementById('resumo').innerHTML = '<p class="error">Dados insuficientes para gerar resumo.</p>';
      return;
    }

    const avatarUrl = CONFIG.AVATAR_BASE_URL + user.avatar_id + ".png";

    const allMiners = roomData.miners || [];
    const uniqueMiners = allMiners.filter((miner, index, self) =>
      index === self.findIndex((m) => m.miner_id === miner.miner_id)
    );

    const basePowerMinersFromRoom = allMiners.reduce((sum, miner) => sum + miner.power, 0);
    
    // CORREÇÃO: Usar o bônus direto da API, não recalcular
    const bonusPowerFromApi = powerData.bonus;
    
    // Total calculado = base + bonus (da API) + racks + games + temp
    const calculatedTotalPower = basePowerMinersFromRoom + bonusPowerFromApi + powerData.racks + powerData.games + powerData.temp;

    const totalApiEHS = Utils.formatPower(powerData.current_power * 1e9);
    const totalCalculadoEHS = Utils.formatPower(calculatedTotalPower * 1e9);
    const difference = (powerData.current_power - calculatedTotalPower) * 1e9;

    State.addDebugInfo(`Resumo: Base=${basePowerMinersFromRoom.toFixed(3)}, Bonus=${bonusPowerFromApi.toFixed(3)}, Total=${calculatedTotalPower.toFixed(3)}`);

    const div = document.getElementById('resumo');
    div.innerHTML = `
      <h2>Resumo & Perfil do Usuário</h2>
      
      <div class="summary-item" style="margin-bottom: 20px;">
        <h3>Perfil do Jogador</h3>
        <div class="profile-header">
          <img src="${avatarUrl}" alt="Avatar" class="avatar" onerror="this.style.display='none'">
          <div>
            <h4>${user.name}</h4>
            <p><strong>Registrado:</strong> ${new Date(user.registration).toLocaleDateString('pt-BR')}</p>
            <p><strong>Liga:</strong> ${user.league?.title?.pt || user.league?.title?.en || 'N/A'}</p>
          </div>
        </div>
        ${user.league?.main_img_url ? `<img src="${user.league.main_img_url}" alt="Liga" height="60" style="margin-top: 10px;">` : ''}
      </div>

      <h3>Resumo de Poder</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <h4>📊 Poder Total (Oficial)</h4>
          <p style="font-size: 1.3em; font-weight: bold; color: #007bff;">${totalApiEHS}</p>
          <small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">Exato: ${powerData.current_power.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <h4>🔧 Poder Calculado</h4>
          <p style="font-size: 1.3em; font-weight: bold;">${totalCalculadoEHS}</p>
          <small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">Exato: ${calculatedTotalPower.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <h4>📈 Diferença</h4>
          <p style="font-size: 1.1em; font-weight: bold; color: ${Math.abs(difference) < 1000 ? 'green' : 'orange'};">${Utils.formatPowerSigned(difference)}</p>
          <small style="color: #666;">${Math.abs(difference) < 1000 ? 'Precisão excelente!' : 'Pequena variação normal'}</small>
        </div>
      </div>
      
      <hr>
      
      <h4>Detalhamento dos Componentes</h4>
      <div class="summary-grid">
        <div class="summary-item">
          <strong>Miners (Base):</strong><br>
          ${Utils.formatPower(basePowerMinersFromRoom * 1e9)}<br>
          <small>${basePowerMinersFromRoom.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <strong>Bônus de Coleção:</strong><br>
          ${Utils.formatPower(bonusPowerFromApi * 1e9)}<br>
          <small>${bonusPowerFromApi.toFixed(9)} GH/s (${(powerData.bonus_percent / 100).toFixed(2)}%)</small>
        </div>
        <div class="summary-item">
          <strong>Racks:</strong><br>
          ${Utils.formatPower(powerData.racks * 1e9)}<br>
          <small>${powerData.racks.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <strong>Games:</strong><br>
          ${Utils.formatPower(powerData.games * 1e9)}<br>
          <small>${powerData.games.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <strong>Temporário:</strong><br>
          ${Utils.formatPower(powerData.temp * 1e9)}<br>
          <small>${powerData.temp.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <strong>Miners:</strong><br>
          ${uniqueMiners.length} únicas / ${allMiners.length} total
        </div>
      </div>
      
      ${Math.abs(difference) > 1000 ? `
        <div class="summary-item" style="background: #fff3cd; border-left: 4px solid #ffc107; margin-top: 20px;">
          <h4>ℹ️ Sobre a Diferença</h4>
          <p style="font-size: 13px;">Uma pequena diferença é normal devido a:</p>
          <ul style="font-size: 12px; margin: 5px 0;">
            <li>Arredondamentos da API</li>
            <li>Bônus temporários ativos</li>
            <li>Eventos especiais</li>
          </ul>
        </div>
      ` : ''}
    `;
  }
};

window.UI_Resumo = UI_Resumo;
console.log('✅ UI_Resumo loaded');