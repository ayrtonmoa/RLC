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
    const bonusPowerFromApi = powerData.bonus;
    const calculatedTotalPower = basePowerMinersFromRoom + bonusPowerFromApi + powerData.racks + powerData.games + powerData.temp;

    const totalApiEHS = Utils.formatPower(powerData.current_power * 1e9);
    const totalCalculadoEHS = Utils.formatPower(calculatedTotalPower * 1e9);
    const difference = (powerData.current_power - calculatedTotalPower) * 1e9;
    const diffClass = Math.abs(difference) < 1000 ? 'good' : 'warning';

    State.addDebugInfo(`Resumo: Base=${basePowerMinersFromRoom.toFixed(3)}, Bonus=${bonusPowerFromApi.toFixed(3)}, Total=${calculatedTotalPower.toFixed(3)}`);

    const div = document.getElementById('resumo');
    div.innerHTML = `
      <h2>Resumo & Perfil do Usuário</h2>
      
      <div class="summary-item profile-section">
        <h3>Perfil do Jogador</h3>
        <div class="profile-header">
          <img src="${avatarUrl}" alt="Avatar" class="avatar" onerror="this.style.display='none'">
          <div>
            <h4>${user.name}</h4>
            <p><strong>Registrado:</strong> ${new Date(user.registration).toLocaleDateString('pt-BR')}</p>
            <p><strong>Liga:</strong> ${user.league?.title?.pt || user.league?.title?.en || 'N/A'}</p>
          </div>
        </div>
        ${user.league?.main_img_url ? `<img src="${user.league.main_img_url}" alt="Liga" class="league-image">` : ''}
      </div>

      <h3>Resumo de Poder</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <h4>📊 Poder Total (Oficial)</h4>
          <p class="power-value-main power-value-official">${totalApiEHS}</p>
          <small class="power-value-small">Exato: ${powerData.current_power.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <h4>🔧 Poder Calculado</h4>
          <p class="power-value-main">${totalCalculadoEHS}</p>
          <small class="power-value-small">Exato: ${calculatedTotalPower.toFixed(9)} GH/s</small>
        </div>
        <div class="summary-item">
          <h4>📈 Diferença</h4>
          <p class="power-diff ${diffClass}">${Utils.formatPowerSigned(difference)}</p>
          <small class="power-value-small">${Math.abs(difference) < 1000 ? 'Precisão excelente!' : 'Pequena variação normal'}</small>
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
        <div class="info-box">
          <h4>ℹ️ Sobre a Diferença</h4>
          <p>Uma pequena diferença é normal devido a:</p>
          <ul>
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