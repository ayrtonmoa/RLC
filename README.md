# RollerCoin Analyzer Pro (RLC)

Ferramenta web para jogadores de [RollerCoin](https://rollercoin.com) analisarem a própria conta e tomarem decisões que o jogo não ajuda a calcular sozinho: quais miners fundir primeiro, como organizar a sala pra maximizar poder, e quanto cada decisão custa de verdade em RLT e RST.

**No ar:** https://ayrtonmoa.github.io/RLC/

## O problema

O RollerCoin mostra o que você tem, mas não responde perguntas como:

- "Com o RLT que eu tenho agora, quais merges valem mais a pena?"
- "Se eu reorganizar a sala do zero, quanto poder eu ganho?"
- "Essa miner que 'falta peça' vale mais fundir do zero ou comprar pronta no marketplace?"
- "Quanto do meu poder atual é temporário e vai sumir (não conta pra subir de liga)?"

O RLC cola o inventário público de uma conta (miners, peças, sala) e responde essas perguntas com números reais, sempre validados contra dados extraídos direto do jogo.

## Principais módulos

- **MinerMerge**: gera um plano de merges a partir de quanto RLT (e RST) você tem. Calcula o impacto real de cada merge na sala (não só o poder bruto da miner), o custo de peças que faltam (incluindo fundir peça por peça até Common), e compara fundir vs. comprar pronta no marketplace.
- **SmartRoom**: otimizador de alocação de sala, decide quais miners do inventário entram em quais racks pra maximizar poder, respeitando bônus de set, bônus de rack e um teto de poder opcional (pra não subir de liga sem querer).
- **Farm Calculator**: projeta ganhos de mineração por bloco/dia/semana/mês em todas as moedas, com as recompensas oficiais de cada uma das 21 ligas do jogo.
- **Inventário**: cola o inventário de miners e peças e organiza tudo por raridade, nível e progresso de coleção.
- **RST Sell / vs Market / Buy / Racks**: módulos de apoio pra decisões de compra, venda e configuração de racks.

## Como rodar localmente

É uma aplicação estática (HTML/CSS/JS puro, sem build):

```bash
python -m http.server 8000
```

Depois abre `http://localhost:8000`.

## Stack

JavaScript vanilla (sem framework), organizado em módulos por aba (`js/ui/*.js`), com um catálogo de dados do jogo (`data/`) sincronizado periodicamente por extração direta da API do RollerCoin.
