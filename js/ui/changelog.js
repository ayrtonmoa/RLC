// js/ui/changelog.js - Histórico completo de atualizações (fonte única, usada também
// pela prévia de 3 itens na aba Guia via UI_Changelog.renderPreview()).

const UI_Changelog = {
  updates: [
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
      html: `<strong>Base de miners atualizada</strong> — 8.220 entradas (era 8.032): power, preço, receita de merge, descrição e bônus de coleção ressincronizados direto da API do jogo pra todos os miners existentes. <strong>33 miners novos</strong> mapeados pela primeira vez (SuperStorm, GrandMaster, Hashbeard's Ship, Art of Deal, Chains of Freedom e outros).`
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
      html: `<strong>Simulação do Inventário integrada ao SmartRoom</strong> — o estado de simulação passa a ser único e compartilhado entre a tabela do Inventário e o SmartRoom: remover/adicionar uma miner em qualquer um dos dois reflete direto no outro, e o cálculo de poder simulado fica ancorado no valor real da API (em vez de uma aproximação).`
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
