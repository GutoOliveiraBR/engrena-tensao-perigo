# Engrena — Tensão & Perigo v0.8.0

Compatibilidade declarada: Foundry VTT 14.369. Sistema de RPG: agnóstico.

## Nova biblioteca de marcadores

O mestre abre **Controles de Token → ampulheta** para gerenciar uma coleção de marcadores, com até **30 instâncias** (cada painel de trilhas aceita até 12 trilhas).

- **+ Barra**, **+ Relógio**, **+ Painel de trilhas**: cria marcadores separados, inicialmente ocultos.
- **Configurar**: edita título, modo, cores, espaços e ícones daquele marcador.
- **Duplicar**: copia todas as opções e progresso; a cópia começa oculta.
- **Exibir/Ocultar**: visibilidade individual. Vários marcadores podem ficar visíveis ao mesmo tempo.
- **Excluir**: remove uma instância após confirmação; o módulo exige que ao menos uma continue cadastrada.
- **−/+** e cliques nos segmentos alteram somente o marcador correspondente.
- O mestre vê os controles; jogadores veem os marcadores exibidos e podem reposicioná-los/redimensioná-los localmente.

**Atualização a partir da v0.7.1:** o antigo marcador do mundo é importado para a biblioteca quando o mestre inicia a nova versão pela primeira vez. Recomenda-se fazer backup do mundo antes da atualização.

O tamanho e a posição de cada instância são locais por navegador e por marcador. O progresso, as opções e a visibilidade são salvos nas configurações do mundo.

## Instalação manual

Feche o Foundry e substitua a pasta `Data/modules/engrena-tensao-perigo` pela pasta do ZIP. Reinicie e ative o módulo no mundo.

## Segurança e testes

As operações são iniciadas pelo mestre e não removem documentos/atores/cenas do mundo. Os novos estados usam `game.settings` de escopo `world`. Verificações locais de sintaxe e lógica realizadas; execução real com Foundry 14.369 e múltiplos clientes ainda precisa ser validada.
