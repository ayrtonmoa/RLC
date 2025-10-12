// js/ui/inventario.js - Versão Completa e Corrigida

const UI_Inventario = {
  currentSort: { column: 'impacto', direction: 'desc' },
  currentFilter: 'all', // 'all', 'nao_possui', 'possui_outra', 'possui_exata'
  instaladaSort: { column: 'impacto', direction: 'asc' }, // Para miners instaladas (mais fracas primeiro)
  
  mostrar: function(user) {
    const div = document.getElementById('inventario');
    div.innerHTML = `
      <h2>Inventário</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50;">
        <h4>💡 Como Usar</h4>
        <p>1. Vá em <a href="https://rollercoin.com/storage/inventory/miners" target="_blank" style="color: #007bff; font-weight: bold; text-decoration: underline;">Storage > Miners no RollerCoin 🔗</a></p>
        <p>2. Clique "Load more" até carregar tudo</p>
        <p>3. Ctrl+A para selecionar, Ctrl+C para copiar</p>
        <p>4. Cole abaixo e clique em Analisar</p>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">💡 <strong>Debug:</strong> Pressione F12 para ver logs detalhados</p>
      </div>

      <textarea id="inventarioText" rows="8" placeholder="Cole aqui..." style="width: 100%; padding: 10px; margin: 15px 0;"></textarea>
      <button onclick="UI_Inventario.analisar()">🔍 Analisar Inventário</button>
      <button onclick="UI_Inventario.debugParsing()" style="background: #6c757d;">🐛 Debug Parsing</button>
      <button onclick="UI_Inventario.testarCalculo()" style="background: #dc3545;">⚠️ Testar Cálculo</button>
      
      <div id="resultadoInventario" style="margin-top: 20px;"></div>
    `;
  },
  
  analisar: function() {
    const texto = document.getElementById('inventarioText').value;
    const resultDiv = document.getElementById('resultadoInventario');
    
    if (!texto) {
      resultDiv.innerHTML = '<p class="error">Cole o texto primeiro!</p>';
      return;
    }
    
    const userData = State.getUserData();
    if (!userData) {
      resultDiv.innerHTML = '<p class="error">Analise seu perfil primeiro!</p>';
      return;
    }

    try {
      const minersAgrupadas = this.extrair(texto);
      
      if (minersAgrupadas.length === 0) {
        resultDiv.innerHTML = '<p class="warning">Nenhuma miner encontrada. Copiou da página certa? <a href="https://rollercoin.com/storage/inventory/miners" target="_blank">Clique aqui</a></p>';
        return;
      }

      const comImpacto = this.calcular(minersAgrupadas, userData);
      const minersFracas = this.get50MinersMaisFracas(userData);
      
      this.mostrarResultado(comImpacto, minersFracas);
      
    } catch (error) {
      resultDiv.innerHTML = '<p class="error">Erro: ' + error.message + '</p>';
      console.error(error);
    }
  },
  
  get50MinersMaisFracas: function(userData) {
    const impacts = Calculations.calcularImpactos(userData);
    const totalInstaladas = userData.roomData.miners.length;
    const fracas = impacts.slice(-totalInstaladas);
    return fracas.sort((a, b) => a.impact - b.impact);
  },
  
  extrair: function(texto) {
    const miners = [];
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    
    console.log('📋 Total de linhas:', linhas.length);
    
    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i + 1] !== 'Set') continue;
      
      const nome = linhas[i];
      let cells = 2, power = 0, bonus = 0, quantity = 1, level = 'Unknown';
      
      console.log('\n🔍 Processando:', nome);
      
      const blocoCompleto = linhas.slice(i, Math.min(i + 40, linhas.length)).join(' | ');
      console.log('  📄 Bloco completo:', blocoCompleto);
      
      for (let j = i; j < i + 40 && j < linhas.length; j++) {
        const linha = linhas[j];
        const linhaLower = linha.toLowerCase().trim();
        const linhaSemEspacos = linha.replace(/\s+/g, '').toLowerCase();
        
        if (level === 'Unknown') {
          if (linha === 'Common') level = 'Common';
          else if (linha === 'Uncommon') level = 'Uncommon';
          else if (linha === 'Rare') level = 'Rare';
          else if (linha === 'Epic') level = 'Epic';
          else if (linha === 'Legendary') level = 'Legendary';
          else if (linha === 'Unreal') level = 'Unreal';
          else if (/^common$/i.test(linha)) level = 'Common';
          else if (/^uncommon$/i.test(linha)) level = 'Uncommon';
          else if (/^rare$/i.test(linha)) level = 'Rare';
          else if (/^epic$/i.test(linha)) level = 'Epic';
          else if (/^legendary$/i.test(linha)) level = 'Legendary';
          else if (/^unreal$/i.test(linha)) level = 'Unreal';
          else if (linhaLower.includes('epic') && !linhaLower.includes('set')) level = 'Epic';
          else if (linhaLower.includes('legendary') && !linhaLower.includes('set')) level = 'Legendary';
          else if (linhaLower.includes('unreal') && !linhaLower.includes('set')) level = 'Unreal';
          else if (linhaLower.includes('rare') && !linhaLower.includes('set') && !linhaLower.includes('rare set')) level = 'Rare';
          else if (linhaLower.includes('uncommon') && !linhaLower.includes('set')) level = 'Uncommon';
          else if (linhaLower.includes('common') && !linhaLower.includes('uncommon') && !linhaLower.includes('set')) level = 'Common';
          else if (linhaSemEspacos === 'epic') level = 'Epic';
          else if (linhaSemEspacos === 'legendary') level = 'Legendary';
          else if (linhaSemEspacos === 'unreal') level = 'Unreal';
          else if (linhaSemEspacos === 'rare') level = 'Rare';
          else if (linhaSemEspacos === 'uncommon') level = 'Uncommon';
          else if (linhaSemEspacos === 'common') level = 'Common';
          
          if (j < linhas.length - 1) {
            const duasLinhas = (linha + linhas[j + 1]).toLowerCase().replace(/\s+/g, '');
            if (duasLinhas.includes('epic') && !duasLinhas.includes('set')) level = 'Epic';
            else if (duasLinhas.includes('legendary') && !duasLinhas.includes('set')) level = 'Legendary';
            else if (duasLinhas.includes('unreal') && !duasLinhas.includes('set')) level = 'Unreal';
          }
          
          if (level !== 'Unknown') {
            console.log('  ✅ Level detectado:', level, '(linha ' + j + ':', linha + ')');
          }
        }
        
        const cellsMatch = linha.match(/^(\d+)\s+Cells?$/i);
        if (cellsMatch) {
          cells = parseInt(cellsMatch[1]);
          console.log('  📦 Células:', cells);
        }
        
        if (linha === 'Power' || linha === 'power') {
          const powerLine = linhas[j + 1];
          const match = powerLine.match(/([\d\s.,]+)\s*(Eh\/s|Ph\/s|Th\/s|Gh\/s|Mh\/s)/i);
          if (match) {
            const numberStr = match[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
            power = parseFloat(numberStr);
            const unit = match[2].toLowerCase();
            
            if (unit.includes('eh')) power *= 1000000;
            else if (unit.includes('ph')) power *= 1000;
            else if (unit.includes('gh')) power *= 0.001;
            else if (unit.includes('mh')) power *= 0.000001;
            
            console.log('  ⚡ Power:', power.toFixed(3), 'Th/s (original:', powerLine + ')');
          }
        }
        
        if (linha === 'Bonus' || linha === 'bonus') {
          const bonusLine = linhas[j + 1];
          const match = bonusLine.match(/([\d.,]+)/);
          if (match) {
            bonus = parseFloat(match[1].replace(',', '.'));
            console.log('  💎 Bonus:', bonus + '%');
          }
        }
        
        if (linha === 'Quantity:' && linhas[j + 1].match(/^\d+$/)) {
          quantity = parseInt(linhas[j + 1]);
          console.log('  🔢 Quantity:', quantity);
          break;
        }
      }
      
      if (power > 0) {
        console.log('  ✅ ADICIONADA:', { nome, level, cells, power: power.toFixed(3), bonus, quantity });
        miners.push({ 
          name: nome, 
          cells: cells, 
          power: power, 
          bonus: bonus, 
          quantity: quantity, 
          level: level 
        });
      } else {
        console.log('  ❌ IGNORADA (power = 0)');
      }
    }
    
    console.log('\n📊 RESULTADO FINAL:', miners.length, 'miners extraídas');
    return miners;
  },
  
