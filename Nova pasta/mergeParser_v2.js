// js/mergeParser.js - Parser de Merges do RollerCoin (CORRIGIDO - v2)

const MergeParser = {
  parse(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const merges = [];
    
    console.log('🔍 Iniciando parsing de merges...');
    console.log('📝 Total de linhas:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      // Detectar nível (Common, Uncommon, Rare, Epic, Legendary)
      const levelMatch = lines[i].match(/^(Common|Uncommon|Rare|Epic|Legendary)$/);
      if (!levelMatch) continue;
      
      const currentLevel = levelMatch[1];
      const minerName = lines[i + 1];
      
      // Ignorar se não for nome válido
      if (!minerName || minerName === 'Level' || minerName === 'Power') continue;
      
      console.log(`\n📦 ${minerName} (${currentLevel})`);
      
      let powerBefore = 0, powerAfter = 0;
      let bonusBefore = 0, bonusAfter = 0;
      let minerQty = 0, minerNeeded = 0;
      let components = [];
      let foundMinerQty = false;
      
      // Procurar nas próximas 50 linhas
      for (let j = i; j < Math.min(i + 50, lines.length); j++) {
        const line = lines[j];
        
        // ===== POWER ===== (PROCESSA PRIMEIRO, ANTES DE COMPONENTS)
        if (line === 'Power' && powerBefore === 0 && j + 1 < lines.length) {
          let nextLine = lines[j + 1];
          console.log(`  🔍 Linha original após "Power": "${nextLine}"`);
          
          // CORREÇÃO: Limpar texto problemático como "Ph/supgrade"
          nextLine = nextLine.replace(/Ph\/supgrade/gi, 'Ph/s ');
          nextLine = nextLine.replace(/Th\/supgrade/gi, 'Th/s ');
          
          console.log(`  🔍 Linha limpa: "${nextLine}"`);
          
          const match = nextLine.match(/([\d.,]+)\s*(Ph\/s|Th\/s)\s*([\d.,]+)\s*(Ph\/s|Th\/s)/i);
          console.log(`  🔍 Match result:`, match);
          
          if (match) {
            powerBefore = parseFloat(match[1].replace(',', '.'));
            powerAfter = parseFloat(match[3].replace(',', '.'));
            
            if (match[2].toLowerCase().includes('ph')) powerBefore *= 1000;
            if (match[4].toLowerCase().includes('ph')) powerAfter *= 1000;
            
            console.log(`  ⚡ Power: ${powerBefore.toFixed(2)} → ${powerAfter.toFixed(2)} Th/s`);
          } else {
            console.log(`  ❌ Regex não deu match para Power!`);
          }
        }
        
        // Power na mesma linha (backup)
        if (powerBefore === 0 && line.match(/([\d.,]+)\s*(Ph\/s|Th\/s)/i)) {
          let cleanLine = line.replace(/Ph\/supgrade/gi, 'Ph/s ').replace(/Th\/supgrade/gi, 'Th/s ');
          const match = cleanLine.match(/([\d.,]+)\s*(Ph\/s|Th\/s)\s*([\d.,]+)\s*(Ph\/s|Th\/s)/i);
          if (match) {
            powerBefore = parseFloat(match[1].replace(',', '.'));
            powerAfter = parseFloat(match[3].replace(',', '.'));
            
            if (match[2].toLowerCase().includes('ph')) powerBefore *= 1000;
            if (match[4].toLowerCase().includes('ph')) powerAfter *= 1000;
            
            console.log(`  ⚡ Power (mesma linha): ${powerBefore.toFixed(2)} → ${powerAfter.toFixed(2)} Th/s`);
          }
        }
        
        // ===== BONUS ===== (CORRIGIDO para aceitar com/sem espaço)
        if ((line === 'Bonus Power' || line === 'Bonus') && bonusBefore === 0 && j + 1 < lines.length) {
          const nextLine = lines[j + 1];
          
          // CORREÇÃO: Aceitar "1.5% 4%" OU "1.5%4%" (com ou sem espaço)
          const match = nextLine.match(/([\d.,]+)%\s*([\d.,]+)%/);
          if (match) {
            bonusBefore = parseFloat(match[1].replace(',', '.'));
            bonusAfter = parseFloat(match[2].replace(',', '.'));
            console.log(`  💎 Bonus: ${bonusBefore}% → ${bonusAfter}%`);
          }
        }
        
        // Bonus na mesma linha (backup)
        if (bonusBefore === 0 && line.match(/([\d.,]+)%/) && !line.includes('Th/s') && !line.includes('Ph/s')) {
          const match = line.match(/([\d.,]+)%\s*([\d.,]+)%/);
          if (match) {
            bonusBefore = parseFloat(match[1].replace(',', '.'));
            bonusAfter = parseFloat(match[2].replace(',', '.'));
            console.log(`  💎 Bonus (mesma linha): ${bonusBefore}% → ${bonusAfter}%`);
          }
        }
        
        // ===== COMPONENTS ===== (SÓ PROCESSA DEPOIS DE TER POWER)
        if (line === 'Components:') {
          console.log(`  📋 Components detectado (Power atual: ${powerBefore.toFixed(2)})`);
          
          // Próximas linhas com X/Y
          for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
            const cLine = lines[k];
            
            console.log(`    [${k}] Analisando: "${cLine}"`);
            
            // Parar se encontrar "Price" ou "Merge"
            if (cLine.includes('Price') || cLine === 'Merge') {
              console.log(`  🛑 Parou em: ${cLine}`);
              break;
            }
            
            // Primeira linha X/Y = Miners
            if (cLine.match(/^\d+\/\d+$/) && !foundMinerQty) {
              const [have, need] = cLine.split('/').map(Number);
              minerQty = have;
              minerNeeded = need;
              foundMinerQty = true;
              console.log(`  🔢 Miners: ${have}/${need}`);
              continue;
            }
            
            // CORREÇÃO: Próximas 3 linhas X/Y = Parts (todas as 3, não para no primeiro)
            if (cLine.match(/^\d+\/\d+$/) && foundMinerQty && components.length < 3) {
              const [available, needed] = cLine.split('/').map(Number);
              components.push({ available, needed });
              
              const partNames = ['Fan', 'Wire', 'Hashboard'];
              const status = available >= needed ? '✅' : '❌';
              console.log(`  🔩 ${partNames[components.length - 1]}: ${available}/${needed} ${status}`);
              
              // CORREÇÃO: NÃO fazer break aqui! Continuar até pegar as 3 partes
              if (components.length === 3) {
                console.log(`  📊 Total de components coletados: ${components.length}`);
                break; // Só agora para
              }
            }
          }
          
          break; // Sair após processar Components
        }
      }
      
      // ===== VALIDAÇÃO =====
      const hasValidParts = components.length === 3;
      
      if (powerBefore > 0 && bonusBefore > 0 && foundMinerQty && hasValidParts) {
        const isPossible = minerQty >= minerNeeded && 
                          components.every(c => c.needed === 0 || c.available >= c.needed);
        
        merges.push({
          name: minerName,
          currentLevel: currentLevel,
          powerBefore: powerBefore,
          powerAfter: powerAfter,
          bonusBefore: bonusBefore,
          bonusAfter: bonusAfter,
          minerQty: minerQty,
          minerNeeded: minerNeeded,
          components: components,
          isPossible: isPossible
        });
        
        console.log(`  ${isPossible ? '✅ POSSÍVEL' : '❌ IMPOSSÍVEL'}`);
      } else {
        console.log(`  ⚠️  Rejeitado: power=${powerBefore.toFixed(2)}, bonus=${bonusBefore}, miners=${foundMinerQty}, parts=${components.length}`);
      }
    }
    
    console.log(`\n📊 Total: ${merges.length} merges encontrados`);
    return merges;
  }
};

window.MergeParser = MergeParser;
console.log('✅ MergeParser loaded (v2 - corrigido)');
