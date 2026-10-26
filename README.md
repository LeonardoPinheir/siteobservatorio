# Observatório Edições

Site estático da editora. Sem banco de dados, sem login, sem build: são arquivos HTML, CSS e JavaScript.

```
site/                  o que vai para o ar (a Vercel publica esta pasta)
  data/books.json      os livros do catálogo
  data/chamadas.json   as chamadas de submissão
  data/site.json       e-mail, telefone e endereço
  img/capas/           capas dos livros (opcional)
site/editor/           editor online de livros e chamadas (publica direto no GitHub)
vercel.json            diz à Vercel para publicar a pasta site
```

## Subir na Vercel (uma vez)

1. Em vercel.com: **Add New → Project**, escolha este repositório e clique em **Deploy**.
   Não precisa mudar nenhuma configuração nem criar variáveis.
2. Em **Settings → Domains**, adicione `observatorioedicoes.com.br` e `www.observatorioedicoes.com.br`
   e ajuste o DNS como a Vercel indicar.

Depois disso, todo envio (commit) ao GitHub publica o site sozinho em cerca de 1 minuto.

## Cadastrar ou editar livros e chamadas (editor online)

O editor fica em `https://observatorioedicoes.com.br/editor` (não aparece no menu nem nos buscadores).

**Conectar, uma única vez por navegador:**

1. Em `/editor`, clique em **GitHub**.
2. Siga os passos da janela: criar um *fine-grained token* em github.com/settings/personal-access-tokens/new,
   com acesso só ao repositório `siteobservatorio` e permissão **Contents: Read and write**. Cole o token e conecte.
   O token fica guardado só nesse navegador. Quem tiver o token consegue alterar o site: não compartilhe.
   Quem for editar precisa ter permissão de escrita no repositório (adicione como colaborador no GitHub).

**Usar:**

1. Abra **Livros** ou **Chamadas**. A lista vem direto do GitHub.
2. Cadastre, edite, exclua e ordene (arraste pela alça `⠿` ou use as setas). Capas e imagens são reduzidas sozinhas.
3. Clique em **Publicar no site**. Tudo vai em um único envio ao GitHub e a Vercel atualiza o site em cerca de 1 minuto.

Se outra pessoa publicou antes de você, a ferramenta avisa antes de sobrescrever.
Sem internet ou sem token, use **Baixar zip (reserva)**, descompacte dentro da pasta `site` e envie ao GitHub.

Os livros de exemplo somem sozinhos assim que existir ao menos um livro real.

## Outras edições

- **Chamadas:** use o editor online (**Chamadas**). Cada chamada ganha um card em `/chamadas` e uma página própria em `/chamada?id=...`. Também dá para editar `site/data/chamadas.json` à mão.
- **Conselho editorial:** edite `site/data/conselho.json`. Exemplo: `{"introducao": "Texto opcional.", "membros": [{"nome": "Prof. Dr. Maria Silva", "funcao": "Presidente", "instituicao": "UFT", "link": "https://...", "foto": "/img/conselho/maria.jpg"}]}` (link e foto são opcionais; sem foto aparecem as iniciais).
- **Prêmios e reconhecimentos:** edite `site/data/premios.json`. Exemplo: `{"premios": [{"titulo": "Nome do prêmio", "ano": "2025", "instituicao": "Quem concedeu", "descricao": "Texto livre.", "link": "https://...", "imagem": "/img/premios/x.jpg"}]}`.
- **Publicações em co-edição:** no editor de livros, preencha o campo "Co-edição com" (instituição parceira). O livro aparece sozinho na página Co-edições.
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
