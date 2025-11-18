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

    if (abs >= 1e18) return (abs / 1e18).toFixed(3) + " Eh/s";
    if (abs >= 1e15) return (abs / 1e15).toFixed(3) + " Ph/s";
    if (abs >= 1e12) return (abs / 1e12).toFixed(3) + " Th/s";
    if (abs >= 1e9)  return (abs / 1e9).toFixed(3) + " Gh/s";
    if (abs >= 1e6)  return (abs / 1e6).toFixed(3) + " Mh/s";
    return abs.toFixed(3) + " H/s";
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