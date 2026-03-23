// js/ui/buyAnalyzer.js - VERSÃO MELHORADA COM SIMULAÇÃO

const UI_BuyAnalyzer = {
  mostrar(user) {
    const div = document.getElementById('buyanalyzer');
    div.innerHTML = `
      <h2>Buy Analyzer & Power Simulator</h2>
      
      <div class="info-box-green">
        <h4>💡 Como Usar</h4>
        <p>Cole os dados de qualquer miner do marketplace e veja o impacto no seu poder. O campo de <strong>preço é opcional</strong> - deixe em branco para apenas simular o ganho de power.</p>
      </div>

      <div class="analyzer-grid">
        <div class="summary-item">
          <h4>📝 Informações da Miner</h4>
          <div class="form-group">
            <label for="minerName" class="form-label">Nome da Miner:</label>
            <input type="text" id="minerName" placeholder="Ex: Rare Mega Maner" class="form-input">
          </div>
          <div class="form-group">
            <label for="minerPower" class="form-label">Power:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <input type="number" id="minerPower" placeholder="Ex: 899430" class="form-input" step="any">
              <select id="minerPowerUnit" class="form-input">
                <option value="1">Gh/s</option>
                <option value="1000">Th/s</option>
                <option value="1000000">Ph/s</option>
                <option value="1000000000">Eh/s</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="minerBonus" class="form-label">Bonus (%):</label>
            <input type="text" id="minerBonus" placeholder="Ex: 0.96%" class="form-input">
          </div>
          <div class="form-group">
            <label for="minerPrice" class="form-label">Preço em RLT (opcional):</label>
            <input type="text" id="minerPrice" placeholder="Ex: 2.31 (deixe vazio para simular)" class="form-input">
            <small class="form-hint">💡 Deixe em branco para apenas calcular ganho de power</small>
          </div>
        </div>

        <div class="summary-item">
          <h4>📊 Seus Dados Atuais</h4>
          <p><strong>Poder Total:</strong> ${Utils.formatPower(user.powerData.current_power * 1e9)}</p>
          <p><strong>Base de Miners:</strong> ${Utils.formatPower((user.roomData.miners.reduce((sum, m) => sum + m.power, 0)) * 1e9)}</p>
          <p><strong>Bônus Atual:</strong> ${((user.powerData.bonus_percent / 100).toFixed(2))}%</p>
          <p><strong>Rack Bonus:</strong> ${Utils.formatPower(user.powerData.racks * 1e9)}</p>
          <div class="form-group">
            <button onclick="UI_BuyAnalyzer.analisar()" class="btn-analyze">🎯 Analisar / Simular</button>
          </div>
        </div>
      </div>

      <div id="resultadoAnalise" class="hidden"></div>
    `;
  },

  analisar() {
    const userData = State.getUserData();
    if (!userData) {
      alert('Por favor, faça a análise do seu perfil primeiro na aba "Resumo".');
      return;
    }

    const nome = document.getElementById('minerName').value.trim();
    const powerValue = parseFloat(document.getElementById('minerPower').value);
    const powerUnit = parseFloat(document.getElementById('minerPowerUnit').value);
    const bonusText = document.getElementById('minerBonus').value.trim();
    const precoText = document.getElementById('minerPrice').value.trim();

    const resultDiv = document.getElementById('resultadoAnalise');

    // Validação - agora preço é opcional
    if (!nome || isNaN(powerValue) || !bonusText) {
      resultDiv.innerHTML = `
        <div class="info-box-red">
          <h4>❌ Erro</h4>
          <p>Por favor, preencha: <strong>Nome, Power e Bonus</strong>.</p>
          <p><small>O campo de preço é opcional.</small></p>
        </div>
      `;
      resultDiv.classList.remove('hidden');
      return;
    }

    try {
      // Parse dos valores
      const power = powerValue * powerUnit;
      const bonusNumber = Utils.parseBonusText(bonusText);
      
      // Preço é opcional
      const temPreco = precoText !== '';
      const preco = temPreco ? parseFloat(precoText.replace(/[^\d.]/g, '')) : null;

      if (isNaN(power) || isNaN(bonusNumber) || power <= 0) {
        throw new Error('Power ou Bonus inválidos');
      }

      if (temPreco && (isNaN(preco) || preco <= 0)) {
        throw new Error('Preço inválido');
      }

      // Calcular impacto
      const baseTotalAtual = userData.roomData.miners.reduce((sum, m) => sum + m.power, 0);
      const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
      const poderTotalAtual = userData.powerData.current_power;

      const novaBase = baseTotalAtual + power;
      const novoBonusPercentual = bonusPercentualAtual + (bonusNumber / 100);
      const novoBonusPower = novaBase * novoBonusPercentual;
      const novoPoderTotal = novaBase + novoBonusPower + userData.powerData.racks + userData.powerData.games + userData.powerData.temp;
      
      const ganhoReal = novoPoderTotal - poderTotalAtual;
      const aumentoPercentual = ((ganhoReal / poderTotalAtual) * 100).toFixed(2);

      // HTML base
      const analysisClass = temPreco ? 'analysis-price' : 'analysis-no-price';
      let html = `
        <div class="summary-item ${analysisClass}">
          <h4>${temPreco ? '🎯 Análise de Compra' : '⚡ Simulação de Power'}</h4>
          <h3 class="miner-title">${nome}</h3>
          
          <div class="results-grid">
            <div>
              <h4>📈 Impacto no Seu Perfil</h4>
              <p><strong>Ganho Real:</strong> <span class="value-positive">+${Utils.formatPower(ganhoReal * 1e9)}</span></p>
              <p><strong>Poder Atual:</strong> ${Utils.formatPower(poderTotalAtual * 1e9)}</p>
              <p><strong>Novo Poder Total:</strong> ${Utils.formatPower(novoPoderTotal * 1e9)}</p>
              <p><strong>Aumento:</strong> <span class="value-positive-bold">+${aumentoPercentual}%</span></p>
            </div>
      `;

      // Se tiver preço, adiciona análise financeira
      if (temPreco) {
        const roi = ganhoReal / preco;
        let roiClass, roiText, roiEmoji;
        
        if (roi > 10000) {
          roiClass = 'high-impact';
          roiText = 'Excelente';
          roiEmoji = '🟢';
        } else if (roi > 5000) {
          roiClass = 'medium-impact';
          roiText = 'Bom';
          roiEmoji = '🟡';
        } else if (roi > 1000) {
          roiClass = 'low-impact';
          roiText = 'OK';
          roiEmoji = '🟡';
        } else {
          roiClass = 'high-impact';
          roiText = 'Ruim';
          roiEmoji = '🔴';
        }

        html += `
            <div class="${roiClass}">
              <h4>💰 Análise Financeira</h4>
              <p><strong>Custo:</strong> ${preco.toFixed(2)} RLT</p>
              <p><strong>ROI:</strong> ${Utils.formatPower(roi * 1e9)} por RLT</p>
              <p><strong>Classificação:</strong> ${roiEmoji} <strong>${roiText}</strong></p>
              <p><strong>Custo por Gh/s:</strong> ${(preco / (ganhoReal * 1e9)).toFixed(8)} RLT/Gh/s</p>
            </div>
        `;
      }

      html += `
            <div>
              <h4>🔍 Detalhes da Miner</h4>
              <p><strong>Poder Base:</strong> ${Utils.formatPower(power * 1e9)}</p>
              <p><strong>Bônus Oferecido:</strong> +${bonusNumber.toFixed(2)}%</p>
              <p><strong>Bônus Atual:</strong> ${(bonusPercentualAtual * 100).toFixed(2)}%</p>
              <p><strong>Novo Bônus Total:</strong> <span class="value-positive-bold">${(novoBonusPercentual * 100).toFixed(2)}%</span></p>
            </div>
          </div>
      `;

      // Recomendação
      html += `
          <div class="recommendation-box">
            <h4>💡 ${temPreco ? 'Recomendação' : 'Análise'}</h4>
            ${temPreco ? this.getRecomendacao(ganhoReal / preco, aumentoPercentual) : this.getRecomendacaoSemPreco(aumentoPercentual)}
          </div>
        </div>
      `;

      resultDiv.innerHTML = html;

    } catch (error) {
      resultDiv.innerHTML = `
        <div class="info-box-red">
          <h4>❌ Erro no Processamento</h4>
          <p><strong>Erro:</strong> ${error.message}</p>
        </div>
      `;
    }

    resultDiv.classList.remove('hidden');
    resultDiv.scrollIntoView({ behavior: 'smooth' });
  },
  
  getRecomendacao(roi, aumentoPercent) {
    if (roi > 10000) {
      return `<p class="rec-excellent">🟢 COMPRA EXCELENTE! Esta miner oferece um ROI muito alto (${Utils.formatPower(roi * 1e9)}/RLT) e aumenta seu poder em ${aumentoPercent}%.</p>`;
    } else if (roi > 5000) {
      return `<p class="rec-good">🟡 BOA COMPRA! ROI positivo de ${Utils.formatPower(roi * 1e9)}/RLT, aumentando seu poder em ${aumentoPercent}%.</p>`;
    } else if (roi > 1000) {
      return `<p class="rec-ok">🟡 COMPRA OK. ROI baixo (${Utils.formatPower(roi * 1e9)}/RLT), mas ainda positivo. Aumento de ${aumentoPercent}%.</p>`;
    } else {
      return `<p class="rec-bad">🔴 NÃO RECOMENDADO. ROI muito baixo (${Utils.formatPower(roi * 1e9)}/RLT). Procure outras opções que ofereçam melhor custo-benefício.</p>`;
    }
  },

  getRecomendacaoSemPreco(aumentoPercent) {
    const aumento = parseFloat(aumentoPercent);
    
    if (aumento > 5) {
      return `<p class="rec-excellent">🟢 GRANDE IMPACTO! Esta miner aumentaria seu poder em ${aumentoPercent}%, um ganho significativo.</p>`;
    } else if (aumento > 2) {
      return `<p class="rec-good">🟡 BOM IMPACTO! Aumento de ${aumentoPercent}% no seu poder total.</p>`;
    } else if (aumento > 0.5) {
      return `<p class="rec-ok">🟡 IMPACTO MODERADO. Aumento de ${aumentoPercent}%. Considere outras opções se busca maior impacto.</p>`;
    } else {
      return `<p class="rec-bad">🔴 BAIXO IMPACTO. Apenas ${aumentoPercent}% de aumento. Esta miner tem impacto limitado no seu setup atual.</p>`;
    }
  }
};

window.UI_BuyAnalyzer = UI_BuyAnalyzer;
console.log('✅ UI_BuyAnalyzer loaded');