// js/ui/guia.js - Aba Guia de Uso

const UI_Guia = {
  mostrar() {
    const div = document.getElementById('guia');
    div.innerHTML = `
      <h2>Guia de Uso - RollerCoin Analyzer Pro</h2>
      
      <div class="summary-item" style="margin-bottom: 20px; background: #e8f5e8; border-left: 4px solid #4CAF50;">
        <h4>💡 O que é o RollerCoin Analyzer Pro?</h4>
        <p>Uma ferramenta que calcula o <strong>impacto real</strong> de cada miner na sua rede RollerCoin. Descubra quais miners são mais valiosas e tome decisões estratégicas baseadas em dados precisos.</p>
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
          <h4>🎯 Impact Analyzer (Principal)</h4>
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
          <h4>📦 Inventário & Troca Inteligente</h4>
          <p><strong>Inventário</strong>: Cole o conteúdo da página Storage e veja o impacto de cada miner<br>
          <strong>Troca Inteligente</strong>: Descubra qual miner remover para colocar uma nova (considera salas cheias)</p>
        </div>
        
        <div class="summary-item">
          <h4>🔧 Debug Info</h4>
          <p>Dados técnicos do processo de análise, útil para verificar se os cálculos estão corretos.</p>
        </div>
        
        <div class="summary-item">
          <h4>🏠 Racks</h4>
          <p>Análise da eficiência dos seus racks, capacidade vs ocupação, identificação de racks subutilizados.</p>
        </div>
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

      <h4>Exemplo Prático</h4>
      <p>Se uma miner mostra "Impacto Real: 475 Ph/s":</p>
      <ul>
        <li>Remover ela causaria uma perda de 475 Ph/s no seu poder total</li>
        <li>Essa perda é maior que o poder base dela devido aos bônus compostos</li>
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
          <h4>🔧 Otimização de Setup</h4>
          <p>Identifique miners de baixo impacto para substituir. Priorize melhores racks para miners de alto impacto. Use filtro de duplicadas para encontrar oportunidades de merge.</p>
        </div>
        
        <div class="summary-item">
          <h4>💰 Planejamento de Compras</h4>
          <p>Use o Buy Analyzer para comparar miners do marketplace. Calcule ROI baseado no seu perfil específico.</p>
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
          <p>Identifique miners seguras para vender sem grande impacto. Evite vender miners com alto impacto relativo. Use dados de posição para reorganização.</p>
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

      <h4>Outras Considerações</h4>
      <ul>
        <li><strong>Dados em Tempo Real:</strong> A análise usa dados atuais da API do RollerCoin</li>
        <li><strong>Miners Duplicadas:</strong> O bônus de coleção é aplicado apenas uma vez por tipo de miner (mesmo nome + tier)</li>
        <li><strong>Funcionalidade CSV:</strong> Baixe todos os dados para análise no Excel/Sheets</li>
        <li><strong>Buy Analyzer:</strong> ROI calculado considera seu perfil específico (base atual + bônus)</li>
        <li><strong>Simulação de Remoção:</strong> Teste remover miners temporariamente e veja o impacto em tempo real</li>
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
      </div>

      <hr style="margin: 30px 0;">
      
      <p style="text-align: center; font-size: 14px; color: #666;">
        <strong>Lembre-se:</strong> Use esta ferramenta como apoio às suas decisões, mas sempre considere também fatores como custo, disponibilidade no mercado e seus objetivos pessoais no jogo.
      </p>
      
      <p style="text-align: center; font-size: 12px; color: #999;">
        <em>Ferramenta criada pela comunidade RollerCoin para análise de impacto de miners. Não afiliada oficialmente ao RollerCoin.</em>
      </p>
    `;
  }
};

window.UI_Guia = UI_Guia;