// js/ui/guia.js - Aba Guia de Uso - ATUALIZADO

const UI_Guia = {
  mostrar() {
    const div = document.getElementById('guia');
    div.innerHTML = `
      <h2>Guia de Uso - RollerCoin Analyzer Pro</h2>
      
      <div class="summary-item" style="margin-bottom: 20px; background: #e8f5e8; border-left: 4px solid #4CAF50;">
        <h4>💡 O que é o RollerCoin Analyzer Pro?</h4>
        <p>Uma ferramenta completa que analisa o <strong>impacto real</strong> de cada miner, calcula <strong>rentabilidade de farming</strong>, simula <strong>merges</strong> e compara com o <strong>mercado</strong>. Tome decisões estratégicas baseadas em dados precisos.</p>
      </div>

      <h3>Como Usar</h3>
      
      <h4>1. Encontre seu Profile Link no RollerCoin</h4>
      <ol>
        <li>Acesse <a href="https://rollercoin.com/profile/personal-profile" target="_blank">https://rollercoin.com/profile/personal-profile</a></li>
        <li>Procure pela seção "Profile Link"</li>
        <li>Copie apenas a parte após <code>/p/</code> da URL
          <br><small>Se seu link for <code>https://rollercoin.com/p/PlayerExample</code>, use apenas: <strong>PlayerExample</strong></small>
        </li>
      </ol>

      <h4>2. Analise seu Perfil</h4>
      <ol>
        <li>Cole seu username no campo "Username" acima</li>
        <li>Clique em "Analisar"</li>
        <li>Aguarde o carregamento (pode levar alguns segundos)</li>
      </ol>

      <h4>3. Navegue pelas Abas</h4>
      
      <div class="summary-grid">
        <div class="summary-item">
          <h4>📈 Aba Resumo</h4>
          <p>Visão geral do poder total e detalhamento dos componentes (Base, Bônus, Racks, etc.).</p>
        </div>
        
        <div class="summary-item">
          <h4>⚡ Farm Calculator (NOVO!)</h4>
          <p><strong>Calcule quanto você ganha farmando cada crypto</strong><br>
          • Sistema de ligas com block rewards reais<br>
          • Recomendação da melhor crypto para farmar<br>
          • Top 3 cryptos mais lucrativas<br>
          • Comparação Game Coins vs Cryptos<br>
          • Histórico de consultas por usuário<br>
          • Gráfico de evolução do poder e rede<br>
          • Cotações em tempo real (USD/BRL)<br>
          • Exportar resultados em CSV<br>
          • Indicação de moedas não sacáveis (ALGO, LTC)</p>
        </div>
        
        <div class="summary-item">
          <h4>🎯 Impact Analyzer</h4>
          <p><strong>Ranking</strong> das miners por impacto real<br>
          <strong>Impacto Real</strong>: Quanto poder você perderia ao remover cada miner<br>
          <strong>Posição</strong>: Sala, Rack e coordenadas exatas<br>
          <strong>Filtro Duplicadas</strong>: Ver apenas miners repetidas (mesmo nome + tier)<br>
          <strong>Componentes</strong>: Base + Bônus de coleção + Rack bonus</p>
        </div>
        
        <div class="summary-item">
          <h4>🛒 Buy Analyzer</h4>
          <p>Analise se uma compra de miner vale a pena para o seu perfil específico. Calcula ROI real considerando bônus de coleção.</p>
        </div>

        <div class="summary-item">
          <h4>🔀 Merge Analyzer</h4>
          <p><strong>Simule merges antes de fazer</strong><br>
          • Cole dados de 2-5 miners do inventário<br>
          • Veja poder total após o merge<br>
          • Compare com poder individual<br>
          • Calcule ganho/perda real do merge<br>
          • Considera bônus de coleção no cálculo</p>
        </div>

        <div class="summary-item">
          <h4>⚖️ Merge vs Market (NOVO!)</h4>
          <p><strong>Descubra se é melhor fazer merge ou vender</strong><br>
          • Compare valor do merge vs venda no mercado<br>
          • Analise ROI de comprar a miner final pronta<br>
          • Veja recomendação automática (Merge/Vender/Comprar)<br>
          • Considera taxas e custos reais</p>
        </div>

        <div class="summary-item">
          <h4>💰 RST Sell Analyzer</h4>
          <p><strong>Otimize suas vendas de RST</strong><br>
          • Calcule quanto RST você tem<br>
          • Veja valor em USD e BRL<br>
          • Compare preços RST vs RLT<br>
          • Descubra melhor estratégia de venda</p>
        </div>

        <div class="summary-item">
          <h4>📦 Inventário & Troca Inteligente</h4>
          <p><strong>Inventário</strong>: Cole o conteúdo da página Storage e veja o impacto de cada miner<br>
          <strong>Troca Inteligente</strong>: Descubra qual miner remover para colocar uma nova (considera salas cheias)</p>
        </div>
        
        <div class="summary-item">
          <h4>🏠 Racks</h4>
          <p>Análise da eficiência dos seus racks, capacidade vs ocupação, identificação de racks subutilizados.</p>
        </div>

        <div class="summary-item">
          <h4>🔧 Debug Info</h4>
          <p>Dados técnicos do processo de análise, útil para verificar se os cálculos estão corretos.</p>
        </div>
      </div>

      <h3>Farm Calculator - Como Usar (NOVO!)</h3>

      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3;">
        <h4>⚡ Passo a Passo</h4>
        <ol>
          <li><strong>Analise seu perfil primeiro</strong> (para detectar sua liga)</li>
          <li>Acesse a aba <strong>Farm Calculator</strong></li>
          <li><strong>Mining Power</strong>: Já vem preenchido automaticamente com seu poder atual</li>
          <li><strong>Rede das moedas</strong>: Copie da página de farming do RollerCoin:
            <ul>
              <li>Vá em <a href="https://rollercoin.com/game/choose-cryptocurrency" target="_blank">Choose Cryptocurrency</a></li>
              <li>Pressione Ctrl+A → Ctrl+C</li>
              <li>Cole no campo "Rede das moedas"</li>
            </ul>
          </li>
          <li>Clique em <strong>"💰 Calcular"</strong></li>
        </ol>

        <h4>📊 O que você verá:</h4>
        <ul>
          <li><strong>🏆 Sua Liga</strong>: Liga atual e block rewards aplicados</li>
          <li><strong>📊 Comparação</strong>: Mudanças desde última análise (Rede, Poder, Lucro)</li>
          <li><strong>🏆 Melhor Crypto</strong>: Recomendação da crypto mais lucrativa para você</li>
          <li><strong>🥇🥈🥉 Top 3</strong>: As 3 cryptos mais lucrativas (exclui não sacáveis)</li>
          <li><strong>🎮 Game vs Crypto</strong>: Melhor game coin vs melhor crypto</li>
          <li><strong>💰 Cotações</strong>: Preços atuais em USD e BRL</li>
          <li><strong>📈 Gráfico</strong>: Evolução do seu poder e da rede total</li>
          <li><strong>📊 Resultados Detalhados</strong>: Tabela completa com todas as moedas</li>
          <li><strong>📜 Histórico</strong>: Suas consultas anteriores (por usuário)</li>
        </ul>

        <h4>💡 Recursos Especiais:</h4>
        <ul>
          <li><strong>USD $ / BRL R$</strong>: Alterne entre dólares e reais</li>
          <li><strong>💰 Valor / 🪙 Quantidade</strong>: Veja em dinheiro ou quantidade de moedas</li>
          <li><strong>📥 Exportar CSV</strong>: Baixe todos os dados para Excel/Sheets</li>
          <li><strong>🚫 Não sacável</strong>: ALGO e LTC marcados (não aparecem no Top 3)</li>
          <li><strong>📜 Histórico separado</strong>: Cada usuário tem seu próprio histórico</li>
          <li><strong>🗑️ Deletar</strong>: Remova consultas individuais ou limpe tudo</li>
        </ul>
      </div>

      <h3>Interpretando os Resultados</h3>

      <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800;">
        <h4>❓ O que significa "Impacto Real"?</h4>
        <p>O <strong>Impacto Real</strong> responde: "Se eu remover APENAS esta miner, quanto poder eu perderia?"</p>
        
        <p><strong>Inclui:</strong></p>
        <ul>
          <li>Poder base da miner</li>
          <li>Bônus de coleção perdido (aplicado sobre toda a rede)</li>
          <li>Contribuição para o Rack Bonus</li>
        </ul>
      </div>

      <h4>Exemplo Prático - Impact Analyzer</h4>
      <p>Se uma miner mostra "Impacto Real: 475 Ph/s":</p>
      <ul>
        <li>Remover ela causaria uma perda de 475 Ph/s no seu poder total</li>
        <li>Essa perda é maior que o poder base dela devido aos bônus compostos</li>
      </ul>

      <h4>Exemplo Prático - Farm Calculator</h4>
      <p>Se você tem 100 Eh/s de poder e a rede de BTC é 2500 Eh/s:</p>
      <ul>
        <li>Sua contribuição: 100 ÷ 2500 = 4%</li>
        <li>Se o block reward de BTC na sua liga é 0.00021790 BTC</li>
        <li>Você recebe: 0.00021790 × 4% = 0.00000872 BTC por bloco</li>
        <li>Por dia (144.9664 blocos): 0.00126 BTC ≈ $120 USD</li>
      </ul>

      <h4>Sistema de Cores</h4>
      <div class="summary-grid">
        <div class="summary-item high-impact">
          <strong>🔴 Alto Impacto</strong><br>
          Miners mais valiosas - mantenha sempre
        </div>
        <div class="summary-item medium-impact">
          <strong>🟡 Médio Impacto</strong><br>
          Miners importantes - considere upgrades
        </div>
        <div class="summary-item low-impact">
          <strong>🟢 Baixo Impacto</strong><br>
          Candidatas à substituição
        </div>
      </div>

      <h3>Buy Analyzer - Como Usar</h3>

      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3;">
        <h4>🛒 Passo a Passo</h4>
        <ol>
          <li>Abra qualquer miner no marketplace do RollerCoin</li>
          <li>Copie as informações da miner:</li>
          <ul>
            <li><strong>Nome:</strong> "Rare Mega Maner"</li>
            <li><strong>Power:</strong> Cole todo o texto que aparece (ex: "**Power** 13 000 000 Gh/s")</li>
            <li><strong>Bonus:</strong> Cole o bônus (ex: "**2.00%**")</li>
            <li><strong>Preço:</strong> Apenas o número (ex: "4.50")</li>
          </ul>
          <li>Clique em "Analisar Compra"</li>
          <li>Veja o ROI calculado especificamente para o seu perfil</li>
        </ol>
      </div>

      <h3>Merge Analyzer - Como Usar</h3>

      <div class="summary-item" style="background: #f3e5f5; border-left: 4px solid #9C27B0;">
        <h4>🔀 Simulação de Merge</h4>
        <ol>
          <li>Vá no <strong>Storage</strong> do RollerCoin</li>
          <li>Selecione 2-5 miners que quer fazer merge</li>
          <li>Copie (Ctrl+C) as informações</li>
          <li>Cole no campo do Merge Analyzer</li>
          <li>Clique em "Analisar Merge"</li>
          <li>Veja:
            <ul>
              <li>Poder total atual das miners</li>
              <li>Poder após o merge</li>
              <li>Ganho/Perda líquida</li>
              <li>Bônus de coleção impactado</li>
            </ul>
          </li>
        </ol>
      </div>

      <h3>Merge vs Market - Como Usar (NOVO!)</h3>

      <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800;">
        <h4>⚖️ Decidir: Merge, Vender ou Comprar?</h4>
        <ol>
          <li>Cole as miners que planeja fazer merge</li>
          <li>Cole o preço de venda médio de cada tier no mercado</li>
          <li>Cole o preço de compra da miner final (resultado do merge)</li>
          <li>Clique em "Analisar Merge vs Market"</li>
          <li>Veja:
            <ul>
              <li><strong>Cenário 1:</strong> Fazer merge (custo + resultado)</li>
              <li><strong>Cenário 2:</strong> Vender tudo no mercado (lucro total)</li>
              <li><strong>Cenário 3:</strong> Comprar a miner final pronta</li>
              <li><strong>Recomendação:</strong> Qual é a melhor opção financeiramente</li>
            </ul>
          </li>
        </ol>

        <h4>💡 Exemplo Prático:</h4>
        <p>Você tem 3x Legendary tier 6 que pode fazer merge para tier 7:</p>
        <ul>
          <li><strong>Fazer merge:</strong> Custo 15 RLT + ganha tier 7</li>
          <li><strong>Vender:</strong> 3 × $8 = $24 no mercado</li>
          <li><strong>Comprar tier 7:</strong> $30 no mercado</li>
          <li><strong>Recomendação:</strong> Vender (maior lucro)</li>
        </ul>
      </div>

      <h3>Inventário - Como Usar</h3>

      <div class="summary-item" style="background: #f3e5f5; border-left: 4px solid #9C27B0;">
        <h4>📦 Análise de Inventário</h4>
        <ol>
          <li>Vá em Storage no RollerCoin</li>
          <li>Pressione Ctrl+A para selecionar tudo</li>
          <li>Ctrl+C para copiar</li>
          <li>Cole no campo e clique "Analisar Inventário"</li>
          <li>Veja qual miner do inventário tem maior impacto se instalada</li>
        </ol>
      </div>

      <h3>Casos de Uso Práticos</h3>

      <div class="summary-grid">
        <div class="summary-item">
          <h4>⚡ Otimizar Farming</h4>
          <p>Use Farm Calculator para descobrir qual crypto é mais lucrativa para você. Compare Game Coins vs Cryptos. Acompanhe evolução do lucro no histórico. Evite farmar moedas não sacáveis (ALGO, LTC).</p>
        </div>

        <div class="summary-item">
          <h4>🔧 Otimização de Setup</h4>
          <p>Identifique miners de baixo impacto para substituir. Priorize melhores racks para miners de alto impacto. Use filtro de duplicadas para encontrar oportunidades de merge.</p>
        </div>
        
        <div class="summary-item">
          <h4>💰 Planejamento de Compras</h4>
          <p>Use o Buy Analyzer para comparar miners do marketplace. Calcule ROI baseado no seu perfil específico. Use Merge vs Market antes de comprar componentes.</p>
        </div>

        <div class="summary-item">
          <h4>🔀 Estratégia de Merge</h4>
          <p>Simule merges antes de fazer (Merge Analyzer). Compare se é melhor fazer merge ou vender (Merge vs Market). Calcule se vale mais comprar a miner pronta.</p>
        </div>
        
        <div class="summary-item">
          <h4>📦 Gestão de Inventário</h4>
          <p>Analise qual miner do inventário vale mais a pena instalar. Compare impacto real antes de usar. Identifique oportunidades de upgrade.</p>
        </div>
        
        <div class="summary-item">
          <h4>📊 Análise de Eficiência</h4>
          <p>Descubra racks subutilizados. Reorganize miners para maximizar bônus. Use posições exatas para planejamento.</p>
        </div>
        
        <div class="summary-item">
          <h4>💸 Decisões de Venda</h4>
          <p>Identifique miners seguras para vender sem grande impacto. Evite vender miners com alto impacto relativo. Use RST Sell Analyzer para otimizar vendas de tokens.</p>
        </div>

        <div class="summary-item">
          <h4>🎮 Simulação de Remoção</h4>
          <p>Teste remover miners temporariamente e veja o impacto em tempo real sem afetar sua conta real no jogo.</p>
        </div>
      </div>

      <h3>Limitações e Notas Importantes</h3>

      <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
        <h4>⚠️ Impactos Não São Aditivos</h4>
        <p>Os valores de impacto <strong>não podem ser somados</strong>. Cada valor mostra o impacto de remover apenas aquela miner específica, mas os bônus se afetam mutuamente.</p>
      </div>

      <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800;">
        <h4>⚠️ Farm Calculator - Notas Importantes</h4>
        <ul>
          <li><strong>Sistema de Ligas:</strong> Cada liga tem block rewards diferentes</li>
          <li><strong>Network Power:</strong> A rede muda constantemente, recalcule periodicamente</li>
          <li><strong>Cotações:</strong> Preços de cryptos são atualizados a cada 5 minutos</li>
          <li><strong>Blocos/dia:</strong> Valor fixo de 144.9664 blocos (pode variar ligeiramente)</li>
          <li><strong>Moedas não sacáveis:</strong> ALGO e LTC não podem ser sacados (apenas trocados)</li>
        </ul>
      </div>

      <h4>Outras Considerações</h4>
      <ul>
        <li><strong>Dados em Tempo Real:</strong> A análise usa dados atuais da API do RollerCoin</li>
        <li><strong>Miners Duplicadas:</strong> O bônus de coleção é aplicado apenas uma vez por tipo de miner (mesmo nome + tier)</li>
        <li><strong>Funcionalidade CSV:</strong> Baixe todos os dados para análise no Excel/Sheets</li>
        <li><strong>Buy Analyzer:</strong> ROI calculado considera seu perfil específico (base atual + bônus)</li>
        <li><strong>Simulação de Remoção:</strong> Teste remover miners temporariamente e veja o impacto em tempo real</li>
        <li><strong>Histórico por Usuário:</strong> Farm Calculator salva histórico separado para cada usuário analisado</li>
      </ul>

      <h3>Problemas Comuns</h3>

      <div class="summary-grid">
        <div class="summary-item">
          <h4>❌ "Usuário não encontrado"</h4>
          <ul>
            <li>Verifique se o username está correto</li>
            <li>Certifique-se que o perfil é público</li>
            <li>Teste com outro username conhecido</li>
          </ul>
        </div>
        
        <div class="summary-item">
          <h4>🐌 Carregamento lento</h4>
          <ul>
            <li>A análise processa muitos dados - seja paciente</li>
            <li>Redes com muitas miners (200+) podem levar mais tempo</li>
          </ul>
        </div>
        
        <div class="summary-item">
          <h4>❌ Erro no Buy Analyzer</h4>
          <ul>
            <li>Certifique-se de colar o texto completo do marketplace</li>
            <li>O sistema extrai automaticamente números de textos formatados</li>
            <li>Aceita diversos formatos: "13 000 000 Gh/s", "**2.00%**", etc.</li>
          </ul>
        </div>

        <div class="summary-item">
          <h4>❌ Erro no Farm Calculator</h4>
          <ul>
            <li>Certifique-se de colar TODA a página de Choose Cryptocurrency</li>
            <li>O sistema aceita tanto Zh/s quanto Eh/s</li>
            <li>Analise o perfil primeiro para detectar sua liga</li>
            <li>Verifique se sua liga foi detectada corretamente</li>
          </ul>
        </div>
      </div>

      <hr style="margin: 30px 0;">
      
      <p style="text-align: center; font-size: 14px; color: #666;">
        <strong>Lembre-se:</strong> Use esta ferramenta como apoio às suas decisões, mas sempre considere também fatores como custo, disponibilidade no mercado e seus objetivos pessoais no jogo.
      </p>
      
      <p style="text-align: center; font-size: 12px; color: #999;">
        <em>Ferramenta criada pela comunidade RollerCoin para análise completa de miners e farming. Não afiliada oficialmente ao RollerCoin.</em>
      </p>
    `;
  }
};

window.UI_Guia = UI_Guia;