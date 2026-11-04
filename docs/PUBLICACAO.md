# Publicação e controle de versão

## Configuração inicial

1. Abra esta pasta como repositório local no GitHub Desktop.
2. Se solicitado, escolha **Create a repository here**.
3. Crie o primeiro commit: `chore: importar Engrena v0.8.0`.
4. Clique em **Publish repository**. Escolha público/privado conscientemente.
5. Crie no GitHub a tag `v0.8.0` e a release `Engrena v0.8.0`,
   anexando o ZIP instalável original `engrena-tensao-perigo-v0.8.0.zip`.

## Desenvolvimento

- `main`: código aprovado.
- `feature/nome-da-funcionalidade`: alterações isoladas.
- Commits frequentes, com mensagens descritivas.
- Testar antes de integrar à `main`.
- Atualizar `module.json`, `README.md` e `CHANGELOG.md` na mesma alteração de versão.

## Versão

- Correção de defeito: `0.8.1`
- Funcionalidade compatível: `0.9.0`
- Mudança incompatível: `1.0.0` (quando o projeto alcançar maturidade)

## Publicação de ZIP instalável

O ZIP para instalar no Foundry deve conter na raiz uma pasta
`engrena-tensao-perigo/` que tenha o `module.json` diretamente dentro dela.

Não inclua `.git`, `node_modules`, logs, backups ou arquivos pessoais.
