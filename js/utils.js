// js/utils.js - Funções Utilitárias (TESTE)

console.log('🔧 Carregando Utils...');

const Utils = {
  /**
   * Formata valores de power para unidades legíveis
   */
  formatPower(value) {
    value = Number(value) || 0;
    const abs = Math.abs(value);
    if (abs === 0) return "0 H/s";

    // Faltavam Zh/s e Yh/s: contas grandes ficavam presas em "1025.648 Eh/s" em vez de
    // rolar pra "1.026 Zh/s" como o próprio jogo mostra — não é sobre escolher a unidade
    // do jogador, é que a escala simplesmente não subia mais alto que Eh/s.
    if (abs >= 1e24) return (abs / 1e24).toFixed(3) + " Yh/s";
    if (abs >= 1e21) return (abs / 1e21).toFixed(3) + " Zh/s";
    if (abs >= 1e18) return (abs / 1e18).toFixed(3) + " Eh/s";
    if (abs >= 1e15) return (abs / 1e15).toFixed(3) + " Ph/s";
    if (abs >= 1e12) return (abs / 1e12).toFixed(3) + " Th/s";
    if (abs >= 1e9)  return (abs / 1e9).toFixed(3) + " Gh/s";
    if (abs >= 1e6)  return (abs / 1e6).toFixed(3) + " Mh/s";
    return abs.toFixed(3) + " H/s";
  },
  
  /**
   * Soma de TODO poder temporário da conta, em GH/s.
   *
   * `powerData.temp` NÃO é o único componente temporário — a API também expõe
   * `hamster_expedition_bonus_power` separado (o boost do hamster/"Battery" do jogo), que
   * NÃO entra em `temp`. Numa conta real, `temp` estava em 0.22 Eh/s (desprezível) enquanto
   * `hamster_expedition_bonus_power` estava em 145.4 Eh/s — ignorar esse campo fazia
   * "Poder sem Temporário" mostrar praticamente o total (1.244 Zh/s) quando o jogo, na
   * barra de progresso de liga, mostrava 1.098 Zh/s: 146 Eh/s de diferença, grande o
   * suficiente pra passar a impressão errada de estar mais perto da próxima liga do que
   * está de verdade. Se a API adicionar mais fontes de boost temporário no futuro, é aqui
   * que entram.
   */
  poderTemporario(powerData) {
    if (!powerData) return 0;
    return (powerData.temp || 0) + (powerData.hamster_expedition_bonus_power || 0);
  },

  /**
   * Poder permanente, em GH/s: o total menos TODO poder temporário (ver poderTemporario) —
   * boosters, eventos, expedição do hamster. É o poder que você de fato sustenta e o único
   * que dá pra controlar montando a sala.
   *
   * NÃO confundir com o `max_power` da API (o "Maximum power" do jogo): aquele é uma
   * marca d'água do maior poder já registrado — só sobe, nunca desce quando você tira
   * miner. Por isso ele não serve pra responder "quanto eu tenho agora sem o boost":
   * numa conta real o permanente estava em 553.961 e o max_power em 553.554, porque o
   * pico ainda não tinha alcançado.
   *
   * Centralizado aqui pra Resumo, SmartRoom e Inventário não divergirem entre si.
   */
  poderSemTemporario(powerData) {
    if (!powerData) return 0;
    return (powerData.current_power || 0) - this.poderTemporario(powerData);
  },

  /**
   * Formata valores de power com sinal (+/-)
   */
  formatPowerSigned(value) {
    value = Number(value) || 0;
    const sign = value < 0 ? "- " : "+ ";
    const abs = Math.abs(value);
    return sign + this.formatPower(abs);
  },
  
  /**
   * Atualiza barra de progresso
   */
  updateProgress(percent, message) {
    const progressDiv = document.getElementById('progress');
    const progressBar = document.getElementById('progress-bar');
    const status = document.getElementById('status');
    
    if (progressDiv) progressDiv.style.display = 'block';
    if (progressBar) progressBar.style.width = percent + '%';
    if (status) status.textContent = message;
  },
  
  /**
   * Esconde barra de progresso
   */
  hideProgress() {
    const progressDiv = document.getElementById('progress');
    if (progressDiv) {
      progressDiv.style.display = 'none';
    }
  },
  
  /**
   * Mostra notificação temporária
   */
  mostrarNotificacao(mensagem, tipo = 'info') {
    const cores = {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#007bff'
    };
    
    const cor = cores[tipo] || cores.info;
    
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
      position: fixed; 
      top: 20px; 
      right: 20px; 
      background: ${cor}; 
      color: white; 
      padding: 15px 20px; 
      border-radius: 5px; 
      z-index: 2000; 
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    notificacao.textContent = mensagem;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
      if (notificacao.parentNode) {
        notificacao.parentNode.removeChild(notificacao);
      }
    }, 4000);
  },
  
  /**
   * Fecha modal
   */
  fecharModal() {
    const modals = ['genericModal', 'simulationModal'];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (modal) modal.remove();
    });
  },
  
  /**
   * Exporta dados para CSV
   */
  exportarCSV(data, filename) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },
  
  /**
   * Parse de power text do marketplace
   */
