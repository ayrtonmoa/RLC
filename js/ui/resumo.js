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
    // hamster_expedition_bonus_power NÃO entra aqui como termo separado, mesmo sendo um
    // campo à parte na API: o boost do hamster já vem embutido no `power` de cada miner em
    // roomData.miners (testado ao vivo — somar ele de novo aqui inflava "Poder Calculado"
    // pra ~145 Eh/s ACIMA do oficial, quase o valor exato do próprio bônus: contagem em
    // dobro). Só entra como termo separado em Utils.poderTemporario/poderSemTemporario, que
    // descontam de current_power (o total já fechado da API), não desta soma manual.
    const calculatedTotalPower = basePowerMinersFromRoom + bonusPowerFromApi + powerData.racks + powerData.games + powerData.temp;
    const hamsterBonus = powerData.hamster_expedition_bonus_power || 0;

    const totalApiEHS = Utils.formatPower(powerData.current_power * 1e9);
    const totalCalculadoEHS = Utils.formatPower(calculatedTotalPower * 1e9);
    const difference = (powerData.current_power - calculatedTotalPower) * 1e9;

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
      <div class="summary-grid summary-grid-2col">
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
      </div>

      <div class="summary-item power-liga-box">
        <h4>🏆 Poder sem Temporário</h4>
        <p class="power-value-main">${Utils.formatPower(Utils.poderSemTemporario(powerData) * 1e9)}</p>
        <!-- "Aproximado", não "Exato" como os cards acima: os dois de cima são reconstrução
             fiel de campos que a própria API devolve. Este é current_power menos temp e
             hamster_expedition_bonus_power — matematicamente correto, mas testado contra o
             jogo com ~0.09% de resíduo (a mesma margem do max_power não acompanhar em tempo
             real), então não é a mesma garantia de exatidão dos outros dois. -->
        <small class="power-value-small">Aproximado: ${Utils.poderSemTemporario(powerData).toFixed(9)} GH/s</small>
        <p class="power-liga-nota">
          Este é o poder que você <strong>sustenta de verdade</strong>: o total menos o temporário, que expira.
          É o número que importa pra liga, porque o <strong>poder temporário não promove</strong>.
          ${Utils.poderTemporario(powerData) > 0
            ? `Hoje o seu total é ${Utils.formatPower(powerData.current_power * 1e9)}, mas ${Utils.formatPower(Utils.poderTemporario(powerData) * 1e9)} disso é temporário (boost + expedição do hamster).`
            : 'No momento você não tem poder temporário ativo, então ele é igual ao total.'}
        </p>
        <!-- Usa Utils.poderSemTemporario(powerData), ou seja current_power - temporário — e
             NÃO calculatedTotalPower - temporário. Cheguei a usar calculatedTotalPower (o
             número "rápido" que não espera o servidor recalcular após instalar/trocar uma
             miner), mas isso quebrou: o boost do hamster já vem embutido dentro do "power"
             de cada miner em roomData.miners (ver nota em calculatedTotalPower acima), então
             subtrair o valor do hamster de novo aqui virava contagem dupla NA DIREÇÃO
             CONTRÁRIA — testado ao vivo, "Sem Temporário" ficava idêntico ao total (não
             descontava nada de verdade). current_power é o total já fechado pela API — dele
             sim dá pra descontar temp+hamster de forma limpa, sem ambiguidade sobre onde
             cada termo já está embutido.

             O aviso abaixo só aparece se a diferença for RELEVANTE (mais de 0.01% do total)
             — um limiar em Hz absoluto (o antigo, maior que 1000) sempre dispara em contas
             grandes, porque somar ~70 valores que a própria API já arredonda individualmente
             sempre deixa um resíduo de ponto flutuante bem maior que 1000 Hz, mesmo sem nada
             ter mudado. Isso não é "servidor atrasado": é ruído estrutural de somar partes já
             truncadas. -->
        ${powerData.current_power && Math.abs(difference) / (powerData.current_power * 1e9) > 0.0001
          ? `<p class="power-liga-nota" style="opacity:.8;">⚠️ Difere ${Utils.formatPowerSigned(difference)} do "Poder Total (Oficial)" — normal logo após instalar/trocar uma miner, ou apenas o resíduo de somar várias partes que a API já arredonda cada uma por conta própria.</p>`
          : ''}
        ${powerData.max_power ? `
        <p class="power-liga-nota">
          Não confunda com o <strong>"Maximum power"</strong> que o jogo mostra (${Utils.formatPower(powerData.max_power * 1e9)}):
          aquilo é uma <strong>marca d'água do maior poder já registrado</strong> — só sobe, e não desce quando você tira miner.
        </p>` : ''}
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
        ${hamsterBonus > 0 ? `
        <div class="summary-item">
          <strong>Expedição do Hamster:</strong><br>
          ${Utils.formatPower(hamsterBonus * 1e9)}<br>
          <small>${hamsterBonus.toFixed(9)} GH/s — também temporário, campo separado de "Temporário"</small>
        </div>` : ''}
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