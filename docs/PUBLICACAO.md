# Publicação do site: catálogo estático

## Como funciona

- **Quem visita o site** lê o arquivo `/data/catalog.json`, que é gerado a cada deploy
  (`scripts/build-catalog.mjs`). O site não consulta o Firestore a cada visita, então não existe
  cota de leitura para estourar.
- **A equipe** continua cadastrando livros, capítulos, chamadas e equipe no painel `/admin`
  (Firestore, com login Google).
- **Para as mudanças aparecerem no site**, a equipe clica em **Publicar no site** no topo do
  painel. O botão chama `/api/publish`, que pede um novo deploy à Vercel. Leva de 1 a 2 minutos.
- Mensagens de contato e submissões de obras continuam sendo gravadas no Firestore (poucas
  escritas por dia).

## Primeira vez: subir manualmente (GitHub e Vercel)

1. **GitHub.** Crie um repositório novo (vazio). Descompacte o zip e envie o conteúdo da pasta
   `observatorio-estatico` para ele, com o `package.json` na raiz do repositório. Pelo site do GitHub:
   *Add file → Upload files*, arrastando os arquivos e as pastas. Pelo terminal:
   ```bash
   cd observatorio-estatico
   git init -b main
   git add .
   git commit -m "Observatório Edições: catálogo estático"
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
   git push -u origin main
   ```
2. **Vercel.** *Add New → Project*, escolha o repositório e clique em *Deploy*. Não precisa mudar
   nenhuma configuração (ela reconhece o Vite).
3. **Domínio.** Em *Settings → Domains*, adicione `observatorioedicoes.com.br` e
   `www.observatorioedicoes.com.br`, e ajuste o DNS como a Vercel indicar.
4. Siga a seção abaixo (variável do botão e login Google).

### Banco de dados (Firestore)

O projeto lê o banco indicado em `firebase-applet-config.json` (`projectId` e, se o banco não for o
`(default)`, `firestoreDatabaseId`). Se o log do deploy mostrar
`O banco "(default)" não existe no projeto ...`, o site é publicado **vazio**. Para corrigir:

- se os livros estão em outro projeto ou em um banco com outro nome, ajuste esses dois campos no
  `firebase-applet-config.json` e envie ao GitHub (a Vercel faz um novo deploy sozinha);
- se não há banco nenhum, crie um no Firebase (*Firestore Database → Criar banco de dados*, nome
  `(default)`), publique as regras do arquivo `firestore.rules` e cadastre os livros em `/admin`.

Se o log mostrar que a **API do Firestore está desativada**, ative-a pelo link que o próprio erro traz.

## Configuração (uma vez)

1. **Código no GitHub.** Substitua o conteúdo do repositório pelos arquivos deste projeto
   (a Vercel já está ligada a ele e fará o deploy sozinha).
2. **Deploy Hook na Vercel.** No projeto: *Settings → Git → Deploy Hooks*. Crie um hook
   (nome "painel", branch `main`) e copie a URL gerada.
3. **Variável de ambiente.** Em *Settings → Environment Variables*, crie
   `VERCEL_DEPLOY_HOOK_URL` com essa URL (ambiente Production) e faça um novo deploy.
   Opcional: `ADMIN_EMAILS` com e-mails extras autorizados a publicar, separados por vírgula.
   Quem estiver cadastrado em *Configurações → Usuários autorizados* no painel já pode publicar.
4. **Regras do Firestore.** Confirme no Firebase que as regras publicadas são as do arquivo
   `firestore.rules` deste projeto. O deploy lê livros com `status = Publicado`, capítulos,
   coleções, chamadas, equipe e o modelo de submissão, tudo o que essas regras já liberam
   para leitura pública.
5. **Login Google.** Em *Firebase → Authentication → Settings → Authorized domains*, confira
   se `observatorioedicoes.com.br` e o domínio `*.vercel.app` do projeto estão na lista.

## Dia a dia

1. Entre em `/admin` e cadastre ou edite livros (como já fazem hoje).
2. Clique em **Publicar no site**.
3. Aguarde de 1 a 2 minutos e atualize o site.

## Se algo der errado

| Sintoma | O que fazer |
| --- | --- |
| Botão mostra "VERCEL_DEPLOY_HOOK_URL ainda não foi configurada" | Faça o passo 3. |
| Botão mostra "Seu usuário não tem permissão" | Cadastre o e-mail em *Configurações* no painel, ou use `ADMIN_EMAILS`. |
| Deploy falha com `[catálogo] ... cota ... esgotada (429)` | A cota diária do Firestore acabou. Ela renova todo dia; clique em Publicar de novo depois. O site continua no ar com a versão anterior. |
| Deploy falha com `[catálogo] ... recusou a leitura pública (403)` | As regras publicadas no Firebase diferem de `firestore.rules`. Publique as regras deste projeto. |
| Livro cadastrado não aparece | Ele precisa estar com status **Publicado** e a publicação precisa ter terminado. |

Se a leitura do Firestore falhar durante um deploy, o build é interrompido de propósito: a
Vercel mantém no ar a versão anterior do site em vez de publicar um catálogo vazio.

## Rodando localmente

```bash
npm install
npm run catalog   # opcional: gera public/data/catalog.json a partir do Firestore
npm run dev
```

Sem o `catalog.json`, o ambiente local lê o Firestore ao vivo, como antes.