parsePowerText(powerText) {
  let power = 0;
  const powerClean = powerText.replace(/[^\d\s.,]/g, '').trim();
  
  // ✅ CORREÇÃO: Tratar separadores de milhares corretamente
  let numberStr = powerClean.replace(/\s/g, ''); // Remove espaços
  
  const temPonto = numberStr.includes('.');
  const temVirgula = numberStr.includes(',');
  const qtdPontos = (numberStr.match(/\./g) || []).length;
  const qtdVirgulas = (numberStr.match(/,/g) || []).length;
  
  // Se tem múltiplos pontos ou múltiplas vírgulas → são separadores de milhares
  if (qtdPontos > 1) {
    // "41.350.000" → "41350000"
    numberStr = numberStr.replace(/\./g, '');
  } else if (qtdVirgulas > 1) {
    // "41,350,000" → "41350000"
    numberStr = numberStr.replace(/,/g, '');
  } else if (temPonto && temVirgula) {
    // Ambos: último é decimal
    const ultimoPonto = numberStr.lastIndexOf('.');
    const ultimaVirgula = numberStr.lastIndexOf(',');
    
    if (ultimaVirgula > ultimoPonto) {
      // "1.234,56" → "1234.56"
      numberStr = numberStr.replace(/\./g, '').replace(',', '.');
    } else {
      // "1,234.56" → "1234.56"
      numberStr = numberStr.replace(/,/g, '');
    }
  } else if (temVirgula) {
    // Só vírgula: pode ser decimal OU milhar
    const partes = numberStr.split(',');
    if (partes.length === 2 && partes[1].length === 3 && partes[0].length > 3) {
      // "12345,000" → milhar
      numberStr = numberStr.replace(',', '');
    } else {
      // "3,14" → decimal
      numberStr = numberStr.replace(',', '.');
    }
  } else if (temPonto) {
    // Só ponto: pode ser decimal OU milhar
    const partes = numberStr.split('.');
    if (partes.length === 2 && partes[1].length === 3 && partes[0].length > 3) {
      // "12345.000" → milhar
      numberStr = numberStr.replace('.', '');
    }
    // Senão: "5.513" → mantém como decimal
  }
  
  const powerNumber = parseFloat(numberStr);
  
  if (!isNaN(powerNumber)) {
    power = powerNumber;
    const powerLower = powerText.toLowerCase();
    if (powerLower.includes('eh/s')) power *= 1000000000;
    else if (powerLower.includes('ph/s')) power *= 1000000;
    else if (powerLower.includes('th/s')) power *= 1000;
    else if (powerLower.includes('gh/s')) power *= 1;
    else if (powerLower.includes('mh/s')) power /= 1000;
  }
  
  return power;
},
  
  /**
   * Parse de bonus text
   */
  parseBonusText(bonusText) {
    return parseFloat(bonusText.replace(/[^\d.]/g, ''));
  }
};

// Exportar para escopo global
window.Utils = Utils;

console.log('✅ Utils carregado com sucesso!', Utils);