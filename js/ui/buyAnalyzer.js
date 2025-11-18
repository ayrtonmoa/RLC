// js/ui/buyAnalyzer.js - VERSÃO MELHORADA COM SIMULAÇÃO

const UI_BuyAnalyzer = {
  mostrar(user) {
    const div = document.getElementById('buyanalyzer');
    div.innerHTML = `
      <h2>Buy Analyzer & Power Simulator</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h4>💡 Como Usar</h4>
        <p>Cole os dados de qualquer miner do marketplace e veja o impacto no seu poder. O campo de <strong>preço é opcional</strong> - deixe em branco para apenas simular o ganho de power.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div class="summary-item">
          <h4>📝 Informações da Miner</h4>
          <div style="margin-bottom: 15px;">
            <label for="minerName" style="display: block; margin-bottom: 5px;"><strong>Nome da Miner:</strong></label>
            <input type="text" id="minerName" placeholder="Ex: Rare Mega Maner" style="width: 100%;">
          </div>
          <div style="margin-bottom: 15px;">
            <label for="minerPower" style="display: block; margin-bottom: 5px;"><strong>Power (cole exato do site):</strong></label>
            <input type="text" id="minerPower" placeholder="Ex: 899 430 Gh/s" style="width: 100%;">
          </div>
          <div style="margin-bottom: 15px;">
            <label for="minerBonus" style="display: block; margin-bottom: 5px;"><strong>Bonus (%):</strong></label>
            <input type="text" id="minerBonus" placeholder="Ex: 0.96%" style="width: 100%;">
          </div>
          <div style="margin-bottom: 15px;">
            <label for="minerPrice" style="display: block; margin-bottom: 5px;"><strong>Preço em RLT (opcional):</strong></label>
            <input type="text" id="minerPrice" placeholder="Ex: 2.31 (deixe vazio para simular)" style="width: 100%;">
            <small style="color: #666; font-size: 11px;">💡 Deixe em branco para apenas calcular ganho de power</small>
          </div>
        </div>

        <div class="summary-item">
          <h4>📊 Seus Dados Atuais</h4>
          <p><strong>Poder Total:</strong> ${Utils.formatPower(user.powerData.current_power * 1e9)}</p>
          <p><strong>Base de Miners:</strong> ${Utils.formatPower((user.roomData.miners.reduce((sum, m) => sum + m.power, 0)) * 1e9)}</p>
          <p><strong>Bônus Atual:</strong> ${((user.powerData.bonus_percent / 100).toFixed(2))}%</p>
          <p><strong>Rack Bonus:</strong> ${Utils.formatPower(user.powerData.racks * 1e9)}</p>
          <div style="margin-top: 15px;">
            <button onclick="UI_BuyAnalyzer.analisar()" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold;">🎯 Analisar / Simular</button>
          </div>
        </div>
      </div>

      <div id="resultadoAnalise" style="display: none;"></div>
    `;
  },

  analisar() {
    const userData = State.getUserData();
    if (!userData) {
      alert('Por favor, faça a análise do seu perfil primeiro na aba "Resumo".');
      return;
    }

    const nome = document.getElementById('minerName').value.trim();
    const powerText = document.getElementById('minerPower').value.trim();
    const bonusText = document.getElementById('minerBonus').value.trim();
    const precoText = document.getElementById('minerPrice').value.trim();
    
    const resultDiv = document.getElementById('resultadoAnalise');
    
    // Validação - agora preço é opcional
    if (!nome || !powerText || !bonusText) {
      resultDiv.innerHTML = `
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
          <h4>❌ Erro</h4>
          <p>Por favor, preencha: <strong>Nome, Power e Bonus</strong>.</p>
          <p><small>O campo de preço é opcional.</small></p>
        </div>
      `;
      resultDiv.style.display = 'block';
      return;
    }

    try {
      // Parse dos valores
      const power = Utils.parsePowerText(powerText);
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
      let html = `
        <div class="summary-item" style="border-left: 4px solid ${temPreco ? '#2196F3' : '#9C27B0'};">
          <h4>${temPreco ? '🎯 Análise de Compra' : '⚡ Simulação de Power'}</h4>
          <h3 style="margin: 10px 0; color: #2196F3;">${nome}</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div>
              <h4>📈 Impacto no Seu Perfil</h4>
              <p><strong>Ganho Real:</strong> <span style="color: #4CAF50; font-size: 18px;">+${Utils.formatPower(ganhoReal * 1e9)}</span></p>
              <p><strong>Poder Atual:</strong> ${Utils.formatPower(poderTotalAtual * 1e9)}</p>
              <p><strong>Novo Poder Total:</strong> ${Utils.formatPower(novoPoderTotal * 1e9)}</p>
              <p><strong>Aumento:</strong> <span style="color: #4CAF50; font-weight: bold;">+${aumentoPercentual}%</span></p>
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
              <p><strong>Novo Bônus Total:</strong> <span style="color: #4CAF50;">${(novoBonusPercentual * 100).toFixed(2)}%</span></p>
            </div>
          </div>
      `;

      // Recomendação
      html += `
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <h4>💡 ${temPreco ? 'Recomendação' : 'Análise'}</h4>
            ${temPreco ? this.getRecomendacao(ganhoReal / preco, aumentoPercentual) : this.getRecomendacaoSemPreco(aumentoPercentual)}
          </div>
        </div>
      `;

      resultDiv.innerHTML = html;

    } catch (error) {
      resultDiv.innerHTML = `
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
          <h4>❌ Erro no Processamento</h4>
          <p><strong>Erro:</strong> ${error.message}</p>
        </div>
      `;
    }

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth' });
  },
  
  getRecomendacao(roi, aumentoPercent) {
    if (roi > 10000) {
      return `<p style="color: green; font-weight: bold;">🟢 COMPRA EXCELENTE! Esta miner oferece um ROI muito alto (${Utils.formatPower(roi * 1e9)}/RLT) e aumenta seu poder em ${aumentoPercent}%.</p>`;
    } else if (roi > 5000) {
      return `<p style="color: orange; font-weight: bold;">🟡 BOA COMPRA! ROI positivo de ${Utils.formatPower(roi * 1e9)}/RLT, aumentando seu poder em ${aumentoPercent}%.</p>`;
    } else if (roi > 1000) {
      return `<p style="color: orange;">🟡 COMPRA OK. ROI baixo (${Utils.formatPower(roi * 1e9)}/RLT), mas ainda positivo. Aumento de ${aumentoPercent}%.</p>`;
    } else {
      return `<p style="color: red; font-weight: bold;">🔴 NÃO RECOMENDADO. ROI muito baixo (${Utils.formatPower(roi * 1e9)}/RLT). Procure outras opções que ofereçam melhor custo-benefício.</p>`;
    }
  },

  getRecomendacaoSemPreco(aumentoPercent) {
    const aumento = parseFloat(aumentoPercent);
    
    if (aumento > 5) {
      return `<p style="color: green; font-weight: bold;">🟢 GRANDE IMPACTO! Esta miner aumentaria seu poder em ${aumentoPercent}%, um ganho significativo.</p>`;
    } else if (aumento > 2) {
      return `<p style="color: orange; font-weight: bold;">🟡 BOM IMPACTO! Aumento de ${aumentoPercent}% no seu poder total.</p>`;
    } else if (aumento > 0.5) {
      return `<p style="color: orange;">🟡 IMPACTO MODERADO. Aumento de ${aumentoPercent}%. Considere outras opções se busca maior impacto.</p>`;
    } else {
      return `<p style="color: red;">🔴 BAIXO IMPACTO. Apenas ${aumentoPercent}% de aumento. Esta miner tem impacto limitado no seu setup atual.</p>`;
    }
  }
};

window.UI_BuyAnalyzer = UI_BuyAnalyzer;