calcular: function(miners, userData) {
  const baseAtual = userData.roomData.miners.reduce((s, m) => s + m.power, 0);
  const bonusPercentualAtual = userData.powerData.bonus_percent / 10000;
  const totalAtual = userData.powerData.current_power;
  
  console.log('🔍 Iniciando verificação de miners instaladas...');
  
  return miners.map(m => {
    // Verificar se já possui
    let jaPossui = false;
    let minerInstalada = null;
    let tipoMatch = null;
    let levelDetectado = m.level;
    
    const nomeInventario = m.name.toLowerCase().trim();
    const powerInventario = m.power;
    
    const minersComMesmoNome = userData.roomData.miners.filter(mi => 
      mi.name.toLowerCase().trim() === nomeInventario
    );
    
    if (minersComMesmoNome.length > 0) {
      console.log('  📦', m.name, '→ Encontrei', minersComMesmoNome.length, 'com mesmo nome');
      
      const tolerancia = 500;
      const minerComMesmoPower = minersComMesmoNome.find(mi => {
        const diferenca = Math.abs(mi.power - powerInventario);
        return diferenca < tolerancia;
      });
      
      if (minerComMesmoPower) {
        jaPossui = true;
        minerInstalada = minerComMesmoPower;
        tipoMatch = 'exato';
        levelDetectado = minerComMesmoPower.level_label;
        console.log('    ✅ MATCH EXATO! Level:', levelDetectado);
      } else {
        jaPossui = false;
        minerInstalada = minersComMesmoNome[0];
        tipoMatch = 'nome_diferente_tier';
        levelDetectado = 'Unknown (diferente de ' + minerInstalada.level_label + ')';
        console.log('    ⚠️ Mesmo nome, mas tier diferente!');
      }
    } else {
      console.log('  ❌', m.name, '→ NÃO possui');
    }
    
    // CALCULAR GANHO PELA SOMA DIRETA (igual fizemos no calculations.js)
    const ganhoBase = m.power;
    const ganhoBonusQueReceberá = m.power * bonusPercentualAtual;
    const ganhoBonusDeColecao = jaPossui ? 0 : (baseAtual * (m.bonus / 100));
    
    // Ganho total = soma dos ganhos
    const impacto = ganhoBase + ganhoBonusQueReceberá + ganhoBonusDeColecao;
    
    return { 
      name: m.name,
      cells: m.cells,
      power: m.power,
      bonus: m.bonus,
      level: levelDetectado,
      quantity: m.quantity,
      impacto: impacto,
      jaPossui: jaPossui,
      minerInstalada: minerInstalada,
      tipoMatch: tipoMatch
    };
  }).sort((a, b) => b.impacto - a.impacto);
},
  
  mostrarResultado: function(miners, minersFracas) {
    const div = document.getElementById('resultadoInventario');
    const userData = State.getUserData();
    
    // Armazenar dados para filtros/ordenação
    this.minersCached = miners;
    this.minersFracasCached = minersFracas;
    
    this.renderResultado();
  },
  
  ordenar: function(coluna) {
    if (this.currentSort.column === coluna) {
      this.currentSort.direction = this.currentSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
      this.currentSort.column = coluna;
      this.currentSort.direction = 'desc';
    }
    this.renderResultado();
  },
  
  ordenarInstaladas: function(coluna) {
    if (this.instaladaSort.column === coluna) {
      this.instaladaSort.direction = this.instaladaSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
      this.instaladaSort.column = coluna;
      this.instaladaSort.direction = 'asc'; // Default: mais fracas primeiro
    }
    this.renderResultado();
  },
  
  filtrar: function(tipo) {
    this.currentFilter = tipo;
    this.renderResultado();
  },
  
  renderResultado: function() {
    if (!this.minersCached) return;
    
    const div = document.getElementById('resultadoInventario');
    const userData = State.getUserData();
    
    let miners = [...this.minersCached];
    let minersFracas = [...this.minersFracasCached];
    
    // FILTRAR
    if (this.currentFilter === 'nao_possui') {
      miners = miners.filter(m => !m.jaPossui && m.tipoMatch !== 'nome_diferente_tier');
    } else if (this.currentFilter === 'possui_outra') {
      miners = miners.filter(m => m.tipoMatch === 'nome_diferente_tier');
    } else if (this.currentFilter === 'possui_exata') {
      miners = miners.filter(m => m.jaPossui && m.tipoMatch === 'exato');
    }
    
    // ORDENAR INVENTÁRIO
    miners.sort((a, b) => {
      let valA, valB;
      
      switch(this.currentSort.column) {
        case 'nome':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          return this.currentSort.direction === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        
        case 'level':
          const levelOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Unreal': 6 };
          valA = levelOrder[a.level] || 0;
          valB = levelOrder[b.level] || 0;
          break;
        
        case 'quantity':
          valA = a.quantity;
          valB = b.quantity;
          break;
        
        case 'cells':
          valA = a.cells;
          valB = b.cells;
          break;
        
        case 'power':
          valA = a.power;
          valB = b.power;
          break;
        
        case 'bonus':
          valA = a.bonus;
          valB = b.bonus;
          break;
        
        case 'impacto':
          valA = a.impacto;
          valB = b.impacto;
          break;
        
        case 'status':
          const statusOrder = { 'nao_possui': 1, 'nome_diferente_tier': 2, 'exato': 3 };
          valA = a.jaPossui ? (a.tipoMatch === 'exato' ? 3 : 2) : 1;
          valB = b.jaPossui ? (b.tipoMatch === 'exato' ? 3 : 2) : 1;
          break;
        
        default:
          valA = a.impacto;
          valB = b.impacto;
      }
      
      if (this.currentSort.column !== 'nome') {
        return this.currentSort.direction === 'desc' ? valB - valA : valA - valB;
      }
    });
    
    // ORDENAR MINERS INSTALADAS
    minersFracas.sort((a, b) => {
      let valA, valB;
      
      switch(this.instaladaSort.column) {
        case 'nome':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          return this.instaladaSort.direction === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        
        case 'level':
          const levelOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Unreal': 6 };
          valA = levelOrder[a.level] || 0;
          valB = levelOrder[b.level] || 0;
          break;
        
        case 'cells':
          valA = a.width || 2;
          valB = b.width || 2;
          break;
        
        case 'bonus':
          valA = a.minerBonusPercent;
          valB = b.minerBonusPercent;
          break;
        
        case 'power':
          valA = a.basePower;
          valB = b.basePower;
          break;
        
        case 'impacto':
          valA = a.impact;
          valB = b.impact;
          break;
        
        default:
          valA = a.impact;
          valB = b.impact;
      }
      
      if (this.instaladaSort.column !== 'nome') {
        return this.instaladaSort.direction === 'desc' ? valB - valA : valA - valB;
      }
    });
    
    const totalUnidades = this.minersCached.reduce((sum, m) => sum + m.quantity, 0);
    const minersUnicas = this.minersCached.length;
    
    const capacidadeTotal = userData.roomData.racks.reduce((sum, r) => {
      return sum + (r.rack_info ? r.rack_info.width * r.rack_info.height : 0);
    }, 0);
    
    const celulasOcupadas = userData.roomData.miners.reduce((sum, m) => {
      return sum + (m.width || 2);
    }, 0);
    
    const espacoLivre = capacidadeTotal - celulasOcupadas;
    const salaCheia = espacoLivre <= 0;
    
    console.log('🏠 Espaço: Total=' + capacidadeTotal + ', Ocupado=' + celulasOcupadas + ', Livre=' + espacoLivre);
    
    let html = '<h3>📦 ' + totalUnidades + ' unidades encontradas (' + minersUnicas + ' miners únicas)</h3>';
    html += '<p style="font-size: 12px; color: #666;">Miners agrupadas por tipo | Mostrando: ' + miners.length + ' miners</p>';
    
    // FILTROS
    html += '<div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">';
    html += '<strong>🔍 Filtros:</strong> ';
    html += '<button onclick="UI_Inventario.filtrar(\'all\')" style="margin: 0 5px; ' + (this.currentFilter === 'all' ? 'background: #007bff; color: white;' : '') + '">Todas</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'nao_possui\')" style="margin: 0 5px; ' + (this.currentFilter === 'nao_possui' ? 'background: #28a745; color: white;' : '') + '">🆕 Não Possuo</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'possui_outra\')" style="margin: 0 5px; ' + (this.currentFilter === 'possui_outra' ? 'background: #ff9800; color: white;' : '') + '">⚠️ Tier Diferente</button>';
    html += '<button onclick="UI_Inventario.filtrar(\'possui_exata\')" style="margin: 0 5px; ' + (this.currentFilter === 'possui_exata' ? 'background: #6c757d; color: white;' : '') + '">✔️ Já Possuo</button>';
    html += '</div>';
    
    if (salaCheia) {
      html += '<div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0;">';
      html += '<h4 style="margin: 0;">⚠️ Sala Cheia! (' + capacidadeTotal + ' células)</h4>';
      html += '<p style="margin: 5px 0 0 0; font-size: 13px;">Veja as sugestões de troca abaixo</p>';
      html += '</div>';
    } else {
      html += '<div style="background: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0;">';
      html += '<h4 style="margin: 0;">✅ Você tem ' + espacoLivre + ' células livres!</h4>';
      html += '<p style="margin: 5px 0 0 0; font-size: 13px;">Adicione as melhores miners do inventário sem precisar trocar</p>';
      html += '</div>';
    }
    
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">';
    
    // COLUNA 1: Miners Instaladas
    html += '<div>';
    if (minersFracas && minersFracas.length > 0) {
      html += '<div style="background: #fff3e0; border-left: 4px solid #FF9800; padding: 15px; margin-bottom: 15px;">';
      html += '<h4 style="margin: 0 0 10px 0;">🔍 Suas ' + minersFracas.length + ' Miners Instaladas</h4>';
      html += '<p style="font-size: 13px; margin: 0;">Da mais fraca (#1) para mais forte (#' + minersFracas.length + ')</p>';
      html += '</div>';
      
      html += '<div style="max-height: 600px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">';
      html += '<table style="font-size: 11px; width: 100%;"><tr>';
      html += '<th>Pos</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'nome\')" style="cursor: pointer;">Nome ' + (this.instaladaSort.column === 'nome' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'level\')" style="cursor: pointer;">Level ' + (this.instaladaSort.column === 'level' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'cells\')" style="cursor: pointer;">Cél ' + (this.instaladaSort.column === 'cells' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'bonus\')" style="cursor: pointer;">Bônus ' + (this.instaladaSort.column === 'bonus' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'power\')" style="cursor: pointer;">Power Base ' + (this.instaladaSort.column === 'power' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '<th onclick="UI_Inventario.ordenarInstaladas(\'impacto\')" style="cursor: pointer;">Impacto ' + (this.instaladaSort.column === 'impacto' ? (this.instaladaSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
      html += '</tr>';
      
      for (let i = 0; i < minersFracas.length; i++) {
        const m = minersFracas[i];
        const cor = i < 10 ? 'low-impact' : (i < 30 ? 'medium-impact' : 'high-impact');
        
        html += '<tr class="' + cor + '">';
        html += '<td>#' + (i + 1) + '</td>';
        html += '<td><strong>' + m.name + '</strong></td>';
        html += '<td>' + m.level + '</td>';
        html += '<td>' + (m.width || 2) + '</td>';
        html += '<td>' + (m.minerBonusPercent * 100).toFixed(2) + '%</td>';
        html += '<td>' + Utils.formatPower(m.basePower * 1e9) + '</td>';
        html += '<td>' + Utils.formatPower(m.impact * 1e9) + '</td>';
        html += '</tr>';
      }
      
      html += '</table></div>';
    }
    html += '</div>';
    
    // COLUNA 2: Inventário
    html += '<div>';
    html += '<div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin-bottom: 15px;">';
    html += '<h4 style="margin: 0 0 10px 0;">📋 Seu Inventário</h4>';
    html += '<p style="font-size: 13px; margin: 0;">Miners agrupadas por tipo</p>';
    html += '</div>';
    
    html += '<div style="max-height: 600px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">';
    html += '<table style="font-size: 11px; width: 100%;"><tr>';
    html += '<th>#</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'nome\')" style="cursor: pointer;">Nome ' + (this.currentSort.column === 'nome' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'level\')" style="cursor: pointer;">Lvl Inv ' + (this.currentSort.column === 'level' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'quantity\')" style="cursor: pointer;">Qty ' + (this.currentSort.column === 'quantity' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'cells\')" style="cursor: pointer;">Cél ' + (this.currentSort.column === 'cells' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'power\')" style="cursor: pointer;">Power ' + (this.currentSort.column === 'power' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'bonus\')" style="cursor: pointer;">Bônus ' + (this.currentSort.column === 'bonus' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'impacto\')" style="cursor: pointer;">Ganho ' + (this.currentSort.column === 'impacto' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '<th onclick="UI_Inventario.ordenar(\'status\')" style="cursor: pointer;">Status ' + (this.currentSort.column === 'status' ? (this.currentSort.direction === 'desc' ? '▼' : '▲') : '↕️') + '</th>';
    html += '</tr>';
    
    for (let i = 0; i < miners.length; i++) {
      const m = miners[i];
      const cor = i < 5 ? 'high-impact' : (i < 15 ? 'medium-impact' : '');
      
      const emoji = {
        'Common': '⚪',
        'Uncommon': '🟢',
        'Rare': '🔵',
        'Epic': '🟣',
        'Legendary': '🟡',
        'Unreal': '🔴'
      }[m.level] || '❓';
      
      let statusText = '';
      if (m.jaPossui && m.tipoMatch === 'exato') {
        statusText = '<span style="color: #666; font-size: 10px;">✔ Possui<br>' + emoji + ' ' + m.level + '</span>';
      } else if (m.tipoMatch === 'nome_diferente_tier' && m.minerInstalada) {
        const emojiInstalada = {
          'Common': '⚪',
          'Uncommon': '🟢',
          'Rare': '🔵',
          'Epic': '🟣',
          'Legendary': '🟡',
          'Unreal': '🔴'
        }[m.minerInstalada.level_label] || '❓';
        
        statusText = '<span style="color: #ff9800; font-weight: bold; font-size: 10px;">⚠️ Tem<br>' + emojiInstalada + ' ' + m.minerInstalada.level_label + '</span>';
      } else {
        statusText = '<span style="color: #999; font-size: 10px;">✗ Não<br>possui</span>';
      }
      
      html += '<tr class="' + cor + '">';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td><strong>' + m.name + '</strong></td>';
      html += '<td>' + emoji + ' ' + m.level + '</td>';
      html += '<td><strong>' + m.quantity + '</strong></td>';
      html += '<td>' + m.cells + '</td>';
      html += '<td>' + Utils.formatPower(m.power * 1e9) + '</td>';
      html += '<td>' + m.bonus.toFixed(2) + '%</td>';
      html += '<td><strong>' + Utils.formatPower(m.impacto * 1e9) + '</strong></td>';
      html += '<td>' + statusText + '</td>';
      html += '</tr>';
    }
    
    html += '</table></div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div style="background: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin-top: 15px;">';
    html += '<h4>💡 Legenda e Funcionalidades</h4>';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
    
    // Coluna 1: Miners Instaladas
    html += '<div>';
    html += '<h5 style="margin: 5px 0;">📋 Miners Instaladas:</h5>';
    html += '<ul style="font-size: 12px; margin: 5px 0; line-height: 1.6;">';
    html += '<li>Clique nos <strong>cabeçalhos</strong> (↕️) para ordenar</li>';
    html += '<li>Ordenação padrão: mais fracas primeiro</li>';
    html += '<li><strong>Impacto:</strong> Quanto você perderia removendo essa miner</li>';
    html += '</ul>';
    html += '</div>';
    
    // Coluna 2: Inventário
    html += '<div>';
    html += '<h5 style="margin: 5px 0;">📦 Inventário:</h5>';
    html += '<ul style="font-size: 12px; margin: 5px 0; line-height: 1.6;">';
    html += '<li><strong>Filtros:</strong> Use os botões para filtrar por status</li>';
    html += '<li><strong>Qty:</strong> Quantidade no inventário</li>';
    html += '<li><strong>Ganho:</strong> Impacto de instalar UMA unidade</li>';
    html += '<li>Clique nos <strong>cabeçalhos</strong> (↕️) para ordenar</li>';
    html += '</ul>';
    html += '</div>';
    html += '</div>';
    
    html += '<hr style="margin: 15px 0;">';
    html += '<h5 style="margin: 5px 0;">🏷️ Status do Inventário:</h5>';
    html += '<ul style="font-size: 13px; margin: 5px 0; line-height: 1.6;">';
    html += '<li><strong>Qty:</strong> Quantidade de miners desse tipo no inventário</li>';
    html += '<li><strong>Ganho:</strong> Quanto você ganharia instalando UMA unidade dessa miner</li>';
    html += '<li><strong>Ordenação:</strong> Clique nos cabeçalhos das colunas (↕️) para ordenar</li>';
    html += '<li><strong>Filtros:</strong> Use os botões acima da tabela para filtrar por status</li>';
    html += '<li><strong>Status:</strong></li>';
    html += '<ul style="margin: 5px 0 5px 20px;">';
    html += '<li><strong>✔ Possui [emoji] [tier]:</strong> Você já tem essa miner EXATA instalada (não ganhará bônus de coleção)</li>';
    html += '<li><strong>⚠️ Tem [emoji] [tier]:</strong> Você tem o mesmo nome mas TIER DIFERENTE instalado (ganhará bônus de coleção!)</li>';
    html += '<li><strong>✗ Não possui:</strong> Você não tem essa miner instalada</li>';
    html += '</ul>';
    html += '<li><strong>Levels:</strong> ⚪ Common | 🟢 Uncommon | 🔵 Rare | 🟣 Epic | 🟡 Legendary | 🔴 Unreal</li>';
    html += '</ul>';
    
    html += '<div style="background: #fff3cd; padding: 10px; margin-top: 10px; border-radius: 5px; font-size: 12px;">';
    html += '<strong>📌 Exemplo:</strong><br>';
    html += 'Se o inventário tem "<strong>Ferris Wheel Epic 🟣</strong>" e você tem "<strong>Ferris Wheel Rare 🔵</strong>" instalada:<br>';
    html += '➜ Status mostrará: <span style="color: #ff9800; font-weight: bold;">⚠️ Tem 🔵 Rare</span><br>';
    html += '➜ Você <strong>GANHARÁ</strong> bônus de coleção ao instalar a Epic, pois são tiers diferentes!';
    html += '</div>';
    html += '</div>';
    
    div.innerHTML = html;
  },
  
  debugParsing: function() {
    const texto = document.getElementById('inventarioText').value;
    if (!texto) {
      alert('Cole o texto primeiro!');
      return;
    }
    
    const resultDiv = document.getElementById('resultadoInventario');
    
    console.log('\n\n🐛🐛🐛 DEBUG PARSING INICIADO 🐛🐛🐛\n');
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    
    console.log('Total de linhas:', linhas.length);
    console.log('\n📋 Primeiras 200 linhas:');
    linhas.slice(0, 200).forEach((linha, i) => {
      const marcador = linhas[i + 1] === 'Set' ? '⭐ MINER AQUI ⭐' : '';
      console.log('[' + i + '] "' + linha + '" ' + marcador);
    });
    
    console.log('\n🔍 Tentando extrair miners...');
    const resultado = this.extrair(texto);
    
    console.log('\n📊 RESULTADO:');
    console.log('Total extraídas:', resultado.length);
    resultado.forEach((m, i) => {
      console.log((i + 1) + '.', m.name, '→', m.level, '|', m.cells, 'cells |', m.power.toFixed(3), 'Th/s |', m.bonus + '% | Qty:', m.quantity);
    });
    
    let html = '<div style="background: #f0f8ff; border: 2px solid #007bff; padding: 20px; border-radius: 8px;">';
    html += '<h3>🐛 Debug do Parsing</h3>';
    html += '<p><strong>Total de linhas detectadas:</strong> ' + linhas.length + '</p>';
    html += '<p><strong>Total de miners extraídas:</strong> ' + resultado.length + '</p>';
    
    html += '<div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd;">';
    html += '<h4>📄 Primeiras 100 Linhas do Texto Colado:</h4>';
    html += '<div style="max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 11px; line-height: 1.8;">';
    
    for (let i = 0; i < Math.min(100, linhas.length); i++) {
      const linha = linhas[i];
      const proxLinha = linhas[i + 1] || '';
      
      let cor = '';
      let destaque = '';
      
      if (proxLinha === 'Set') {
        cor = 'background: yellow; font-weight: bold; padding: 2px 5px;';
        destaque = ' 🎯 <strong>← NOME DA MINER</strong>';
      }
      
      if (linha === 'Set') {
        cor = 'background: lightgreen; font-weight: bold; padding: 2px 5px;';
        destaque = ' ✅';
      }
      
      const linhaLower = linha.toLowerCase();
      if (linhaLower === 'epic' || linhaLower === 'legendary' || linhaLower === 'rare' || 
          linhaLower === 'uncommon' || linhaLower === 'common' || linhaLower === 'unreal') {
        cor = 'background: lightblue; font-weight: bold; padding: 2px 5px;';
        destaque = ' 💎 <strong>← TIER DETECTADO!</strong>';
      }
      
      if (linha === 'Power' || linha === 'Bonus') {
        cor = 'background: lightyellow; padding: 2px 5px;';
      }
      
      html += '<div style="' + cor + '">[' + i + '] ' + linha + destaque + '</div>';
    }
    
    html += '</div></div>';
    
    if (resultado.length > 0) {
      html += '<div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd;">';
      html += '<h4>📊 Miners Extraídas:</h4>';
      html += '<table style="width: 100%; font-size: 11px;"><tr><th>#</th><th>Nome</th><th>Level</th><th>Cells</th><th>Power (Th/s)</th><th>Bonus</th><th>Qty</th></tr>';
      
      resultado.forEach((m, i) => {
        const corLinha = m.level === 'Unknown' ? 'background: #ffebee;' : '';
        html += '<tr style="' + corLinha + '">';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><strong>' + m.name + '</strong></td>';
        html += '<td>' + (m.level === 'Unknown' ? '❌ ' : '✅ ') + m.level + '</td>';
        html += '<td>' + m.cells + '</td>';
        html += '<td>' + m.power.toFixed(3) + '</td>';
        html += '<td>' + m.bonus.toFixed(2) + '%</td>';
        html += '<td>' + m.quantity + '</td>';
        html += '</tr>';
      });
      
      html += '</table>';
      
      const unknownCount = resultado.filter(m => m.level === 'Unknown').length;
      if (unknownCount > 0) {
        html += '<div style="background: #fff3cd; padding: 10px; margin-top: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">';
        html += '<strong>⚠️ ' + unknownCount + ' miners com tier "Unknown"</strong><br>';
        html += '<p style="font-size: 12px; margin: 5px 0;">Veja o Console (F12) para logs detalhados de cada miner.</p>';
        html += '</div>';
      }
      
      html += '</div>';
    }
    
    html += '</div>';
    
    resultDiv.innerHTML = html;
    
    alert('✅ Debug completo! Veja os resultados abaixo E no Console (F12).');
  }
};

window.UI_Inventario = UI_Inventario;
console.log('✅ UI_Inventario loaded');