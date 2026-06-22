# Design: Pesquisa de Satisfação Go-Live (KR6)

**Data:** 2026-06-19  
**OKR:** KR6 — Alcançar nota mínima 8/10 de satisfação dos clientes no go-live  
**Produto:** CPJ-3C

---

## Contexto

O KR6 exige medir satisfação no momento do go-live. Sem coleta estruturada, a nota é
subjetiva e impossível de reportar. Esta solução cria o canal de coleta, fecha o ciclo
de dados até o dashboard de OKR e fornece diagnóstico de CS para atuar em clientes
com nota abaixo de 8.

---

## Decisões de design

| Decisão | Escolha | Motivo |
|---|---|---|
| Métrica do KR6 | Pergunta-âncora 0-10 de satisfação geral | Satisfação é percepção global; sub-notas são diagnóstico, não OKR |
| Acesso do cliente | Página pública (sem login) | Cliente externo não pode ser convidado via Netlify Identity |
| Identificação | Link pré-preenchido `?cliente=slug&nome=Nome` | Dado limpo; sem digitação; permite rastrear quem não respondeu |
| Hospedagem | Netlify público | Mesma stack do dashboard; URL limpa para WhatsApp/e-mail |
| Persistência | JSON no GitHub (append) | Alimenta o dashboard de OKR automaticamente; sem banco extra |
| Profundidade | Âncora + 6 itens (2/bloco) + 2 abertas | Equilibra diagnóstico com taxa de resposta |

---

## Questionário

### Pergunta-âncora (métrica oficial do KR6)

> De forma geral, qual a sua satisfação com o go-live do CPJ-3C?

Escala 0–10 · obrigatória

---

### Bloco ① — Implementador

| # | Pergunta | Escala |
|---|---|---|
| 1.1 | Domínio técnico do consultor sobre o sistema | 0–10 |
| 1.2 | Clareza e didática na comunicação durante o projeto | 0–10 |

---

### Bloco ② — Processo de implementação

| # | Pergunta | Escala |
|---|---|---|
| 2.1 | Cumprimento do prazo combinado do projeto | 0–10 |
| 2.2 | Treinamento de toda a equipe (não apenas o ponto focal) | 0–10 |

---

### Bloco ③ — Produto (CPJ-3C)

| # | Pergunta | Escala |
|---|---|---|
| 3.1 | O sistema atende às necessidades do escritório | 0–10 |
| 3.2 | O CPJ entregou o que foi prometido na venda | 0–10 |

---

### Perguntas abertas (no final)

| # | Pergunta | Obrigatoriedade |
|---|---|---|
| A1 | O que poderia ter sido melhor? | Obrigatória |
| A2 | O que mais te agradou no processo? | Opcional |

---

## Arquitetura

### Componentes

```
pesquisa-golive/
├── index.html                       # Formulário do cliente (público)
├── gerador-link.html                # Ferramenta interna para gerar links pré-preenchidos
├── netlify/
│   └── functions/
│       └── salvar-resposta.js       # Netlify Function: append de resposta no GitHub
├── netlify.toml
└── .gitignore
```

O arquivo de dados vive no repositório OKR (já existente):
```
OKR/
└── data/
    └── respostas-satisfacao.json    # Array de respostas; fonte da verdade do KR6
```

### Fluxo de dados

```
Você abre gerador-link.html
  → digita nome do escritório → copia o link gerado
  → envia via WhatsApp ou e-mail para o cliente

Cliente abre o link no celular (sem login)
  → responde as notas e as perguntas abertas
  → clica em Enviar

index.html (JS) faz POST para /.netlify/functions/salvar-resposta
  → salvar-resposta.js lê array atual do GitHub
  → faz append da nova resposta (não sobrescreve)
  → grava de volta no GitHub com commit automático

okr_dashboard_barbara.html
  → lê respostas-satisfacao.json do GitHub
  → calcula média das âncoras → exibe no card do KR6
  → lista escritórios com nota < 8 para ação de CS
```

