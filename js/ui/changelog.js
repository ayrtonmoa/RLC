// js/ui/changelog.js - Histórico completo de atualizações (fonte única, usada também
// pela prévia de 3 itens na aba Guia via UI_Changelog.renderPreview()).

const UI_Changelog = {
  updates: [
    {
      date: '26 Ago 2026', time: '21:07', tag: 'fix', label: 'CORREÇÃO',
      html: `<strong>Farm Calculator:</strong> removida a linha extra de "🐕 3x EVENTO" do DOGE.  Era um boost temporário anunciado em 19/08/2026, valia por 7 dias e já acabou, então a linha triplicada foi tirada da tabela de recompensas.`
    },
    {
      date: '26 Ago 2026', time: '20:41', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Catálogo de miners atualizado:</strong> 8.636 → 8.668 (37 novas, 5 removidas). 45 receitas de craft mudaram de verdade (fora reordenação): Bronze Core passou a pedir Hashboard em alguns níveis em vez de só cópias da própria miner, e vários eventos sazonais (RollerArc S1/SX, Milly, Milly Mini, Santa Sleigh, Jack-o'-Miner, Clover Lover, DOGER 420, entre outros) ficaram sem receita e com preço zerado, parecem descontinuados.
      <br><br><strong>Farm Calculator:</strong> block rewards revalidados nas 21 ligas. De <strong>Gold I até Diamond III</strong> tiveram reajuste; Bronze, Silver, Titan, Emerald e Legend seguem exatamente iguais. Cada célula mostra o valor <span style="color:#999;">antigo</span> em cima e o <strong>novo</strong> embaixo, com <span style="color:#28a745; font-weight:600;">▲ verde</span> pra aumento e <span style="color:#dc3545; font-weight:600;">▼ vermelho</span> pra queda; moeda sem mudança fica cinza, sem seta.
      <div style="overflow-x:auto; margin-top:10px;">
      ${(() => {
        const COINS = ['RLT','RST','BTC','LTC','BNB','POL','XRP','DOGE','ETH','TRX','SOL','ALGO','HMT','USDT'];
        const powerGoals = {
          'Bronze I':'0 GH/s', 'Bronze II':'25 PH/s', 'Bronze III':'50 PH/s',
          'Silver I':'100 PH/s', 'Silver II':'150 PH/s', 'Silver III':'250 PH/s',
          'Gold I':'650 PH/s', 'Gold II':'1.5 EH/s', 'Gold III':'3.5 EH/s',
          'Platinum I':'16 EH/s', 'Platinum II':'50 EH/s', 'Platinum III':'100 EH/s',
          'Diamond I':'200 EH/s', 'Diamond II':'375 EH/s', 'Diamond III':'650 EH/s',
          'Titan I':'1.15 ZH/s', 'Titan II':'2.16 ZH/s', 'Titan III':'4 ZH/s',
          'Emerald I':'13 ZH/s', 'Emerald II':'25 ZH/s', 'Emerald III':'70 ZH/s',
          'Legend':'1 YH/s'
        };
        const antes = {
          'Bronze I':     { RLT:3.0127, RST:160.6768, BTC:0.00000772, LTC:0.004825 },
          'Bronze II':    { RLT:0.5144, RST:77.1601, BTC:0.0000039, LTC:0.002922, BNB:0.000292 },
          'Bronze III':   { RLT:1.0196, RST:81.5663, BTC:0.00000441, LTC:0.002878, BNB:0.000504, POL:3.8369 },
          'Silver I':     { RLT:0.819, RST:51.1862, BTC:0.00000386, LTC:0.00193, BNB:0.000135, POL:1.3507, XRP:0.2412, USDT:0.1024 },
          'Silver II':    { RLT:0.5644, RST:51.3046, BTC:0.00000317, LTC:0.001922, BNB:0.000096, POL:0.9611, XRP:0.0961, DOGE:5.2862, USDT:0.2052 },
          'Silver III':   { RLT:2.0585, RST:154.3893, BTC:0.00000675, LTC:0.007235, BNB:0.000482, POL:2.8941, XRP:0.3859, DOGE:5.7881, ETH:0.000241, USDT:0.2573 },
          'Gold I':       { RLT:1.5916, RST:106.1038, BTC:0.0000121, LTC:0.004838, BNB:0.000726, POL:3.3866, XRP:0.2903, DOGE:7.7409, ETH:0.00029, TRX:1.9352, USDT:0.3714 },
          'Gold II':      { RLT:2.0937, RST:157.0244, BTC:0.00000631, LTC:0.002525, BNB:0.000486, POL:2.6219, XRP:0.1651, DOGE:7.7686, ETH:0.000272, TRX:2.0393, SOL:0.007769, HMT:68.0439, USDT:0.314 },
          'Gold III':     { RLT:4.2084, RST:263.0258, BTC:0.00002903, LTC:0.009677, BNB:0.001645, POL:6.7742, XRP:0.6774, DOGE:29.0323, ETH:0.000581, TRX:7.7419, SOL:0.020323, HMT:1630.7601, USDT:1.736 },
          'Platinum I':   { RLT:5.7428, RST:417.6555, BTC:0.00004164, LTC:0.019366, BNB:0.002275, POL:15.0083, XRP:1.2103, DOGE:31.9531, ETH:0.001288, TRX:22.7545, SOL:0.031953, ALGO:36.5449, HMT:4072.1415, USDT:3.1324 },
          'Platinum II':  { RLT:2.6586, RST:212.6904, BTC:0.00002714, LTC:0.012117, BNB:0.001454, POL:9.6936, XRP:0.9694, DOGE:24.2339, ETH:0.000969, TRX:16.4791, SOL:0.036836, ALGO:14.8883, HMT:3043.599, USDT:1.9142 },
          'Platinum III': { RLT:1.9093, RST:143.6189, BTC:0.00002134, LTC:0.010215, BNB:0.001312, POL:8.9078, XRP:0.7762, DOGE:22.262, ETH:0.000953, TRX:17.259, SOL:0.047063, ALGO:11.6387, HMT:3285.4745, USDT:2.0756 },
          'Diamond I':    { RST:94.2671, BTC:0.00001708, LTC:0.017757, BNB:0.001184, POL:12.6832, XRP:1.0569, DOGE:19.4476, ETH:0.000676, TRX:4.3123, SOL:0.010147, ALGO:21.6814, USDT:1.5083 },
          'Diamond II':   { RST:41.929, BTC:0.00002635, LTC:0.021252, BNB:0.00221, POL:11.9012, XRP:0.8926, DOGE:29.753, ETH:0.000595, TRX:3.4003, SOL:0.012751, ALGO:33.0773, USDT:2.7953 },
          'Diamond III':  { RST:22.8695, BTC:0.00001418, LTC:0.011406, BNB:0.001153, POL:6.3032, XRP:0.4725, DOGE:15.7344, ETH:0.000321, TRX:1.9373, SOL:0.006804, ALGO:17.359, USDT:1.3514 },
          'Titan I':      { RST:23.5358, BTC:0.00001455, LTC:0.011857, BNB:0.001199, POL:6.5601, XRP:0.4923, DOGE:16.3734, ETH:0.000332, TRX:2.0119, SOL:0.007063, ALGO:18.2403, USDT:1.3886 },
          'Titan II':     { RST:22.2312, BTC:0.00001123, LTC:0.009882, BNB:0.001011, POL:5.5026, XRP:0.4155, DOGE:14.0371, ETH:0.000281, TRX:1.6845, SOL:0.005952, ALGO:15.0643, USDT:1.161 },
          'Titan III':    { RST:38.2785, BTC:0.0000253, LTC:0.020656, BNB:0.002066, POL:11.4383, XRP:0.8392, DOGE:28.5313, ETH:0.000555, TRX:3.4857, SOL:0.012265, ALGO:31.4734, USDT:2.5519 },
          'Emerald I':    { RST:254.8733, BTC:0.00000324, LTC:0.004837, BNB:0.000194, POL:1.9348, XRP:0.2322, DOGE:3.3859, ETH:0.000097, TRX:0.8707, SOL:0.003289, ALGO:4.8936, USDT:0.9175 },
          'Emerald II':   { RST:204.3251, BTC:0.00000266, LTC:0.004836, BNB:0.000232, POL:1.6828, XRP:0.1934, DOGE:2.9015, ETH:0.000097, TRX:0.7737, SOL:0.002902, ALGO:4.0865, USDT:0.7662 },
          'Emerald III':  { RST:102.521, BTC:0.00000146, LTC:0.001653, BNB:0.000117, POL:0.9235, XRP:0.0826, DOGE:1.4581, ETH:0.000058, TRX:0.418, SOL:0.001458, ALGO:2.563, USDT:0.4101 },
          'Legend':       { RST:53.0994, BTC:0.00000084, LTC:0.00084, BNB:0.00005, POL:0.42, XRP:0.042, DOGE:0.714, ETH:0.000025, TRX:0.21, SOL:0.000672, ALGO:1.3275, USDT:0.2035 }
        };
        const depois = {
          'Bronze I':     antes['Bronze I'],
          'Bronze II':    antes['Bronze II'],
          'Bronze III':   antes['Bronze III'],
          'Silver I':     antes['Silver I'],
          'Silver II':    antes['Silver II'],
          'Silver III':   antes['Silver III'],
          'Gold I':       { RLT:1.5916, RST:106.1038, BTC:0.00001222, LTC:0.00489, BNB:0.000726, POL:3.268, XRP:0.2903, DOGE:7.818, ETH:0.00028, TRX:1.9352, USDT:0.3714 },
          'Gold II':      { RLT:2.0937, RST:157.0244, BTC:0.00000638, LTC:0.00255, BNB:0.000486, POL:2.53, XRP:0.1651, DOGE:7.846, ETH:0.000262, TRX:2.0393, SOL:0.0075, HMT:68.0439, USDT:0.314 },
          'Gold III':     { RLT:4.2084, RST:263.0258, BTC:0.00002932, LTC:0.00977, BNB:0.001645, POL:6.537, XRP:0.6774, DOGE:29.323, ETH:0.00056, TRX:7.7419, SOL:0.01961, HMT:1630.7601, USDT:1.736 },
          'Platinum I':   { RLT:5.7428, RST:417.6555, BTC:0.00004205, LTC:0.01956, BNB:0.002275, POL:14.483, XRP:1.2103, DOGE:32.273, ETH:0.001243, TRX:22.7545, SOL:0.03083, ALGO:36.5449, HMT:4072.1415, USDT:3.1324 },
          'Platinum II':  { RLT:2.6586, RST:212.6904, BTC:0.00002741, LTC:0.01224, BNB:0.001454, POL:9.6936, XRP:0.9694, DOGE:24.476, ETH:0.000935, TRX:16.4791, SOL:0.03555, ALGO:14.8883, HMT:3043.599, USDT:1.9142 },
          'Platinum III': { RLT:1.9093, RST:143.6189, BTC:0.00002155, LTC:0.01032, BNB:0.001312, POL:8.596, XRP:0.7762, DOGE:22.485, ETH:0.00092, TRX:17.259, SOL:0.04542, ALGO:11.6387, HMT:3285.4745, USDT:2.0756 },
          'Diamond I':    { RST:94.2671, BTC:0.00001725, LTC:0.01793, BNB:0.001184, POL:12.239, XRP:1.0569, DOGE:19.642, ETH:0.000653, TRX:4.3123, SOL:0.00979, ALGO:21.6814, USDT:1.5083 },
          'Diamond II':   { RST:41.929, BTC:0.00002662, LTC:0.02146, BNB:0.00221, POL:11.485, XRP:0.8926, DOGE:30.051, ETH:0.000574, TRX:3.4003, SOL:0.01231, ALGO:33.0773, USDT:2.7953 },
          'Diamond III':  { RST:22.8695, BTC:0.00001432, LTC:0.01152, BNB:0.001153, POL:6.083, XRP:0.4725, DOGE:15.892, ETH:0.00031, TRX:1.9373, SOL:0.00657, ALGO:17.359, USDT:1.3514 },
          'Titan I':      antes['Titan I'],
          'Titan II':     antes['Titan II'],
          'Titan III':    antes['Titan III'],
          'Emerald I':    antes['Emerald I'],
          'Emerald II':   antes['Emerald II'],
          'Emerald III':  antes['Emerald III'],
          'Legend':       antes['Legend']
        };
        // Evita notação científica (8.4e-7) e zeros à direita nos valores pequenos.
        const fmt = v => {
          let s = v < 0.0001 ? v.toFixed(8) : String(v);
          return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
        };
        const th = 'padding:4px 5px; font-size:10px; font-weight:600;';
        const linhas = Object.keys(depois).map(liga => {
          const celulas = COINS.map(coin => {
            const a = antes[liga]?.[coin], d = depois[liga][coin];
            if (d === undefined) {
              return `<td title="${coin}: não existe nesta liga" style="padding:2px 5px; text-align:right; color:#999; opacity:.6;">—</td>`;
            }
            const pct = (d - a) / a * 100;
            if (Math.abs(pct) < 0.05) {
              return `<td title="${coin}: sem mudança" style="padding:2px 5px; text-align:right; color:#999;">${fmt(d)}</td>`;
            }
            const subiu = pct > 0;
            const cor = subiu ? '#28a745' : '#dc3545';
            const sinal = (subiu ? '+' : '') + (Math.abs(pct) >= 10 ? pct.toFixed(0) : pct.toFixed(1)) + '%';
            return `<td title="${coin}: ${fmt(a)} → ${fmt(d)} (${sinal})" style="padding:2px 5px; text-align:right; line-height:1.3; white-space:nowrap; cursor:help;">
              <div style="color:#999;">${fmt(a)}</div>
              <div style="color:${cor}; font-weight:600;">${subiu ? '▲' : '▼'} ${fmt(d)}</div>
            </td>`;
          }).join('');
          return `<tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:2px 8px; white-space:nowrap;">${liga}</td>
            <td style="padding:2px 8px; text-align:right; color:#888; white-space:nowrap;">${powerGoals[liga]}</td>
            ${celulas}
          </tr>`;
        }).join('');
        return `<table style="border-collapse:collapse; font-size:10.5px; border:1px solid var(--border-color); border-radius:6px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-color); background:rgba(102,126,234,0.08);">
              <th style="${th} text-align:left;">Liga</th>
              <th style="${th} text-align:right;">Power goal</th>
              ${COINS.map(c => `<th style="${th} text-align:right;">${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>`;
      })()}
      </div>`
    },
    {
      date: '23 Ago 2026', time: '12:00', tag: 'new', label: 'NOVO',
      html: `<strong>SmartRoom: escolha o objetivo do Auto-Otimizar.</strong>  Agora existem dois modos, porque são duas coisas opostas que você pode querer, e antes o app decidia por você.
      <ul class="guia-tl-list">
        <li><strong>🚀 Máximo poder</strong> (padrão): reorganiza a sala inteira atrás do maior poder possível, movendo até miners que já estão instaladas.  É o modo pra descobrir o teto real da sua coleção.  Numa conta real chegou a 1.896 Zh/s, contra 1.885 Zh/s do outro modo, ao custo de 201 ações pra executar no jogo em vez de 132.</li>
        <li><strong>📌 Preservar sala</strong>: miner já instalada não sai do lugar, o inventário só entra nas vagas livres.  Só o teto de poder pode remover uma instalada.  Serve pra ajustar a liga sem desmontar a sala que já está pronta, e gera bem menos trabalho manual.  A escolha fica salva entre sessões.</li>
        <li><strong>Corrigido no caminho:</strong> o Auto-Otimizar estava <strong>perdendo miners</strong> quando havia teto de poder.  A etapa que devolve cada miner instalada ao rack de origem tirava todas de uma vez e recolocava em outra ordem.  Se alguma não coubesse mais por fragmentação (duas peças de 1 célula ocupando onde uma de 2 caberia), ela era silenciosamente descartada: sumia do plano, não voltava pro banco, e levava o poder dela junto.  Numa conta real isso jogava fora <strong>16 Eh/s</strong> e deixava 251 células vazias, fazendo o modo Máximo render <em>menos</em> que o Preservar, o que nunca deveria acontecer.  Depois da correção o Máximo subiu de 1.279 para <strong>1.295 Zh/s</strong> nesse cenário.</li>
        <li><strong>O app agora explica os racks com espaço sobrando.</strong>  Um rack com uma ou duas miners soltas parece erro do otimizador, ou culpa do bônus baixo daquele rack.  Quase sempre é o teto de poder segurando: sobra espaço físico, mas não sobra orçamento de poder.  Racks nessa situação ganham o selo <strong>🎯 teto</strong>, e o resumo do limite mostra a conta (num caso real: 2,9 Ph/s de folga contra 730 das 1.215 miners do banco que já passam disso sozinhas).</li>
      </ul>`
    },
    {
      date: '23 Ago 2026', time: '10:12', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Catálogo de miners atualizado</strong>: a base saiu de 8.594 para <strong>8.636</strong> registros, com <strong>42 miners novas</strong>: sete famílias de merge inteiras (Bronze Core, Hash Grill, Smthg Cooks, Cold Cut, Burnout, Chef Knife, Silver Knives), cada uma com os 6 tiers completos, do Common ao Unreal.
      <ul class="guia-tl-list">
        <li>6.152 miners existentes tiveram a <strong>oferta de mercado</strong> (quantas unidades existem em circulação) ressincronizada. Esse número muda o tempo todo no jogo, então a maior parte do catálogo tende a mudar um pouco a cada atualização, mesmo sem nenhuma miner nova.</li>
        <li>As receitas de merge continuam batendo: nenhuma mudança real de ingrediente, só o de sempre, normalização de apóstrofo e preservação de ordem quando o conteúdo é idêntico.</li>
        <li>Dados extraídos direto do jogo, combinando o catálogo com o forge.</li>
      </ul>`
    },
    {
      date: '21 Ago 2026', time: '21:28', tag: 'fix', label: 'CORREÇÃO',
      html: `<strong>"Poder sem Temporário" estava contando quase o total inteiro como permanente</strong> — faltava descontar o boost da <strong>Expedição do Hamster</strong>. Numa conta real, isso fez o SmartRoom achar que o limite de poder tinha estourado 108,3% (dizendo "passou 95 Eh/s do teto") quando na verdade o jogo mostrava só 95,6% de uso e ainda faltavam ~52 Eh/s pra próxima liga.
      <ul class="guia-tl-list">
        <li>A API do jogo expõe <code>hamster_expedition_bonus_power</code> como campo <strong>separado</strong> de <code>temp</code> — o boost do hamster não entra dentro do temporário comum. Numa conta real ele estava em 145,4 Eh/s (bem maior que os 0,22 Eh/s de <code>temp</code>), e como só descontávamos <code>temp</code>, "Poder sem Temporário" mostrava praticamente o total puro.</li>
        <li>Corrigido no cálculo central (<code>Utils.poderTemporario</code>), descontado sempre de <code>current_power</code> — o total já fechado pela API. <strong>Não</strong> do "Poder Calculado" (a soma manual de miners + bônus + racks): esse já tenta reconstruir o total pra ficar rápido (não espera o servidor recalcular após instalar/trocar miner), só que o boost do hamster já vem embutido dentro do poder de cada miner ali — subtrair de novo ali seria contar em dobro, o que gerou uma rodada extra de correção quando o "Poder Calculado" disparou 145 Eh/s <em>acima</em> do oficial.</li>
        <li>Testado contra uma conta real: Poder Total e Poder Calculado batem entre si (resíduo de 0,0000015%, ruído normal), e "Poder sem Temporário" bate com o que o jogo mostra na barra de progresso de liga — 1.099 Zh/s calculado contra 1.098 Zh/s do jogo.</li>
        <li>Ganhou um card "Expedição do Hamster" no detalhamento, só informativo (não entra em nenhuma soma), pra mostrar de onde vem esse número quando ele está ativo.</li>
      </ul>`
    },
    {
      date: '21 Ago 2026', time: '10:41', tag: 'fix', label: 'CORREÇÃO',
      html: `<strong>SmartRoom — miner já instalada não muda mais de rack sem necessidade.</strong> O Auto-Otimizar continuava reorganizando miners que já estavam na sala: uma instalada podia "trocar de lugar" com outra (ex: duas indo em faixas de bônus opostas, uma pra melhor e outra pra pior) mesmo sem nenhuma miner nova envolvida — puro reposicionamento por valor.
      <ul class="guia-tl-list">
        <li>Agora miner já instalada volta <strong>sempre pro próprio rack</strong>, sem disputar espaço por valor com outra instalada nem com o inventário. Só o <strong>corte por limite de poder</strong> pode tirá-la da sala — nunca realocá-la pra "um rack melhor".</li>
        <li>A consolidação sob limite apertado (que junta sobreviventes em menos racks) passa a mexer só nas <strong>miners do inventário</strong> que sobreviveram ao corte — instalada nunca entra nessa repacotagem.</li>
        <li>Faltava um caso: quando o corte tira uma miner e sobra espaço pra recolocar algo ali mesmo, essa recolocação jogava a miner pro primeiro rack qualquer com vaga, não pro rack dela — resultado prático era o mesmo "corta e recoloca em outro lugar", que parece um movimento sem sentido. Agora, se for instalada, a recolocação tenta primeiro devolver pro rack de origem.</li>
        <li>Testado numa conta real (1216 unidades de inventário): mirando o topo da Diamond III, e também da Diamond II (essa força cortar 102 miners, teste bem mais agressivo) — nos dois casos, <strong>0 movimentos</strong> entre instaladas. Só remoções (quando o limite obriga) e adições do inventário nas vagas livres. O teto de liga continua sendo respeitado nos dois.</li>
      </ul>`
    },
    {
      date: '20 Ago 2026', time: '22:29', tag: 'new', label: 'NOVO',
      html: `<strong>SmartRoom</strong> — aviso de cautela perto do limite de poder. O poder mostrado na simulação é uma <strong>estimativa local</strong>; o RollerCoin só confirma o valor real depois de recalcular no servidor. Perto do teto, essa margem de erro pode fazer você passar de liga sem perceber, principalmente instalando várias miners de uma vez antes de conferir o poder oficial.
      <ul class="guia-tl-list">
        <li>Quando o uso do teto passa de <strong>90%</strong>, aparece o aviso <em>"⚠️ Perto do teto — instale devagar"</em>, recomendando instalar (ou remover) <strong>uma miner por vez</strong>, esperar o jogo atualizar o poder oficial e reanalisar antes de continuar.</li>
        <li>Com folga maior que isso, o aviso não aparece — o erro de estimativa não muda decisão nenhuma quando ainda sobra muito espaço até o teto.</li>
      </ul>`
    },
    {
      date: '20 Ago 2026', time: '14:20', tag: 'fix', label: 'CORREÇÃO',
      html: `<strong>Poder acima de 1.000 Eh/s ficava preso na unidade errada</strong> — faltavam Zh/s e Yh/s na formatação de poder. Contas grandes mostravam "1025.648 Eh/s" em vez de "1.026 Zh/s" como o próprio jogo exibe: não era sobre escolher a unidade, a escala automática simplesmente não subia além de Eh/s.
      <ul class="guia-tl-list">
        <li>Corrigido na função central que toda a aba usa pra formatar poder — Resumo, SmartRoom, Inventário, MinerMerge, Racks e Buy passam a rolar pra Zh/s e Yh/s automaticamente, sem precisar tocar em cada tela.</li>
      </ul>`
    },
    {
      date: '20 Ago 2026', time: '14:01', tag: 'fix', label: 'CORREÇÃO',
      html: `<strong>SmartRoom — Auto-Otimizar fazia trocas desnecessárias.</strong> Racks com o mesmo bônus são intercambiáveis pro poder total (não importa qual guarda qual miner), mas o Auto-Otimizar reordenava tudo por valor a cada execução — então uma sala já ótima, sem nenhuma miner nova pra adicionar, ainda assim gerava "mover" pra praticamente toda miner instalada, só trocando de lugar entre racks equivalentes.
      <ul class="guia-tl-list">
        <li>Agora, depois que o algoritmo decide <em>quem</em> fica em cada faixa de bônus, uma passada final devolve cada miner pro rack onde ela já estava — só quem é novo na faixa (adicionado, ou movido de outra faixa porque valeu a pena) recebe um rack diferente.</li>
        <li>Num teste controlado (12 miners instaladas, nada novo no inventário), a lista de ações caiu de 12 "mover" pra <strong>0</strong>. Numa conta real com limite de poder ativo, os "mover" caíram de 14 pra 5 — os 9 a menos eram puro embaralhamento cosmético; "remover" e "adicionar" (as mudanças reais) ficaram idênticos.</li>
        <li>Trocas que genuinamente valem a pena (uma miner subindo pra um rack de bônus melhor que abriu espaço, por exemplo) continuam acontecendo normalmente.</li>
      </ul>`
    },
    {
      date: '20 Ago 2026', time: '10:20', tag: 'new', label: 'NOVO',
      html: `<strong>Poder sem Temporário</strong> — o poder que você realmente sustenta, agora explícito. O <strong>poder temporário não promove de liga</strong>: ele entra no total que o jogo mostra, mas expira. Antes você precisava fazer essa subtração de cabeça toda vez.
      <ul class="guia-tl-list">
        <li><strong>Resumo</strong> — card <em>🏆 Poder sem Temporário</em> logo abaixo do Poder Total, com a conta explicada. O card também avisa pra <strong>não confundir com o "Maximum power"</strong> do jogo: aquele é uma marca d'água do maior poder já registrado, só sobe e não desce quando você tira miner — por isso não serve pra responder "quanto eu tenho agora sem o boost".</li>
        <li><strong>SmartRoom — o limite de poder agora vale pro poder de liga</strong>, não mais pro total. Antes, com boost temporário ativo, o teto cortava miners por causa de um poder que nem promove: numa conta com 115 Eh/s de temporário, o teto de 649.999 removia <strong>19 Eh/s de miners</strong> enquanto a liga estava 96 Eh/s abaixo da faixa seguinte. Agora não corta nada nesse caso. Sem boost ativo o comportamento é exatamente o mesmo de antes.</li>
        <li><strong>SmartRoom</strong> — a comparação ganha a linha <em>Sem temporário → Estimado sem temporário</em>, junto do poder e do bônus, e o status do limite explica que o teto ignora o temporário.</li>
        <li><strong>Inventário</strong> — os cards Power Atual e Power Simulado ganham o valor de liga embaixo, pra não parecer que você mudou de faixa por causa de um bônus que vai expirar.</li>
        <li>O cálculo fica num só lugar (<code>Utils.poderSemTemporario</code>), então as três telas não têm como divergir entre si.</li>
        <li>O aviso de divergência entre "Poder Total" e "Poder Calculado" agora só aparece quando a diferença é <strong>relevante</strong> (acima de 0,01% do total). O limiar antigo era em Hz absoluto e disparava sempre em conta grande — somar ~70 valores que a própria API já arredonda individualmente sempre deixa um resíduo de ponto flutuante bem maior que esse teto, mesmo sem nada ter mudado. Não é o servidor atrasado, é ruído estrutural de somar partes já truncadas.</li>
      </ul>`
    },
    {
      date: '19 Ago 2026', time: '19:21', tag: 'new', label: 'NOVO',
      html: `<strong>Farm Calculator</strong> — três recursos novos e a página reorganizada.
      <ul class="guia-tl-list">
        <li><strong>Seletor de unidade no Mining Power.</strong> O campo era fixo em Eh/s, então testar um poder em outra escala exigia conversão de cabeça. Agora dá pra escolher entre Gh/s, Th/s, Ph/s, Eh/s, Zh/s e Yh/s e digitar direto na unidade em que você pensa. Trocar a unidade <em>converte</em> o número em vez de reinterpretá-lo — 585 Eh/s vira 0.585 Zh/s, o mesmo poder, e o resultado do cálculo não muda ao alternar. O histórico e o gráfico passam a exibir na unidade escolhida, mas continuam guardados numa unidade só por baixo, então pesquisas antigas seguem comparáveis com as novas.</li>
        <li><strong>Simulador de liga.</strong> Dá pra escolher qualquer liga no seletor ao lado do nome da sua e ver quanto renderia lá, em vez de ficar preso à liga do perfil pesquisado — é só pegar o power da rede que alguém daquela liga compartilhou, colar no campo da rede e escolher a liga. Enquanto a simulação está ativa a barra fica âmbar com o selo <strong>🔬 SIMULAÇÃO</strong>, e ela <strong>não entra no histórico</strong>, que continua guardando só as suas pesquisas de verdade.</li>
        <li><strong>Evento DOGE 3x.</strong> O RollerCoin triplicou as recompensas de DOGE em todas as ligas por 7 dias (anunciado em 19/08, vale até por volta de <strong>26/08</strong>), então a tabela ganhou uma linha extra logo abaixo do DOGE normal, com o selo <span style="background:#ffc107; color:#000; font-weight:700; font-size:11px; padding:1px 5px; border-radius:3px;">🐕 3x EVENTO</span> e os valores já multiplicados, pra comparar lado a lado. É só exibição: não mexe no CSV nem no tempo de saque, e sai quando o evento acabar.</li>
        <li><strong>Página reorganizada.</strong> A mesma moeda aparecia três vezes seguidas antes de surgir qualquer informação nova: o card "Melhor Crypto", o pódio "Top 3 Cryptos" (cujo 1º lugar era exatamente a Melhor Crypto) e a tabela. Os dois blocos viraram um só — vencedora em destaque, 2º e 3º logo abaixo — e o gráfico desceu pra junto do Histórico, de onde vêm os dados dele. Ordem agora: entrada → liga → comparação → recomendação → tabela → saque → histórico e gráfico → cotações.</li>
      </ul>`
    },
    {
      date: '19 Ago 2026', time: '19:21', tag: 'fix', label: 'CORREÇÃO',
      html: `<strong>Cores do modo escuro no Farm Calculator e dois bugs do Auto-Otimizar.</strong>
      <ul class="guia-tl-list">
        <li><strong>Farm Calculator sem cor no modo escuro.</strong> Uma regra de CSS forçava <em>todo</em> elemento da aba pro mesmo cinza. Ela apagava o selo <strong>🏆 TOP</strong> (a queixa visível), mas junto levava os selos Game/Crypto/Não sacável, os dias de saque em verde/laranja/vermelho e os valores das cotações. Tudo voltou a ter cor. O <strong>gráfico</strong> também não acompanhava a troca de tema — as cores ficavam gravadas no momento em que ele era desenhado, então quem calculava no escuro e mudava pro claro via texto claro em fundo branco. Agora ele é redesenhado junto, e ganhou título nos dois eixos, já que as duas linhas têm escalas independentes.</li>
        <li><strong>SmartRoom, sets duplicados em mais de um rack.</strong> Quem tem 2 ou mais racks do mesmo Set (ex: duas Lost Treasure Rack) podia ver o Auto-Otimizar confundir os racks entre si — uma peça a mais em um rack expulsava uma peça diferente e necessária no outro, quebrando um bônus que já estava completo, ou o segundo rack nunca era considerado prioridade pra fechar o set. Agora cada rack físico é tratado de forma independente, então os dois (ou mais) fecham corretamente.</li>
        <li><strong>SmartRoom, miners espalhadas ao usar limite de poder.</strong> Ao definir um teto de poder pra sala (ex: pra não passar de liga), o corte das miners excedentes deixava as sobreviventes espalhadas por dezenas de racks pela sala inteira — sobra de um preenchimento que originalmente ocupava tudo — em vez de juntar tudo nos racks de maior bônus. Agora o Auto-Otimizar recompacta a sala depois do corte, ocupando bem menos racks e sempre respeitando o limite definido.</li>
      </ul>`
    },
    {
      date: '19 Ago 2026', time: '10:13', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Catálogo de miners atualizado</strong> — a base saiu de 8.220 para <strong>8.594</strong> registros, com <strong>374 miners novas</strong> que o jogo lançou e o app ainda não conhecia. Entre elas <em>Mystic Void</em>, <em>Corsair's Oath</em>, <em>Coin's Seal</em>, <em>Crewmark</em>, <em>Diamondfall</em>, <em>Sushi Stop</em> e as demais da linha pirata — miners que apareciam no seu inventário sem poder, receita ou imagem.
      <ul class="guia-tl-list">
        <li>A <strong>Sushi Stop</strong> é um bom exemplo do efeito: ela é peça do Roadside Stars Set (adicionado ontem) e agora o SmartRoom a reconhece como tal, com poder e receita corretos.</li>
        <li>As <strong>receitas não mudaram</strong>: das 6.885 conferidas, nenhuma teve alteração real de ingrediente. As diferenças eram só ordem de listagem e apóstrofo tipográfico.</li>
        <li>43 merges antigos (RollerArc, Milly, Santa Sleigh…) tiveram o <strong>poder rebalanceado pelo jogo</strong> — em média +14% — e agora batem com o valor real.</li>
        <li>Corrigidos 18 nomes que estavam com apóstrofo diferente do que o jogo usa hoje (<em>King's Legacy</em>, <em>Devil's Ember</em>, <em>Hashbeard's Ship</em>), o que atrapalhava o reconhecimento ao colar o inventário.</li>
        <li>Dados obtidos por extração direta do jogo, combinando o catálogo (atributos e imagens) com o forge (receitas e preços).</li>
      </ul>`
    },
    {
      date: '18 Ago 2026', time: '21:00', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Sets atualizados</strong> — a base de sets estava em 14 e o jogo já tem <strong>17</strong>. Entraram <strong>The Lost Treasure</strong> (rack The Lost Treasure Rack 8; peças Manners &amp; Mayhem, Gilded Greed, Wrongway Atlas e Drama Chest), <strong>Roadside Stars</strong> (Roadside Rack 8; Taco Turn, Burger Boulevard, Hot Dog Highway e Sushi Stop) e <strong>Beach</strong> (Beach Rack 8; Mine-a Colada, Tai One On, Bartender e Salt &amp; Vault). Sem esses dados o SmartRoom era cego pra eles: não somava o bônus e, no corte por limite de poder, podia descartar uma peça sem perceber que derrubava a faixa inteira do set.
      <ul class="guia-tl-list">
        <li>As faixas dos 14 sets que já existiam foram conferidas uma a uma contra a página do jogo — <strong>todas batiam</strong>, nenhuma tinha ficado desatualizada.</li>
        <li>Lembrete de como o bônus funciona: só a faixa <strong>máxima</strong> do set conta, e é tudo-ou-nada — com uma peça faltando o bônus vai a zero, sem faixa intermediária de consolação. Nos sets de 3 faixas (Lost Treasure, Roadside Stars, Beach, Radio) isso significa que valem as 4 peças completas.</li>
      </ul>`
    },
    {
      date: '18 Ago 2026', time: '20:30', tag: 'new', label: 'NOVO',
      html: `<strong>SmartRoom</strong> — <strong>limite de poder da sala</strong>. Dá pra definir um teto (ex: <code>300 PH/s</code>) com seletor de unidade — GH/s, TH/s, PH/s, EH/s, ZH/s ou YH/s — e o <strong>Auto-Otimizar</strong> passa a montar a melhor sala possível <em>sem ultrapassar esse valor</em>, útil pra segurar a liga em vez de sempre buscar o poder máximo.
      <ul class="guia-tl-list">
        <li>O teto vale pro poder <strong>total</strong> (base + bônus de coleção, sets e racks) — o mesmo número que o jogo mostra e que decide a liga.</li>
        <li>Atalho <strong>"🏆 quer ficar no topo de qual liga?"</strong>: escolhe a liga e o teto se preenche sozinho, usando os power goals que o Farm Calculator já mantém. Ficar no <em>topo</em> de uma liga significa parar logo abaixo da meta da liga seguinte — escolher Diamond II preenche 649.999 EH/s, porque a Diamond III começa em 650 EH/s.</li>
        <li>Quando precisa cortar, sai sempre a miner de <strong>menor impacto</strong>, uma por vez — assim para o mais perto possível do teto e, de quebra, protege as <strong>peças de set</strong> (que têm impacto altíssimo e só saem em último caso, evitando derrubar uma faixa de bônus inteira por engano).</li>
        <li>Depois do corte, uma passada de <strong>recomposição</strong> devolve miners do banco enquanto couberem na folga que sobrou — nos testes com inventário real, o resultado fica a menos de <em>0,01%</em> do limite.</li>
        <li>A simulação mostra quanto do limite está sendo usado e a folga que sobrou (ex: <em>usando 99.2%, folga de 2.500 Ph/s</em>).</li>
        <li>Se o limite for menor que o poder fixo da conta (games/temp), o aviso explica que não dá pra respeitar só tirando miners.</li>
        <li>A unidade já abre na escala do seu poder atual (com 635 EH/s na conta, o seletor abre em EH/s em vez de PH/s) — evita digitar <code>300</code> pensando em EH, capar a sala em 0.3 EH e não entender por que ela esvaziou. É só sugestão inicial: o que você salvar prevalece.</li>
        <li>Ao abrir a aba <strong>não vem limite nenhum</strong> — sem teto, o Auto-Otimizar funciona exatamente como antes. O valor fica salvo entre sessões e pode ser removido no ✕.</li>
      </ul>`
    },
    {
      date: '18 Ago 2026', time: '15:58', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Farm Calculator</strong> — RollerCoin trocou os IDs de todas as ligas, reajustou os block rewards de <strong>todas as moedas</strong> das 15 ligas existentes e criou <strong>7 ligas novas</strong>: Titan I-III, Emerald I-III e Legend. Cada célula mostra o valor <span style="color:#999;">antigo</span> em cima e o <strong>novo</strong> embaixo, com <span style="color:#28a745; font-weight:600;">▲ verde</span> pra aumento e <span style="color:#dc3545; font-weight:600;">▼ vermelho</span> pra queda. As ligas novas aparecem em <span style="color:#667eea; font-weight:600;">roxo</span> (não têm valor anterior) e <strong>—</strong> significa que a moeda não existe naquela liga.
      <div style="overflow-x:auto; margin-top:10px;">
      ${(() => {
        const COINS = ['RLT','RST','BTC','LTC','BNB','POL','XRP','DOGE','ETH','TRX','SOL','ALGO','HMT','USDT'];
        const powerGoals = {
          'Bronze I':'0 GH/s', 'Bronze II':'25 PH/s', 'Bronze III':'50 PH/s',
          'Silver I':'100 PH/s', 'Silver II':'150 PH/s', 'Silver III':'250 PH/s',
          'Gold I':'650 PH/s', 'Gold II':'1.5 EH/s', 'Gold III':'3.5 EH/s',
          'Platinum I':'16 EH/s', 'Platinum II':'50 EH/s', 'Platinum III':'100 EH/s',
          'Diamond I':'200 EH/s', 'Diamond II':'375 EH/s', 'Diamond III':'650 EH/s',
          'Titan I':'1.15 ZH/s', 'Titan II':'2.16 ZH/s', 'Titan III':'4 ZH/s',
          'Emerald I':'13 ZH/s', 'Emerald II':'25 ZH/s', 'Emerald III':'70 ZH/s',
          'Legend':'1 YH/s'
        };
        const antes = {
          'Bronze I':   { RLT:0.76, RST:48, BTC:0.00000201, LTC:0.0015 },
          'Bronze II':  { RLT:1.4, RST:86, BTC:0.00000411, LTC:0.00269, BNB:0.0007 },
          'Bronze III': { RLT:1.55, RST:117, BTC:0.00000759, LTC:0.0049, BNB:0.00087, POL:6.73 },
          'Silver I':   { RLT:0.91, RST:69, BTC:0.00000456, LTC:0.0027, BNB:0.000436, POL:3.27, XRP:0.257, USDT:0.14287 },
          'Silver II':  { RLT:1.07, RST:81, BTC:0.00000492, LTC:0.00279, BNB:0.00042, POL:2.99, XRP:0.228, DOGE:5.5616, USDT:0.195529 },
          'Silver III': { RLT:0.88, RST:66, BTC:0.00000439, LTC:0.00237, BNB:0.000338, POL:2.29, XRP:0.167, DOGE:3.8405, ETH:0.0001958, USDT:0.274038 },
          'Gold I':     { RLT:0.66, RST:50, BTC:0.00000395, LTC:0.002, BNB:0.000227, POL:1.53, XRP:0.11691, DOGE:2.84, ETH:0.000117, TRX:1.8582, USDT:0.151647 },
          'Gold II':    { RLT:1.06, RST:80, BTC:0.00000657, LTC:0.0027, BNB:0.000285, POL:1.736, XRP:0.1342, DOGE:3.486, ETH:0.0001268, TRX:2.042, SOL:0.00788, HMT:625, USDT:0.274038 },
          'Gold III':   { RLT:2.72, RST:204, BTC:0.00001831, LTC:0.0084, BNB:0.000902, POL:5.851, XRP:0.4684, DOGE:12.382, ETH:0.0004778, TRX:7.695, SOL:0.02101, HMT:1528, USDT:1 },
          'Platinum I':   { RLT:5.575, RST:420, BTC:0.00004573, LTC:0.0217, BNB:0.002404, POL:16.134, XRP:1.3195, DOGE:36.223, ETH:0.001443, TRX:23.827, SOL:0.03371, ALGO:33.992, HMT:3875, USDT:2.902 },
          'Platinum II':  { RLT:2.481, RST:187, BTC:0.0000266, LTC:0.0126, BNB:0.001454, POL:9.929, XRP:0.8336, DOGE:23.522, ETH:0.0009555, TRX:16.193, SOL:0.03519, ALGO:13.508, HMT:2863, USDT:1.723 },
          'Platinum III': { RLT:1.504, RST:113.13, BTC:0.00001893, LTC:0.0091, BNB:0.001101, POL:7.747, XRP:0.675, DOGE:19.748, ETH:0.0008288, TRX:14.485, SOL:0.0395, ALGO:9.168, HMT:2588, USDT:1.635 },
          'Diamond I':   { RST:113, BTC:0.00002064, LTC:0.0219, BNB:0.001423, POL:16.91, XRP:1.257, DOGE:23.362, ETH:0.000858, TRX:5.01, SOL:0.01231, ALGO:23, USDT:1.627 },
          'Diamond II':  { RST:45.59218, BTC:0.00003159, LTC:0.0259, BNB:0.002487, POL:14.044, XRP:1.0396, DOGE:35.755, ETH:0.0007118, TRX:4.164, SOL:0.01468, ALGO:35.088, USDT:2.7 },
          'Diamond III': { RST:352, BTC:0.0000046, LTC:0.00561, BNB:0.000455, POL:3.479, XRP:0.28, DOGE:5.164, ETH:0.000215, TRX:1.557, SOL:0.00546, ALGO:8.18484, USDT:1.38888 }
        };
        const depois = {
          'Bronze I':   { RLT:3.0127, RST:160.6768, BTC:0.00000772, LTC:0.004825 },
          'Bronze II':  { RLT:0.5144, RST:77.1601, BTC:0.0000039, LTC:0.002922, BNB:0.000292 },
          'Bronze III': { RLT:1.0196, RST:81.5663, BTC:0.00000441, LTC:0.002878, BNB:0.000504, POL:3.8369 },
          'Silver I':   { RLT:0.819, RST:51.1862, BTC:0.00000386, LTC:0.00193, BNB:0.000135, POL:1.3507, XRP:0.2412, USDT:0.1024 },
          'Silver II':  { RLT:0.5644, RST:51.3046, BTC:0.00000317, LTC:0.001922, BNB:0.000096, POL:0.9611, XRP:0.0961, DOGE:5.2862, USDT:0.2052 },
          'Silver III': { RLT:2.0585, RST:154.3893, BTC:0.00000675, LTC:0.007235, BNB:0.000482, POL:2.8941, XRP:0.3859, DOGE:5.7881, ETH:0.000241, USDT:0.2573 },
          'Gold I':     { RLT:1.5916, RST:106.1038, BTC:0.0000121, LTC:0.004838, BNB:0.000726, POL:3.3866, XRP:0.2903, DOGE:7.7409, ETH:0.00029, TRX:1.9352, USDT:0.3714 },
          'Gold II':    { RLT:2.0937, RST:157.0244, BTC:0.00000631, LTC:0.002525, BNB:0.000486, POL:2.6219, XRP:0.1651, DOGE:7.7686, ETH:0.000272, TRX:2.0393, SOL:0.007769, HMT:68.0439, USDT:0.314 },
          'Gold III':   { RLT:4.2084, RST:263.0258, BTC:0.00002903, LTC:0.009677, BNB:0.001645, POL:6.7742, XRP:0.6774, DOGE:29.0323, ETH:0.000581, TRX:7.7419, SOL:0.020323, HMT:1630.7601, USDT:1.736 },
          'Platinum I':   { RLT:5.7428, RST:417.6555, BTC:0.00004164, LTC:0.019366, BNB:0.002275, POL:15.0083, XRP:1.2103, DOGE:31.9531, ETH:0.001288, TRX:22.7545, SOL:0.031953, ALGO:36.5449, HMT:4072.1415, USDT:3.1324 },
          'Platinum II':  { RLT:2.6586, RST:212.6904, BTC:0.00002714, LTC:0.012117, BNB:0.001454, POL:9.6936, XRP:0.9694, DOGE:24.2339, ETH:0.000969, TRX:16.4791, SOL:0.036836, ALGO:14.8883, HMT:3043.599, USDT:1.9142 },
          'Platinum III': { RLT:1.9093, RST:143.6189, BTC:0.00002134, LTC:0.010215, BNB:0.001312, POL:8.9078, XRP:0.7762, DOGE:22.262, ETH:0.000953, TRX:17.259, SOL:0.047063, ALGO:11.6387, HMT:3285.4745, USDT:2.0756 },
          'Diamond I':   { RST:94.2671, BTC:0.00001708, LTC:0.017757, BNB:0.001184, POL:12.6832, XRP:1.0569, DOGE:19.4476, ETH:0.000676, TRX:4.3123, SOL:0.010147, ALGO:21.6814, USDT:1.5083 },
          'Diamond II':  { RST:41.929, BTC:0.00002635, LTC:0.021252, BNB:0.00221, POL:11.9012, XRP:0.8926, DOGE:29.753, ETH:0.000595, TRX:3.4003, SOL:0.012751, ALGO:33.0773, USDT:2.7953 },
          'Diamond III': { RST:22.8695, BTC:0.00001418, LTC:0.011406, BNB:0.001153, POL:6.3032, XRP:0.4725, DOGE:15.7344, ETH:0.000321, TRX:1.9373, SOL:0.006804, ALGO:17.359, USDT:1.3514 },
          'Titan I':     { RST:23.5358, BTC:0.00001455, LTC:0.011857, BNB:0.001199, POL:6.5601, XRP:0.4923, DOGE:16.3734, ETH:0.000332, TRX:2.0119, SOL:0.007063, ALGO:18.2403, USDT:1.3886 },
          'Titan II':    { RST:22.2312, BTC:0.00001123, LTC:0.009882, BNB:0.001011, POL:5.5026, XRP:0.4155, DOGE:14.0371, ETH:0.000281, TRX:1.6845, SOL:0.005952, ALGO:15.0643, USDT:1.161 },
          'Titan III':   { RST:38.2785, BTC:0.0000253, LTC:0.020656, BNB:0.002066, POL:11.4383, XRP:0.8392, DOGE:28.5313, ETH:0.000555, TRX:3.4857, SOL:0.012265, ALGO:31.4734, USDT:2.5519 },
          'Emerald I':   { RST:254.8733, BTC:0.00000324, LTC:0.004837, BNB:0.000194, POL:1.9348, XRP:0.2322, DOGE:3.3859, ETH:0.000097, TRX:0.8707, SOL:0.003289, ALGO:4.8936, USDT:0.9175 },
          'Emerald II':  { RST:204.3251, BTC:0.00000266, LTC:0.004836, BNB:0.000232, POL:1.6828, XRP:0.1934, DOGE:2.9015, ETH:0.000097, TRX:0.7737, SOL:0.002902, ALGO:4.0865, USDT:0.7662 },
          'Emerald III': { RST:102.521, BTC:0.00000146, LTC:0.001653, BNB:0.000117, POL:0.9235, XRP:0.0826, DOGE:1.4581, ETH:0.000058, TRX:0.418, SOL:0.001458, ALGO:2.563, USDT:0.4101 },
          'Legend':      { RST:53.0994, BTC:0.00000084, LTC:0.00084, BNB:0.00005, POL:0.42, XRP:0.042, DOGE:0.714, ETH:0.000025, TRX:0.21, SOL:0.000672, ALGO:1.3275, USDT:0.2035 }
        };
        // Evita notação científica (8.4e-7) e zeros à direita nos valores pequenos.
        const fmt = v => {
          let s = v < 0.0001 ? v.toFixed(8) : String(v);
          return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
        };
        const th = 'padding:4px 5px; font-size:10px; font-weight:600;';
        const linhas = Object.keys(depois).map(liga => {
          const isNova = antes[liga] === undefined;
          const celulas = COINS.map(coin => {
            const a = antes[liga]?.[coin], d = depois[liga][coin];
            if (d === undefined) {
              return `<td title="${coin}: não existe nesta liga" style="padding:2px 5px; text-align:right; color:#999; opacity:.6;">—</td>`;
            }
            if (isNova) {
              return `<td style="padding:2px 5px; text-align:right; color:#667eea; font-weight:600;">${fmt(d)}</td>`;
            }
            const pct = (d - a) / a * 100;
            if (Math.abs(pct) < 0.05) {
              return `<td title="${coin}: sem mudança" style="padding:2px 5px; text-align:right; color:#999;">${fmt(d)}</td>`;
            }
            const subiu = pct > 0;
            const cor = subiu ? '#28a745' : '#dc3545';
            const sinal = (subiu ? '+' : '') + (Math.abs(pct) >= 10 ? pct.toFixed(0) : pct.toFixed(1)) + '%';
            return `<td title="${coin}: ${fmt(a)} → ${fmt(d)} (${sinal})" style="padding:2px 5px; text-align:right; line-height:1.3; white-space:nowrap; cursor:help;">
              <div style="color:#999;">${fmt(a)}</div>
              <div style="color:${cor}; font-weight:600;">${subiu ? '▲' : '▼'} ${fmt(d)}</div>
            </td>`;
          }).join('');
          return `<tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:2px 8px; white-space:nowrap;">${liga}${isNova ? ' <span style="font-size:9px; color:#667eea; font-weight:600;">NOVA</span>' : ''}</td>
            <td style="padding:2px 8px; text-align:right; color:#888; white-space:nowrap;">${powerGoals[liga]}</td>
            ${celulas}
          </tr>`;
        }).join('');
        return `<table style="border-collapse:collapse; font-size:10.5px; border:1px solid var(--border-color); border-radius:6px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-color); background:rgba(102,126,234,0.08);">
              <th style="${th} text-align:left;">Liga</th>
              <th style="${th} text-align:right;">Power goal</th>
              ${COINS.map(c => `<th style="${th} text-align:right;">${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>`;
      })()}
      </div>`
    },
    {
      date: '08 Ago 2026', time: '11:12', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Farm Calculator</strong> — block rewards das ligas Gold I até Diamond II atualizados. Cada mini-tabela abaixo lista <strong>todas</strong> as moedas da liga; as que mudaram aparecem em destaque com antes/depois, as que ficaram iguais aparecem esmaecidas.
      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
      ${(() => {
        // [moeda, antes, depois] — quando antes === depois, a moeda não mudou.
        const ligas = [
          ['Gold I', [
            ['RLT','0.66','0.66'], ['RST','50','50'],
            ['BTC','0.00000388','0.00000395'], ['LTC','0.001927','0.002'], ['BNB','0.000235','0.000227'],
            ['POL','1.53','1.53'], ['XRP','0.11691','0.11691'], ['DOGE','2.785','2.84'], ['ETH','0.000117','0.000117'],
            ['TRX','1.9256','1.8582'], ['USDT','0.151647','0.151647'],
          ]],
          ['Gold II', [
            ['RLT','1.06','1.06'], ['RST','80','80'],
            ['BTC','0.00000644','0.00000657'], ['LTC','0.002642','0.0027'], ['BNB','0.000295','0.000285'],
            ['POL','1.736','1.736'], ['XRP','0.1342','0.1342'], ['DOGE','3.418','3.486'], ['ETH','0.0001268','0.0001268'],
            ['TRX','2.1158','2.042'], ['SOL','0.00817','0.00788'], ['HMT','625','625'], ['USDT','0.274038','0.274038'],
          ]],
          ['Gold III', [
            ['RLT','2.72','2.72'], ['RST','204','204'],
            ['BTC','0.00001795','0.00001831'], ['LTC','0.008242','0.0084'], ['BNB','0.000935','0.000902'],
            ['POL','5.851','5.851'], ['XRP','0.4684','0.4684'], ['DOGE','12.139','12.382'], ['ETH','0.0004778','0.0004778'],
            ['TRX','7.9736','7.695'], ['SOL','0.02177','0.02101'], ['HMT','1528','1528'], ['USDT','1','1'],
          ]],
          ['Platinum I', [
            ['RLT','5.575','5.575'], ['RST','420','420'],
            ['BTC','0.00004483','0.00004573'], ['LTC','0.021277','0.0217'], ['BNB','0.002492','0.002404'],
            ['POL','16.134','16.134'], ['XRP','1.3195','1.3195'], ['DOGE','35.512','36.223'], ['ETH','0.001443','0.001443'],
            ['TRX','24.6909','23.827'], ['SOL','0.03493','0.03371'], ['ALGO','33.992','33.992'], ['HMT','3875','3875'], ['USDT','2.902','2.902'],
          ]],
          ['Platinum II', [
            ['RLT','2.481','2.481'], ['RST','187','187'],
            ['BTC','0.00002608','0.0000266'], ['LTC','0.012373','0.0126'], ['BNB','0.001506','0.001454'],
            ['POL','9.929','9.929'], ['XRP','0.8336','0.8336'], ['DOGE','23.061','23.522'], ['ETH','0.0009555','0.0009555'],
            ['TRX','16.7807','16.193'], ['SOL','0.03647','0.03519'], ['ALGO','13.508','13.508'], ['HMT','2863','2863'], ['USDT','1.723','1.723'],
          ]],
          ['Platinum III', [
            ['RLT','1.504','1.504'], ['RST','113.13','113.13'],
            ['BTC','0.00001856','0.00001893'], ['LTC','0.008884','0.0091'], ['BNB','0.001141','0.001101'],
            ['POL','7.747','7.747'], ['XRP','0.675','0.675'], ['DOGE','19.361','19.748'], ['ETH','0.0008288','0.0008288'],
            ['TRX','15.0101','14.485'], ['SOL','0.04093','0.0395'], ['ALGO','9.168','9.168'], ['HMT','2588','2588'], ['USDT','1.635','1.635'],
          ]],
          ['Diamond I', [
            ['RST','113','113'],
            ['BTC','0.00002024','0.00002064'], ['LTC','0.021512','0.0219'], ['BNB','0.001475','0.001423'],
            ['POL','16.91','16.91'], ['XRP','1.257','1.257'], ['DOGE','22.904','23.362'], ['ETH','0.000858','0.000858'],
            ['TRX','5.1919','5.01'], ['SOL','0.01276','0.01231'], ['ALGO','23','23'], ['USDT','1.627','1.627'],
          ]],
          ['Diamond II', [
            ['RST','45.59218','45.59218'],
            ['BTC','0.00003097','0.00003159'], ['LTC','0.025398','0.0259'], ['BNB','0.002578','0.002487'],
            ['POL','14.044','14.044'], ['XRP','1.0396','1.0396'], ['DOGE','35.054','35.755'], ['ETH','0.0007118','0.0007118'],
            ['TRX','4.3154','4.164'], ['SOL','0.01521','0.01468'], ['ALGO','35.088','35.088'], ['USDT','2.7','2.7'],
          ]],
        ];
        return ligas.map(([liga, moedas]) => `
          <table style="table-layout:fixed; border-collapse:collapse; font-size:10.5px; border:1px solid var(--border-color); border-radius:6px; overflow:hidden; flex:0 0 230px; width:230px;">
            <colgroup><col style="width:38px;"><col style="width:96px;"><col style="width:96px;"></colgroup>
            <thead>
              <tr style="border-bottom:1px solid var(--border-color); background:rgba(102,126,234,0.08);">
                <th colspan="3" style="text-align:left; padding:5px 8px; font-size:11px;">${liga}</th>
              </tr>
            </thead>
            <tbody>
              ${moedas.map(([moeda, antes, depois]) => {
                const mudou = antes !== depois;
                const subiu = mudou && parseFloat(depois) > parseFloat(antes);
                const cor = subiu ? '#28a745' : '#dc3545';
                return `<tr style="border-bottom:1px solid var(--border-color); ${mudou ? '' : 'opacity:.45;'}">
                  <td style="padding:3px 6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${moeda}</td>
                  <td style="padding:3px 4px; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${mudou ? antes : '—'}</td>
                  <td style="padding:3px 6px; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; ${mudou ? `font-weight:600; color:${cor};` : ''}">${mudou ? '→ ' + depois : 'sem mudança'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`).join('');
      })()}
      </div>`
    },
    {
      date: '07 Ago 2026', time: '15:11', tag: 'improved', label: 'MELHORIA',
      html: `<strong>MinerMerge</strong> reformulado e <strong>correções de layout mobile</strong>:
      <ul class="guia-tl-list">
        <li><strong>Layout em linhas com abas</strong> — os merges saem do formato de card denso (3 colunas com 8+ blocos de informação cada) e viram uma lista de linhas compactas, uma categoria (Prontos/Falta peças/Falta miners) por vez via abas. Os níveis que você já possui ficam sempre visíveis na linha; o resto (ingredientes, power detalhado, projeções) expande com um clique.</li>
        <li><strong>% do seu poder atual</strong> — o impacto real de cada merge agora também mostra quanto isso representa em percentual do poder total da sala, pra ficar claro quando um ganho é insignificante mesmo parecendo bom isoladamente.</li>
        <li><strong>Potencial da cadeia completa</strong> — além do próximo tier, cada merge mostra o custo e o impacto real projetado de seguir fundindo até o tier máximo; novo modo de ordenação "🔗 Cadeia completa" usa esse número.</li>
        <li><strong>Alcance real com o que você tem</strong> — com base na quantidade real de cópias no inventário/sala, mostra até onde dá pra subir só fundindo (somando duplicatas que você já possui em níveis intermediários no caminho) e quanto custa em RLT.</li>
        <li><strong>Correção</strong> — o impacto real negativo aparecia sem o sinal de "−" (parecia positivo); e um merge com impacto negativo podia ganhar a badge "🟢 Ótimo" por ser só "menos ruim" que os outros do grupo — agora tem piso absoluto (⛔ Prejudica a sala).</li>
        <li><strong>Menu recolhível no mobile</strong> — a barra lateral, antes sempre fixa, virou um menu off-canvas com botão ☰ abaixo de 768px, liberando a largura da tela.</li>
        <li><strong>Correção de rolagem horizontal</strong> — <code>.main-content</code> não encolhia abaixo do conteúdo mais largo (ex: grade de racks do SmartRoom), forçando a página inteira a alargar em vez de rolar só internamente; grids fixos de N colunas (stepper do Inventário, filtros, cards de simulação) agora empilham em telas estreitas.</li>
      </ul>`
    },
    {
      date: '30 Jul 2026', time: '13:48', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Farm Calculator</strong> — block rewards das ligas Gold I até Diamond II atualizados (BTC, LTC, BNB, POL, XRP, DOGE, ETH, TRX e SOL).`
    },
    {
      date: '22 Jul 2026', time: '00:14', tag: 'improved', label: 'MELHORIA',
      html: `<strong>MinerMerge</strong> — impacto real na sala:
      <ul class="guia-tl-list">
        <li><strong>Impacto real por merge</strong> — cada card mostra quanto o poder total da sala mudaria com aquele merge: remove 1 unidade do nível atual do pool instalado e adiciona 1 do nível resultante, recalculando bônus de coleção (só a primeira cópia de cada nível conta) e bônus de rack — não é só o poder isolado da miner, é o efeito líquido na sala.</li>
        <li><strong>Ordenação pelo impacto real</strong> — os filtros "Maior impacto real" e "Custo-benefício" passam a usar esse número em vez do ganho isolado da miner.</li>
        <li><strong>Tooltip por nível</strong> — passando o mouse em qualquer chip de nível (não só o próximo tier) dá pra ver o impacto real de trocar pra aquele nível específico.</li>
        <li><strong>Fonte do dado</strong> — o cálculo usa o último estado deixado no SmartRoom (sala real espelhada automaticamente, ou a simulação/otimização que você tiver feito lá); um aviso fixo no topo do plano lembra disso e sugere rodar o Auto-Otimizar antes de decidir os merges pra ter o valor mais preciso.</li>
      </ul>`
    },
    {
      date: '17 Jul 2026', time: '13:07', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Farm Calculator</strong> — block rewards das ligas Gold I até Diamond II atualizados (POL, DOGE, ETH e TRX).`
    },
    {
      date: '14 Jul 2026', time: '03:23', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Base de miners atualizada</strong> — 8.220 entradas (era 8.032): power, preço, receita de merge, descrição e bônus de coleção ressincronizados por extração direta do jogo pra todos os miners existentes. <strong>33 miners novos</strong> mapeados pela primeira vez (SuperStorm, GrandMaster, Hashbeard's Ship, Art of Deal, Chains of Freedom e outros).`
    },
    {
      date: '12 Jul 2026', time: '15:01', tag: 'improved', label: 'MELHORIA',
      html: `<strong>SmartRoom</strong> e <strong>MinerMerge</strong> — mais uma leva de ajustes:
      <ul class="guia-tl-list">
        <li><strong>Status "inventário + sala" no MinerMerge</strong> — antes, quando você tinha a mesma miner/nível no inventário <em>e</em> instalada na sala ao mesmo tempo, uma das duas contagens era descartada silenciosamente; agora soma as duas corretamente e mostra "no inventário e instalada na sala".</li>
        <li><strong>Auto-Otimizar sequencial</strong> — dentro de cada rack, a miner mais forte fica no primeiro slot e a mais fraca no último; entre racks com o mesmo bônus, o preenchimento segue a ordem física da sala (rack 1 com as mais fortes, rack 2 com as próximas, etc).</li>
        <li><strong>Impacto no Banco</strong> — cada miner disponível no banco do SmartRoom agora mostra o ganho de poder estimado se fosse instalada, facilitando comparar antes de decidir.</li>
        <li><strong>Correção</strong> — três bugs de comparação (tipo string vs número) no SmartRoom que geravam lista de ações errada, bloqueio incorreto de "não cabe" e falta de destaque na célula selecionada.</li>
        <li><strong>Plano de Merges em colunas</strong> — as seções Prontos/Falta peças/Falta miners viraram blocos recolhíveis lado a lado (empilham no mobile).</li>
        <li><strong>Block rewards das ligas</strong> — valores de Gold II até Diamond III atualizados.</li>
      </ul>`
    },
    {
      date: '10 Jul 2026', time: '11:00', tag: 'improved', label: 'MELHORIA',
      html: `<strong>SmartRoom</strong> — leva de ajustes:
      <ul class="guia-tl-list">
        <li><strong>Abas separadas</strong> — Inventário, MinerMerge e SmartRoom passam a ter simulação própria e independente cada um (o estado de simulação, que era compartilhado, virou uma fábrica que gera uma instância isolada por aba).</li>
        <li><strong>Lista de ações</strong> — checklist retrátil no SmartRoom comparando o estado real com o simulado e gerando o passo a passo (mover/remover/instalar) pra reproduzir igual no jogo.</li>
        <li><strong>Auto-Otimizar mais estável</strong> — menos trocas desnecessárias entre racks de bônus igual, sem buracos vazios por fragmentação.</li>
        <li><strong>Correção</strong> — cálculo de poder simulado do Inventário estava inflado (contava o inventário inteiro em vez de só as miners de fato adicionadas/removidas na simulação).</li>
        <li><strong>Renomeação</strong> — "Planejador de Sala" passa a se chamar SmartRoom.</li>
      </ul>`
    },
    {
      date: '02 Jul 2026', time: '14:30', tag: 'new', label: 'NOVO',
      html: `<strong>SmartRoom</strong> — visualize e edite suas racks igual ao jogo: carrossel de salas, imagens das miners, bônus por rack. <strong>Auto-Otimizar</strong> distribui as miners considerando poder + bônus de coleção + bônus de rack, com edição manual (trocar, mover, devolver ao banco). Miners de set ficam protegidas e nunca são movidas automaticamente.`
    },
    {
      date: '02 Jul 2026', time: '14:20', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Simulação do Inventário integrada ao SmartRoom</strong> — o estado de simulação passa a ser único e compartilhado entre a tabela do Inventário e o SmartRoom: remover/adicionar uma miner em qualquer um dos dois reflete direto no outro, e o cálculo de poder simulado fica ancorado no valor real (em vez de uma aproximação).`
    },
    {
      date: '02 Jul 2026', time: '14:10', tag: 'new', label: 'NOVO',
      html: `<strong>Aba MinerMerge</strong> — o Plano de Merges sai de dentro do Inventário e ganha aba própria. O sistema de tooltip dos chips de nível também é extraído pra um módulo compartilhado (<code>chipTooltip.js</code>), reaproveitado depois pelo SmartRoom.`
    },
    {
      date: '30 Jun 2026', time: '23:11', tag: 'new', label: 'NOVO',
      html: `<strong>Plano de Merges inteligente</strong>:
      <ul class="guia-tl-list">
        <li>Detecta miners tanto no inventário quanto instaladas na sala pra contar cópias disponíveis — corrige a contagem que buscava a entrada do catálogo pelo power (impreciso) e passa a usar o nível/label da miner.</li>
        <li>Categoriza os merges em <strong>Prontos</strong>, <strong>Falta peças</strong> e <strong>Falta miners</strong> (cópias insuficientes).</li>
        <li>Chips de nível mostram quantidade (×2), emoji de raridade (⚪🟢🔵🟣🟡🔴) e o nome da raridade (Epic) em vez do número interno do nível (Lv3).</li>
        <li>Barra de progresso visual em cada ingrediente e mensagem de duplicado explicando exatamente o que será consumido e o resultado.</li>
        <li>Ordenação por custo-benefício, maior ganho ou menor custo.</li>
      </ul>`
    },
    {
      date: '30 Jun 2026', time: '22:52', tag: 'new', label: 'NOVO',
      html: `<strong>Tooltip interativo nos níveis de merge</strong> — passe o mouse sobre qualquer chip de nível pra ver power, bônus% (corrigido logo em seguida pra dividir certo por 100), custo base do merge e a lista de peças necessárias pra chegar naquele nível.`
    },
    {
      date: '30 Jun 2026', time: '22:33', tag: 'new', label: 'NOVO',
      html: `<strong>Variação de bônus% no merge</strong> — o card de merge passa a exibir a mudança de bônus de coleção, ex: <em>20.00% → 40.00% +20.00%</em>, igual ao que já era feito com o power. Aproveitando, a navegação foi reorganizada: a aba Impact Analyzer saiu do menu principal e o Inventário subiu na lista.`
    },
    {
      date: '30 Jun 2026', time: '17:48', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Imagens das miners</strong> nos cards de merge e nas tabelas do inventário; os cards de merge passam a mostrar também o <strong>custo base do merge em RLT</strong>.`
    },
    {
      date: '30 Jun 2026', time: '16:34', tag: 'improved', label: 'MELHORIA',
      html: `<strong>Base de miners atualizada</strong> — 8.070 entradas com receitas de merge completas.`
    },
    {
      date: '30 Jun 2026', time: '03:43', tag: 'new', label: 'NOVO',
      html: `<strong>Sugestões de merge no Inventário</strong> e reforma no <strong>Farm Calculator</strong>:
      <ul class="guia-tl-list">
        <li>Miners com 2+ unidades (somando inventário + sala) ganham uma sub-linha na tabela do Inventário mostrando o resultado do merge, agrupadas em prontos e falta de peças.</li>
        <li>Correção na exibição da unidade de power no resultado do merge (Ph/s) e no cálculo de bônus de rack ao remover uma miner.</li>
        <li>Farm Calculator: parser atualizado pro novo formato de dados de rede do site, recompensas das 15 ligas atualizadas, aviso sobre a nova fonte de dados, tabela de tempo mínimo de saque por moeda, e seção de liga/cotações reorganizada de forma mais compacta.</li>
      </ul>`
    },
  ],

  _renderEntries: function(list) {
    return list.map(u => `
        <div class="guia-tl-entry">
          <div class="guia-tl-date">${u.date}<br><span class="guia-tl-time">${u.time}</span></div>
          <div class="guia-tl-content">
            <span class="guia-tag tag-${u.tag}">${u.label}</span>
            ${u.html}
          </div>
        </div>`).join('');
  },

  renderPreview: function(n) {
    return this._renderEntries(this.updates.slice(0, n));
  },

  mostrar: function() {
    const div = document.getElementById('changelog');
    if (!div) return;
    div.innerHTML = `
      <div class="guia-updates-header">
        <span class="guia-updates-badge">NOVIDADES</span>
        <h2 class="guia-updates-title">Histórico completo de atualizações</h2>
      </div>
      <div class="guia-timeline">
        ${this._renderEntries(this.updates)}
      </div>
    `;
  }
};

window.UI_Changelog = UI_Changelog;
console.log('✅ UI_Changelog loaded');
