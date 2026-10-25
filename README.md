# Observatório Edições

Site estático da editora. Sem banco de dados, sem login, sem build: são arquivos HTML, CSS e JavaScript.

```
site/                  o que vai para o ar (a Vercel publica esta pasta)
  data/books.json      os livros do catálogo
  data/chamadas.json   as chamadas de submissão
  data/site.json       e-mail, telefone e endereço
  img/capas/           capas dos livros (opcional)
ferramenta-cadastro/   ferramenta de cadastro (fica só no seu computador, não vai para o ar)
vercel.json            diz à Vercel para publicar a pasta site
```

## Subir na Vercel (uma vez)

1. Em vercel.com: **Add New → Project**, escolha este repositório e clique em **Deploy**.
   Não precisa mudar nenhuma configuração nem criar variáveis.
2. Em **Settings → Domains**, adicione `observatorioedicoes.com.br` e `www.observatorioedicoes.com.br`
   e ajuste o DNS como a Vercel indicar.

Depois disso, todo envio (commit) ao GitHub publica o site sozinho em cerca de 1 minuto.

## Cadastrar ou editar livros

1. Baixe o repositório (ou use o GitHub Desktop) e abra `ferramenta-cadastro/index.html` no navegador.
2. Clique em **Abrir books.json** e escolha `site/data/books.json`.
3. Cadastre, edite ou exclua livros. Para a capa, escolha uma imagem; ela é reduzida sozinha.
   Ao salvar, a ferramenta já abre um livro novo (repetindo área, coleção, ano e idioma, se você deixar marcado).
   Para mudar a ordem, arraste pela alça `⠿` ou use as setas. Também dá para ordenar por ano, título, autor ou área
   e clicar em **Usar esta ordem no site**. A ordem da lista é a que o site mostra por padrão.
4. Clique em **Baixar atualização (.zip)**.
5. Descompacte o zip **dentro da pasta `site`**, aceitando substituir `data/books.json`.
6. Envie ao GitHub (commit e push, ou *Add file → Upload files* no site do GitHub, mantendo as pastas).

Os livros de exemplo somem sozinhos assim que existir ao menos um livro real.

## Outras edições

- **Chamadas:** edite `site/data/chamadas.json` (título, situação, prazo e descrição).
- **Contato:** edite `site/data/site.json`.
- **Modelo de submissão:** substitua o arquivo `site/modelo-submissao.docx` (mantenha o mesmo nome).

## Formulários

Contato e submissão abrem o programa de e-mail da pessoa com a mensagem pronta para `opajeuft@gmail.com`.
Não há servidor nem armazenamento de mensagens. A obra é anexada pela própria pessoa no e-mail.

## Testar no computador

```bash
npx serve site     # ou: python3 -m http.server --directory site
```
(com o `python3 -m http.server` os endereços sem `.html`, como `/publicacoes`, não funcionam; use `/publicacoes.html`.)
