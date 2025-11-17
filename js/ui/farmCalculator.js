// js/ui/farmCalculator.js - Calculadora de Farming Completa

const UI_FarmCalculator = {
  // Estado interno
  state: {
    miningPower: '',
    networkData: '',
    results: null,
    prices: {},
    loading: false,
    useBRL: false,
    showQuantity: false,
    usdToBrl: 5.0,
    history: [],
    lastUpdate: null,
    showHistory: false,
    priceStatus: 'loading',
    chartInstance: null
  },

  // Configurações
  CONFIG: {
    BLOCKS_PER_DAY: 144.9664,
    GAME_COINS: ['RLT', 'RST', 'HMT'],
    FIXED_PRICES: {
      RLT: 1.00,
      RST: 0.01,
      HMT: 1.00
    },
    BLOCK_REWARDS: {
      RLT: 3.06858,
      RST: 189,
      HMT: 2430,
      BTC: 0.00002179,
      LTC: 0.01081,
      BNB: 0.00231,
      POL: 6.923,
      XRP: 0.679,
      DOGE: 14.889,
      ETH: 0.000842,
      TRX: 18.732,
      SOL: 0.04138,
      ALGO: 8.600969
    }
  },

  // Inicialização
  init() {
    this.loadFromStorage();
    this.fetchPrices();
    setInterval(() => this.fetchPrices(), 5 * 60 * 1000);
  },

  // NÃO carregar NEM salvar o power no localStorage
  loadFromStorage() {
    try {
      const savedNetwork = localStorage.getItem('farm_network_data');
      const savedHistory = localStorage.getItem('farm_mining_history');
      
      if (savedNetwork) this.state.networkData = savedNetwork;
      if (savedHistory) this.state.history = JSON.parse(savedHistory);
      // NÃO carregar o power!
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  },

  // Salvar dados no localStorage
  saveToStorage(power, network, result) {
    try {
      localStorage.setItem('farm_mining_power', power);
      localStorage.setItem('farm_network_data', network);
      
      const newEntry = {
        timestamp: new Date().toISOString(),
        power: parseFloat(power),
        networkTotal: Object.values(this.parseNetworkData(network)).reduce((sum, v) => sum + v, 0),
        results: result
      };
      
      const newHistory = [newEntry, ...this.state.history].slice(0, 30);
      this.state.history = newHistory;
      localStorage.setItem('farm_mining_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Erro ao salvar dados:', e);
    }
  },

  // Buscar preços das cryptos
  async fetchPrices() {
    const fallback = {
      BTC: 95000, ETH: 3500, BNB: 600, SOL: 180,
      XRP: 2.5, DOGE: 0.35, TRX: 0.25, LTC: 100,
      POL: 0.85, ALGO: 0.35
    };

    this.state.priceStatus = 'loading';
    this.render();

    try {
      const symbols = 'BTC,ETH,BNB,SOL,XRP,DOGE,TRX,LTC,POL,ALGO';
      const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD`;
      
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        this.state.prices = {
          BTC: data.BTC?.USD || fallback.BTC,
          ETH: data.ETH?.USD || fallback.ETH,
          BNB: data.BNB?.USD || fallback.BNB,
          SOL: data.SOL?.USD || fallback.SOL,
          XRP: data.XRP?.USD || fallback.XRP,
          DOGE: data.DOGE?.USD || fallback.DOGE,
          TRX: data.TRX?.USD || fallback.TRX,
          LTC: data.LTC?.USD || fallback.LTC,
          POL: data.POL?.USD || fallback.POL,
          ALGO: data.ALGO?.USD || fallback.ALGO
        };
        this.state.lastUpdate = new Date();
        this.state.priceStatus = 'success';
      } else {
        this.state.prices = fallback;
        this.state.priceStatus = 'fallback';
      }
      
      try {
        const brlRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (brlRes.ok) {
          const brlData = await brlRes.json();
          this.state.usdToBrl = brlData.rates.BRL || 5.0;
        }
      } catch {}
      
    } catch (error) {
      console.error('Erro:', error);
      this.state.prices = fallback;
      this.state.priceStatus = 'fallback';
    }

    this.render();
  },

  // Parser de dados da rede
  parseNetworkData(text) {
    const network = {};
    const regex = /([a-z]+)\s+([A-Z]+)\s+([\d.]+)\s+Zh\/s/gi;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const symbol = match[2];
      const value = parseFloat(match[3]);
      network[symbol] = value * 1000;
    }
    
    return network;
  },

  // Cálculo principal
  calculate() {
    const { miningPower, networkData } = this.state;
    
    if (!miningPower || !networkData) {
      alert('Preencha todos os campos!');
      return;
    }

    this.state.loading = true;
    this.render();
    
    const myPowerEh = parseFloat(miningPower);
    const network = this.parseNetworkData(networkData);
    
    const blocksPerDay = this.CONFIG.BLOCKS_PER_DAY;
    const blocksPerWeek = blocksPerDay * 7;
    const blocksPerMonth = blocksPerDay * 30;
    
    const calculations = [];
    
    Object.keys(this.CONFIG.BLOCK_REWARDS).forEach(coin => {
      if (!network[coin]) return;
      
      const networkPowerEh = network[coin];
      const contribution = (myPowerEh / networkPowerEh) * 100;
      const blockReward = this.CONFIG.BLOCK_REWARDS[coin];
      const myRewardPerBlock = (contribution / 100) * blockReward;
      
      const isGameCoin = this.CONFIG.GAME_COINS.includes(coin);
      const price = this.CONFIG.FIXED_PRICES[coin] || this.state.prices[coin] || 0;
      
      calculations.push({
        coin,
        isGameCoin,
        contribution: contribution.toFixed(4),
        block: isGameCoin ? myRewardPerBlock : myRewardPerBlock * price,
        daily: isGameCoin ? myRewardPerBlock * blocksPerDay : myRewardPerBlock * blocksPerDay * price,
        weekly: isGameCoin ? myRewardPerBlock * blocksPerWeek : myRewardPerBlock * blocksPerWeek * price,
        monthly: isGameCoin ? myRewardPerBlock * blocksPerMonth : myRewardPerBlock * blocksPerMonth * price,
        blockQty: myRewardPerBlock,
        dailyQty: myRewardPerBlock * blocksPerDay,
        weeklyQty: myRewardPerBlock * blocksPerWeek,
        monthlyQty: myRewardPerBlock * blocksPerMonth
      });
    });
    
    calculations.sort((a, b) => b.monthly - a.monthly);
    
    this.state.results = calculations;
    this.saveToStorage(miningPower, networkData, calculations);
    this.state.loading = false;
    
    this.render();
    this.renderChart();
  },

  // Formatar valores
  formatValue(valueUSD, valueQty, isCrypto, coin, period = 'monthly') {
    if (this.state.showQuantity) {
      if (isCrypto) {
        const decimals = period === 'block' ? 8 : 4;
        return `${valueQty.toFixed(decimals)} ${coin}`;
      } else {
        return `${valueQty.toFixed(2)} ${coin}`;
      }
    }
    
    if (isCrypto) {
      const decimals = period === 'block' ? 4 : 2;
      if (this.state.useBRL) {
        return `R$ ${(valueUSD * this.state.usdToBrl).toFixed(decimals)}`;
      } else {
        return `$${valueUSD.toFixed(decimals)}`;
      }
    }
    
    return `${valueQty.toFixed(2)} ${coin}`;
  },

  // Obter linha de total
  getTotalRow() {
    if (!this.state.results) return null;
    const cryptoOnly = this.state.results.filter(r => !r.isGameCoin);
    return {
      block: cryptoOnly.reduce((sum, r) => sum + r.block, 0),
      daily: cryptoOnly.reduce((sum, r) => sum + r.daily, 0),
      weekly: cryptoOnly.reduce((sum, r) => sum + r.weekly, 0),
      monthly: cryptoOnly.reduce((sum, r) => sum + r.monthly, 0)
    };
  },

  // Obter comparação com histórico
  getComparison() {
    if (this.state.history.length < 2) return null;
    
    const current = this.state.history[0];
    const previous = this.state.history[1];
    
    const powerChange = ((current.power - previous.power) / previous.power) * 100;
    const networkChange = ((current.networkTotal - previous.networkTotal) / previous.networkTotal) * 100;
    
    const currentBest = current.results?.find(r => !this.CONFIG.GAME_COINS.includes(r.coin));
    const previousBest = previous.results?.find(r => !this.CONFIG.GAME_COINS.includes(r.coin));
    
    const currentBestProfit = currentBest?.monthly || 0;
    const previousBestProfit = previousBest?.monthly || 0;
    
    const profitChange = previousBestProfit > 0 
      ? ((currentBestProfit - previousBestProfit) / previousBestProfit) * 100 
      : 0;
    
    return {
      powerChange,
      networkChange,
      profitChange,
      powerDiff: current.power - previous.power,
      networkDiff: current.networkTotal - previous.networkTotal,
      profitDiff: currentBestProfit - previousBestProfit,
      currentBestCoin: currentBest?.coin,
      previousBestCoin: previousBest?.coin
    };
  },

  // Formatar data
  formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Tempo atrás
  getTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  },

  // Renderizar gráfico
  renderChart() {
    if (this.state.history.length < 2) return;
    
    const canvas = document.getElementById('farmChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (this.state.chartInstance) {
      this.state.chartInstance.destroy();
    }
    
    const labels = this.state.history.slice(0, 10).reverse().map(h => this.formatDate(h.timestamp));
    const powerData = this.state.history.slice(0, 10).reverse().map(h => h.power);
    const networkData = this.state.history.slice(0, 10).reverse().map(h => h.networkTotal / 1000);
    
    this.state.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Meu Power (Eh/s)',
            data: powerData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Rede Total (Zh/s)',
            data: networkData,
            borderColor: '#6f42c1',
            backgroundColor: 'rgba(111, 66, 193, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: { color: '#333' }
          },
          title: {
            display: true,
            text: '📈 Evolução do Poder',
            color: '#333',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { color: '#007bff' },
            grid: { color: 'rgba(0, 123, 255, 0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: { color: '#6f42c1' },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: '#333' },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          }
        }
      }
    });
  },

  // Limpar histórico
  clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      this.state.history = [];
      localStorage.removeItem('farm_mining_history');
      this.render();
    }
  },

  // Exportar CSV
  exportCSV() {
    if (!this.state.results) return;
    
    const csvContent = [
      ['Moeda', 'Tipo', 'Contribuição %', 'Por Bloco', 'Diário', 'Semanal', 'Mensal'],
      ...this.state.results.map(r => [
        r.coin,
        r.isGameCoin ? 'Game' : 'Crypto',
        r.contribution + '%',
        this.state.showQuantity ? `${r.blockQty.toFixed(8)} ${r.coin}` : (r.isGameCoin ? r.blockQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.block * this.state.usdToBrl).toFixed(4)}` : `$${r.block.toFixed(4)}`)),
        this.state.showQuantity ? `${r.dailyQty.toFixed(4)} ${r.coin}` : (r.isGameCoin ? r.dailyQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.daily * this.state.usdToBrl).toFixed(2)}` : `$${r.daily.toFixed(2)}`)),
        this.state.showQuantity ? `${r.weeklyQty.toFixed(4)} ${r.coin}` : (r.isGameCoin ? r.weeklyQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.weekly * this.state.usdToBrl).toFixed(2)}` : `$${r.weekly.toFixed(2)}`)),
        this.state.showQuantity ? `${r.monthlyQty.toFixed(4)} ${r.coin}` : (r.isGameCoin ? r.monthlyQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.monthly * this.state.usdToBrl).toFixed(2)}` : `$${r.monthly.toFixed(2)}`))
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mining-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },


  // Função principal de renderização - SEM CAMPO EXTRA
  render() {
    const container = document.getElementById('farmcalculator');
    if (!container) return;

    let html = '<h2>⚡ Farm Calculator</h2>';

    // Seção de Input
    html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">';
    
    // Campo Mining Power - APENAS O INPUT
    html += '<div>';
    html += '<label style="font-weight: 600; margin-bottom: 8px; display: block;">Mining Power (Eh):</label>';
    html += `<input type="text" id="farmMiningPower" value="${this.state.miningPower}" placeholder="Ex 10.115" style="width: 100%;">`;
    html += '</div>';
    
    // Info + Botão
    html += '<div>';
    html += `<label style="font-weight: 600; margin-bottom: 8px; display: block;">📊 Blocos/dia: <strong>${this.CONFIG.BLOCKS_PER_DAY}</strong></label>`;
    html += '<button onclick="UI_FarmCalculator.calculate()" style="width: 100%; margin-top: 8px;">💰 Calcular</button>';
    html += '</div>';
    
    html += '</div>';
    
    // Campo Network Data
    html += '<div>';
    html += '<label style="font-weight: 600; margin-bottom: 8px; display: block;">Rede das moedas:</label>';
    html += `<textarea id="farmNetworkData" rows="3" placeholder="Total 59.869 Zh/s  rlt RLT 2.823 Zh/s rst RST 1.471 Zh/s..." style="width: 100%; font-family: monospace; font-size: 14px;">${this.state.networkData}</textarea>`;
    html += '</div>';
    
    html += '</div>';

    // Comparação com histórico
    const comparison = this.getComparison();
    if (comparison) {
      html += '<div style="background: #e8f4f8; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 20px;">';
      html += '<h4 style="margin: 0 0 10px 0;">📊 Comparado com última pesquisa:</h4>';
      html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">';
      
      html += '<div>';
      html += '<div style="font-size: 12px; color: #666;">Rede Total</div>';
      html += `<div style="font-size: 18px; color: #6f42c1; font-weight: bold;">${comparison.networkDiff > 0 ? '+' : ''}${comparison.networkDiff.toFixed(3)} Zh/s</div>`;
      html += `<div style="font-size: 13px; color: ${comparison.networkChange > 0 ? 'green' : comparison.networkChange < 0 ? 'red' : '#666'};">${comparison.networkChange > 0 ? '↑' : comparison.networkChange < 0 ? '↓' : '→'} ${comparison.networkChange.toFixed(2)}%</div>`;
      html += '</div>';
      
      html += '<div>';
      html += '<div style="font-size: 12px; color: #666;">Meu Power</div>';
      html += `<div style="font-size: 18px; color: #007bff; font-weight: bold;">${comparison.powerDiff > 0 ? '+' : ''}${comparison.powerDiff.toFixed(3)} Eh/s</div>`;
      html += `<div style="font-size: 13px; color: ${comparison.powerChange > 0 ? 'green' : comparison.powerChange < 0 ? 'red' : '#666'};">${comparison.powerChange > 0 ? '↑' : comparison.powerChange < 0 ? '↓' : '→'} ${comparison.powerChange.toFixed(2)}%</div>`;
      html += '</div>';
      
      html += '<div>';
      html += `<div style="font-size: 12px; color: #666;">Melhor Crypto (${comparison.currentBestCoin})</div>`;
      html += `<div style="font-size: 18px; color: #28a745; font-weight: bold;">${comparison.profitDiff > 0 ? '+' : ''}${this.state.useBRL ? `R$ ${(comparison.profitDiff * this.state.usdToBrl).toFixed(2)}` : `$${comparison.profitDiff.toFixed(2)}`}/mês</div>`;
      html += `<div style="font-size: 13px; color: ${comparison.profitChange > 0 ? 'green' : comparison.profitChange < 0 ? 'red' : '#666'};">${comparison.profitChange > 0 ? '↑' : comparison.profitChange < 0 ? '↓' : '→'} ${comparison.profitChange.toFixed(2)}%</div>`;
      if (comparison.currentBestCoin !== comparison.previousBestCoin) {
        html += `<div style="font-size: 11px; color: #ff9800; margin-top: 4px;">⚠️ Antes era ${comparison.previousBestCoin}</div>`;
      }
      html += '</div>';
      
      html += '</div>';
      html += '</div>';
    }

    // Melhor Crypto
    if (this.state.results) {
      const bestCrypto = this.state.results.find(r => !r.isGameCoin);
      if (bestCrypto) {
        html += '<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 20px;">';
        html += '<h3 style="margin: 0 0 15px 0;">🏆 Melhor Crypto para Farmar</h3>';
        html += '<div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #ffc107;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 4px;">🎯 Recomendação</div>';
        html += `<div style="font-size: 24px; color: #ff9800; font-weight: bold;">${bestCrypto.coin} <span style="background: #e3f2fd; color: #007bff; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Crypto</span></div>`;
        html += `<div style="font-size: 13px; color: #666; margin-top: 8px;">💡 Esta é a crypto mais lucrativa com sua contribuição de <strong>${bestCrypto.contribution}%</strong></div>`;
        html += '</div>';
        
        html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">';
        html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Diário</div>';
        html += `<div style="font-size: 20px; color: #ff9800; font-weight: bold;">${this.state.showQuantity ? `${bestCrypto.dailyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useBRL ? `R$ ${(bestCrypto.daily * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.daily.toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Mensal (30D)</div>';
        html += `<div style="font-size: 20px; color: #ff9800; font-weight: bold;">${this.state.showQuantity ? `${bestCrypto.monthlyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useBRL ? `R$ ${(bestCrypto.monthly * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.monthly.toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Anual (365D)</div>';
        html += `<div style="font-size: 20px; color: #ff9800; font-weight: bold;">${this.state.showQuantity ? `${(bestCrypto.monthlyQty * 12).toFixed(4)} ${bestCrypto.coin}` : (this.state.useBRL ? `R$ ${(bestCrypto.monthly * 12 * this.state.usdToBrl).toFixed(2)}` : `$${(bestCrypto.monthly * 12).toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';
      }
    }

    // Top 3 Cryptos
    if (this.state.results) {
      const topCryptos = this.state.results.filter(r => !r.isGameCoin).slice(0, 3);
      if (topCryptos.length >= 3) {
        html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
        html += '<h3 style="margin: 0 0 15px 0;">🥇🥈🥉 Top 3 Cryptos</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">';
        
        topCryptos.forEach((coin, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
          html += `<div style="background: #fff; padding: 15px; border-radius: 8px; border: ${idx === 0 ? '2px solid #ffc107' : '1px solid #ddd'};">`;
          html += `<div style="font-size: 28px; margin-bottom: 8px;">${medal}</div>`;
          html += `<div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">${coin.coin}</div>`;
          html += `<div style="font-size: 12px; color: #666; margin-bottom: 12px;">Contrib: ${coin.contribution}%</div>`;
          html += '<div style="font-size: 14px; color: #666;">Mensal:</div>';
          html += `<div style="font-size: 16px; color: ${idx === 0 ? '#ff9800' : '#007bff'}; font-weight: bold;">${this.state.showQuantity ? `${coin.monthlyQty.toFixed(4)} ${coin.coin}` : (this.state.useBRL ? `R$ ${(coin.monthly * this.state.usdToBrl).toFixed(2)}` : `$${coin.monthly.toFixed(2)}`)}</div>`;
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
    }

    // Game vs Crypto
    if (this.state.results) {
      const bestGame = this.state.results.find(r => r.isGameCoin);
      const bestCrypto = this.state.results.find(r => !r.isGameCoin);
      if (bestGame && bestCrypto) {
        html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
        html += '<h3 style="margin: 0 0 15px 0;">🎮 Game vs 🪙 Crypto - Melhor de Cada</h3>';
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        // Best Game
        html += '<div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border: 2px solid #007bff;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">🎮 Melhor Game Coin</div>';
        html += `<div style="font-size: 22px; color: #007bff; font-weight: bold; margin-bottom: 8px;">${bestGame.coin}</div>`;
        html += `<div style="font-size: 12px; color: #666; margin-bottom: 16px;">Contribuição: ${bestGame.contribution}%</div>`;
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';
        html += '<div><div style="font-size: 11px; color: #666;">Diário</div>';
        html += `<div style="font-size: 15px; font-weight: bold;">${bestGame.dailyQty.toFixed(2)} ${bestGame.coin}</div></div>`;
        html += '<div><div style="font-size: 11px; color: #666;">Mensal</div>';
        html += `<div style="font-size: 15px; font-weight: bold;">${bestGame.monthlyQty.toFixed(2)} ${bestGame.coin}</div></div>`;
        html += '</div>';
        html += '</div>';
        
        // Best Crypto
        html += '<div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border: 2px solid #6f42c1;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">🪙 Melhor Crypto</div>';
        html += `<div style="font-size: 22px; color: #6f42c1; font-weight: bold; margin-bottom: 8px;">${bestCrypto.coin}</div>`;
        html += `<div style="font-size: 12px; color: #666; margin-bottom: 16px;">Contribuição: ${bestCrypto.contribution}%</div>`;
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';
        html += '<div><div style="font-size: 11px; color: #666;">Diário</div>';
        html += `<div style="font-size: 15px; font-weight: bold;">${this.state.showQuantity ? `${bestCrypto.dailyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useBRL ? `R$ ${(bestCrypto.daily * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.daily.toFixed(2)}`)}</div></div>`;
        html += '<div><div style="font-size: 11px; color: #666;">Mensal</div>';
        html += `<div style="font-size: 15px; font-weight: bold;">${this.state.showQuantity ? `${bestCrypto.monthlyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useBRL ? `R$ ${(bestCrypto.monthly * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.monthly.toFixed(2)}`)}</div></div>`;
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        html += '</div>';
      }
    }

    // Painel de Preços
    html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
    html += '<h3 style="margin: 0;">💰 Cotações</h3>';
    html += '<button onclick="UI_FarmCalculator.fetchPrices()" style="padding: 6px 12px; font-size: 12px;">🔄 Atualizar</button>';
    html += '</div>';
    
    const statusIcon = this.state.priceStatus === 'success' ? '🟢' : this.state.priceStatus === 'fallback' ? '🟡' : '⚪';
    const statusText = this.state.priceStatus === 'fallback' ? ' (fallback)' : '';
    html += `<div style="background: #e3f2fd; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 11px; color: #666;">`;
    html += `<div>${statusIcon} 📡 Fonte: <strong style="color: #007bff;">CryptoCompare API</strong>${statusText}</div>`;
    html += `<div>💱 Câmbio: <strong style="color: #007bff;">ExchangeRate-API</strong> (R$ ${this.state.usdToBrl.toFixed(2)})</div>`;
    html += '</div>';
    
    html += '<div style="max-height: 300px; overflow-y: auto;">';
    Object.entries(this.state.prices).forEach(([coin, price]) => {
      html += '<div style="background: #fff; padding: 10px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #ddd;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
      html += `<span style="font-weight: 600;">${coin}</span>`;
      html += '<div style="text-align: right;">';
      html += `<div style="color: #ff9800; font-size: 14px; font-weight: bold;">$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>`;
      html += `<div style="color: #666; font-size: 12px;">R$ ${(price * this.state.usdToBrl).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>`;
      html += '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    
    if (this.state.lastUpdate) {
      html += `<div style="margin-top: 12px; color: #999; font-size: 11px; text-align: center;">⏰ Atualizado ${this.getTimeAgo(this.state.lastUpdate.toISOString())}</div>`;
    }
    html += '</div>';

    // Gráfico
    if (this.state.history.length >= 2) {
      html += '<div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; height: 400px;">';
      html += '<canvas id="farmChart"></canvas>';
      html += '</div>';
    }

    // Tabela de Resultados
    if (this.state.results) {
      html += '<div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">';
      html += '<h3 style="margin: 0;">📊 Resultados Detalhados</h3>';
      
      html += '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
      html += '<button onclick="UI_FarmCalculator.exportCSV()" style="padding: 8px 16px; background: #28a745; font-size: 14px;">📥 Exportar CSV</button>';
      
      html += '<div style="display: flex; background: #f8f9fa; border-radius: 8px; padding: 4px; border: 1px solid #ddd;">';
      html += `<button onclick="UI_FarmCalculator.state.useBRL = false; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${!this.state.useBRL ? '#007bff' : 'transparent'}; color: ${!this.state.useBRL ? 'white' : '#333'}; font-weight: ${!this.state.useBRL ? 'bold' : 'normal'};">USD $</button>`;
      html += `<button onclick="UI_FarmCalculator.state.useBRL = true; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${this.state.useBRL ? '#007bff' : 'transparent'}; color: ${this.state.useBRL ? 'white' : '#333'}; font-weight: ${this.state.useBRL ? 'bold' : 'normal'};">BRL R$</button>`;
      html += '</div>';
      
      html += '<div style="display: flex; background: #f8f9fa; border-radius: 8px; padding: 4px; border: 1px solid #ddd;">';
      html += `<button onclick="UI_FarmCalculator.state.showQuantity = false; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${!this.state.showQuantity ? '#6f42c1' : 'transparent'}; color: ${!this.state.showQuantity ? 'white' : '#333'}; font-weight: ${!this.state.showQuantity ? 'bold' : 'normal'};">💰 Valor</button>`;
      html += `<button onclick="UI_FarmCalculator.state.showQuantity = true; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${this.state.showQuantity ? '#6f42c1' : 'transparent'}; color: ${this.state.showQuantity ? 'white' : '#333'}; font-weight: ${this.state.showQuantity ? 'bold' : 'normal'};">🪙 Quantidade</button>`;
      html += '</div>';
      
      html += '</div>';
      html += '</div>';
      
      html += '<div style="overflow-x: auto;">';
      html += '<table><thead><tr>';
      html += '<th>Moeda</th>';
      html += '<th style="text-align: right;">Contrib %</th>';
      html += '<th style="text-align: right;">Por Bloco</th>';
      html += '<th style="text-align: right;">Diário</th>';
      html += '<th style="text-align: right;">Semanal</th>';
      html += '<th style="text-align: right;">Mensal (30D)</th>';
      html += '</tr></thead><tbody>';
      
      this.state.results.forEach((r, idx) => {
        const isTopCrypto = !r.isGameCoin && this.state.results.filter(coin => !coin.isGameCoin).indexOf(r) === 0;
        const rowClass = isTopCrypto ? ' style="background: #fff3cd;"' : '';
        
        html += `<tr${rowClass}>`;
        html += `<td><strong>${r.coin}</strong> <span style="background: ${r.isGameCoin ? '#e3f2fd' : '#f3e5f5'}; color: ${r.isGameCoin ? '#007bff' : '#6f42c1'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">${r.isGameCoin ? 'Game' : 'Crypto'}</span>${isTopCrypto ? ' <span style="background: #fff3cd; color: #ff9800; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">🏆 TOP</span>' : ''}</td>`;
        html += `<td style="text-align: right; font-size: 13px;">${r.contribution}%</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.block, r.blockQty, !r.isGameCoin, r.coin, 'block')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.daily, r.dailyQty, !r.isGameCoin, r.coin, 'daily')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.weekly, r.weeklyQty, !r.isGameCoin, r.coin, 'weekly')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.monthly, r.monthlyQty, !r.isGameCoin, r.coin, 'monthly')}</td>`;
        html += '</tr>';
      });
      
      html += '</tbody></table>';
      html += '</div>';
      html += '</div>';
    }

    // Histórico
    if (this.state.history.length > 0) {
      html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">';
      html += `<h3 style="margin: 0;">📜 Histórico (${this.state.history.length})</h3>`;
      html += '<div>';
      html += `<button onclick="UI_FarmCalculator.state.showHistory = !UI_FarmCalculator.state.showHistory; UI_FarmCalculator.render();" style="padding: 6px 12px; font-size: 12px; margin-right: 8px;">${this.state.showHistory ? '▲ Ocultar' : '▼ Mostrar'}</button>`;
      html += '<button onclick="UI_FarmCalculator.clearHistory()" style="padding: 6px 12px; font-size: 12px; background: #dc3545;">🗑️ Limpar</button>';
      html += '</div>';
      html += '</div>';
      
      if (this.state.showHistory) {
        html += '<div style="max-height: 400px; overflow-y: auto;">';
        this.state.history.forEach((entry, idx) => {
          html += '<div style="background: #fff; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #ddd;">';
          html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
          html += '<div>';
          html += `<span style="font-weight: 600;">${this.formatDate(entry.timestamp)}</span>`;
          html += `<span style="color: #999; font-size: 12px; margin-left: 8px;">(${this.getTimeAgo(entry.timestamp)})</span>`;
          html += '</div>';
          html += '<div style="text-align: right;">';
          html += `<div style="color: #007bff; font-size: 14px;">Power: ${entry.power.toFixed(3)} Eh/s</div>`;
          html += `<div style="color: #6f42c1; font-size: 12px;">Rede: ${(entry.networkTotal / 1000).toFixed(3)} Zh/s</div>`;
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Adicionar event listeners para os inputs
    const powerInput = document.getElementById('farmMiningPower');
    const networkInput = document.getElementById('farmNetworkData');
    
    if (powerInput) {
      powerInput.addEventListener('input', (e) => {
        this.state.miningPower = e.target.value;
      });
    }
    
    if (networkInput) {
      networkInput.addEventListener('input', (e) => {
        this.state.networkData = e.target.value;
      });
    }

    // Renderizar gráfico se necessário
    setTimeout(() => this.renderChart(), 100);
  },

mostrar(userData) {
    const container = document.getElementById('farmcalculator');
    if (!container) return;

    this.loadFromStorage();
    
    const stateUser = State.getUserData();
    const user = stateUser || userData;
    
    if (user && user.powerData && user.powerData.current_power) {
      // DIVIDIR por 1 BILHÃO (não 1 milhão)
      const powerEh = user.powerData.current_power / 1000000000;
      const powerInt = Math.floor(powerEh * 1000);
      const powerStr = powerInt.toString();
      
      if (powerStr.length > 3) {
        this.state.miningPower = powerStr.slice(0, -3) + '.' + powerStr.slice(-3);
      } else {
        this.state.miningPower = '0.' + powerStr.padStart(3, '0');
      }
    }

    this.fetchPrices();
    this.render();
  }
};

window.UI_FarmCalculator = UI_FarmCalculator;