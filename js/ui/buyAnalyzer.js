// js/ui/buyAnalyzer.js - VERSÃO COMPLETA

const UI_BuyAnalyzer = {
  mostrar(user) {
    const div = document.getElementById('buyanalyzer');
    div.innerHTML = `
      <h2>Buy Analyzer</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h4>💡 Como Usar</h4>
        <p>Cole os dados de qualquer miner do marketplace abaixo e veja se é um bom negócio para o seu perfil específico.</p>
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
            <label for="minerPrice" style="display: block; margin-bottom: 5px;"><strong>Preço (RLT):</strong></label>
            <input type="text" id="minerPrice" placeholder="Ex: 2.31" style="width: 100%;">
          </div>
        </div>

        <div class="summary-item">
          <h4>📊 Seus Dados Atuais</h4>
          <p><strong>Poder Total:</strong> ${Utils.formatPower(user.powerData.current_power * 1e9)}</p>
          <p><strong>Base de Miners:</strong> ${Utils.formatPower((user.roomData.miners.reduce((sum, m) => sum + m.power, 0)) * 1e9)}</p>
          <p><strong>Bônus Atual:</strong> ${((user.powerData.bonus_percent / 100).toFixed(2))}%</p>
          <p><strong>Rack Bonus:</strong> ${Utils.formatPower(user.powerData.racks * 1e9)}</p>
          <div style="margin-top: 15px;">
            <button onclick="UI_BuyAnalyzer.analisar()" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold;">🎯 Analisar Compra</button>
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
    
    if (!nome || !powerText || !bonusText || !precoText) {
      resultDiv.innerHTML = `
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
          <h4>❌ Erro</h4>
          <p>Por favor, preencha todos os campos.</p>
        </div>
      `;
      resultDiv.style.display = 'block';
      return;
    }

    try {
      // Parse dos valores
      const power = Utils.parsePowerText(powerText);
      const bonusNumber = Utils.parseBonusText(bonusText);
      const preco = parseFloat(precoText.replace(/[^\d.]/g, ''));

      if (isNaN(power) || isNaN(bonusNumber) || isNaN(preco) || power <= 0 || preco <= 0) {
        throw new Error('Valores inválidos');
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
      const roi = ganhoReal / preco;

      let roiClass = 'low-impact';
      let roiText = 'Baixo';
      let roiEmoji = '🟡';
      
      if (roi > 10000) {
        roiClass = 'high-impact';
        roiText = 'Excelente';
        roiEmoji = '🟢';
      } else if (roi > 5000) {
        roiClass = 'medium-impact';
        roiText = 'Bom';
        roiEmoji = '🟡';
      } else if (roi < 1000) {
        roiClass = 'high-impact';
        roiText = 'Ruim';
        roiEmoji = '🔴';
      }

      resultDiv.innerHTML = `
        <div class="summary-item ${roiClass}" style="border-left: 4px solid #2196F3;">
          <h4>🎯 Resultado da Análise</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div>
              <h4>📈 Impacto no Seu Perfil</h4>
              <p><strong>Ganho Real:</strong> +${Utils.formatPower(ganhoReal * 1e9)}</p>
              <p><strong>Novo Poder Total:</strong> ${Utils.formatPower(novoPoderTotal * 1e9)}</p>
              <p><strong>Aumento:</strong> +${((ganhoReal / poderTotalAtual) * 100).toFixed(2)}%</p>
            </div>
            <div>
              <h4>💰 Análise Financeira</h4>
              <p><strong>ROI:</strong> ${Utils.formatPower(roi * 1e9)} por RLT</p>
              <p><strong>Classificação:</strong> ${roiEmoji} ${roiText}</p>
              <p><strong>Custo:</strong> ${preco.toFixed(2)} RLT</p>
            </div>
            <div>
              <h4>🔍 Detalhes</h4>
              <p><strong>Poder Base:</strong> ${Utils.formatPower(power * 1e9)}</p>
              <p><strong>Bônus Oferecido:</strong> +${bonusNumber.toFixed(2)}%</p>
              <p><strong>Novo Bônus Total:</strong> ${(novoBonusPercentual * 100).toFixed(2)}%</p>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <h4>💡 Recomendação</h4>
            ${this.getRecomendacao(roi)}
          </div>
        </div>
      `;

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
  
  getRecomendacao(roi) {
    if (roi > 10000) {
      return '<p style="color: green; font-weight: bold;">🟢 COMPRA EXCELENTE! Esta miner oferece um ROI muito alto para o seu perfil.</p>';
    } else if (roi > 5000) {
      return '<p style="color: orange; font-weight: bold;">🟡 BOA COMPRA! ROI positivo, vale a pena considerar.</p>';
    } else if (roi > 1000) {
      return '<p style="color: orange;">🟡 COMPRA OK. ROI baixo, mas ainda positivo.</p>';
    } else {
      return '<p style="color: red; font-weight: bold;">🔴 NÃO RECOMENDADO. ROI muito baixo, procure outras opções.</p>';
    }
  }
};

window.UI_BuyAnalyzer = UI_BuyAnalyzer;