### Estrutura de uma resposta (JSON)

```json
{
  "cliente_slug": "silva-advogados",
  "cliente_nome": "Silva Advogados",
  "data_resposta": "2026-06-19T14:32:00.000Z",
  "implementador_nome": "",
  "ancora": 9,
  "bloco_implementador": {
    "dominio_tecnico": 9,
    "clareza_comunicacao": 10
  },
  "bloco_processo": {
    "cumprimento_prazo": 8,
    "treinamento_equipe": 7
  },
  "bloco_produto": {
    "atende_necessidades": 9,
    "entregou_prometido": 8
  },
  "aberta_melhorar": "O prazo foi um pouco apertado no final.",
  "aberta_agradou": "A paciência do consultor foi excepcional."
}
```

---

## Regras de negócio

### Cálculo do KR6

```
Nota KR6 = média aritmética de todas as âncoras do período
Meta: KR6 ≥ 8,0
```

Os 6 itens dos blocos **não entram na conta** — são diagnóstico. O dashboard pode
exibir a média de cada bloco como painel auxiliar.

### Alerta de CS

Qualquer resposta com âncora ≤ 7 deve aparecer destacada no dashboard como "ação
necessária". É a mesma lógica de classificação da skill de CS: NPS ≤ 6 → não encerrar
formalmente; 7–8 → encerrar com plano de acompanhamento 30 dias.

### Anti-duplicata

Se chegar uma segunda resposta com o mesmo `cliente_slug`, a mais recente substitui a
anterior (upsert por slug). Mantém o array limpo e o KR6 preciso.

### Validação no formulário

- Sem parâmetro `?cliente=` na URL → alerta visível + botão de envio bloqueado.
- Todas as notas 0–10 e a pergunta aberta obrigatória (A1) devem estar preenchidas
  antes de habilitar o envio.
- Falha de rede → mensagem de erro clara + botão "Tentar novamente"; nenhum dado perdido.

---

## Identidade visual

- Paleta e fonte Preâmbulo (consistente com `formulario-novo-projeto` e `handoff-cpj3c`).
- Responsivo: otimizado para celular (cliente abre pelo WhatsApp).
- Escala de notas com seleção visual por botões (0 a 10), não campo de texto.

---

## Fora de escopo (fase 1)

- Notificação automática por e-mail/WhatsApp quando o cliente responde.
- Relatório exportável por período em PDF ou Excel.

Estes itens podem ser adicionados numa fase 2 sem alterar a arquitetura definida aqui.

---

## Integração com o dashboard OKR

O `okr_dashboard_barbara.html` já busca dados de `data/*.json` no GitHub. A integração
do KR6 é uma aba nova no dashboard existente com duas seções:

### Seção A — Card KR6 (visão executiva)

- Nota média das âncoras do período (ex: últimos 90 dias)
- Total de respostas coletadas
- Barra de progresso visual em relação à meta ≥ 8,0
- Médias por bloco (implementador / processo / produto) como diagnóstico auxiliar

### Seção B — Painel de gestão (tabela completa)

Tabela com todas as respostas, com as colunas:

| Coluna | Detalhe |
|---|---|
| Escritório | `cliente_nome` |
| Data | `data_resposta` formatada |
| Nota geral | `ancora` com cor: verde ≥8 · amarelo 7 · vermelho ≤6 |
| Implementador | média do bloco |
| Processo | média do bloco |
| Produto | média do bloco |
| O que melhorar | `aberta_melhorar` (texto expandível) |
| Status CS | "Ação necessária" se âncora ≤ 7, "OK" se ≥ 8 |

Ordenação padrão: mais recente primeiro. Permite rastrear quem já respondeu e identificar
de imediato os casos que precisam de acompanhamento de CS.

A aba é interna (mesmo acesso do dashboard) — o cliente nunca vê essa tela.
