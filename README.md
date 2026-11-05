# Engrena — Tensão & Perigo v0.9.1

Compatibilidade declarada: Foundry VTT 13.x a 14.369. Sistema de RPG: agnóstico.

**Suporte v13 experimental:** as APIs utilizadas (ApplicationV2, DialogV2, getSceneControlButtons) estão documentadas na v13, mas esta atualização ainda não foi executada em uma instância real de Foundry v13. O campo `verified` permanece em 14.369 porque essa é a versão de referência conhecida; ele não comprova testes em v13.

**Releases GitHub:** o manifesto aponta para `main` e o download desta versão aponta para a release `v0.9.1`. Atualize e publique o `module.json` no GitHub antes de oferecer a atualização aos usuários. Para o atualizador nativo, as URLs precisam estar acessíveis ao Foundry sem autenticação.

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

As operações são iniciadas pelo mestre e não removem documentos/atores/cenas do mundo. Os novos estados usam `game.settings` de escopo `world`. Verificação local de sintaxe e inspeção estática das APIs realizadas; execução real em Foundry v13 e 14.369 e múltiplos clientes continua necessária.

## v0.9.0 — redimensionar pelo canto inferior direito

- Os botões de tamanho do cabeçalho foram removidos.
- Arraste a alça no canto inferior direito de qualquer barra, relógio ou painel para alterar largura e altura.
- O painel de trilhas recebe rolagem interna quando a altura é pequena; o relógio ajusta a escala ao espaço disponível.
- Existem limites mínimos e máximos por modo e pela área disponível na tela.
- As dimensões ficam salvas localmente por usuário, marcador e modalidade (a configuração do mundo não é alterada).
- As larguras personalizadas da v0.8.1 continuam sendo lidas, quando existentes.

**Teste pendente:** validar visualmente com Foundry v13 e v14.369, inclusive em telas pequenas.


## v0.9.0 — Eventos narrativos (opcionais)

Na configuração de cada marcador, use **Eventos narrativos e vínculos** para definir
textos que serão enviados ao chat quando um lado da barra ou um relógio completar.
Cada trilha do painel possui seu próprio texto de conclusão. O evento só é disparado
no momento em que a meta é alcançada; zerar e completar novamente dispara novo evento.

O campo **Avanço rápido** controla os botões +N (1 a 10). Os botões +1, -1 e cliques
nos segmentos continuam funcionando. Você pode opcionalmente vincular outro marcador:
- **Exibir**: revela o marcador vinculado.
- **Avançar**: adiciona N casas ao relógio, ao lado de ameaça da barra ou à primeira
  trilha ainda incompleta do painel vinculado.

**Segurança:** ações vinculadas nunca encadeiam automaticamente outros vínculos;
o sistema só executa um salto por conclusão. O texto da consequência pode ser
público ou visível somente aos mestres. Não existem alterações automáticas de
atores, itens, fichas, cena ou sistema de regras.

**Compatibilidade:** suporte declarado Foundry 13–14.369, testes de execução
no Foundry ainda necessários. Faça backup do mundo antes de atualizar.

## v0.9.1 — Destinos explícitos de vínculos

Ao configurar uma ação **Avançar marcador vinculado**, selecione qual contador
deve receber o progresso: lado esquerdo/direito da barra, relógio ou uma trilha
específica do painel. O seletor muda conforme o tipo do marcador de destino.
É possível escolher quantos espaços serão adicionados (1 a 10).

**Migração:** vínculos da v0.9.0 sem destino configurado usam a opção
“Automático (compatibilidade 0.9.0)”: relógio, lado esquerdo, ou primeira
trilha incompleta. Escolha explicitamente o destino para comportamento previsível.

Quando uma trilha previamente vinculada é excluída, o vínculo com destino
inválido não redireciona silenciosamente o progresso para outra trilha;
reconfigure o destino. Continua proibido o encadeamento recursivo de vínculos.

**Teste necessário no Foundry:** confirmar exibição dinâmica do seletor, salvamento,
revelação, avanço de ambos os lados, trilhas, persistência após reiniciar,
permissões GM/jogadores e execução de eventos uma única vez por conclusão.
