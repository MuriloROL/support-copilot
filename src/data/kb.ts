// Help center of "Bazar Orion", a fictional Brazilian home & electronics e-commerce.
// keywords: synonyms customers actually type, curated by the support team to help keyword search.
export type Article = { id: string; title: string; keywords: string; body: string };

export const STORE_NAME = 'Bazar Orion';

export const articles: Article[] = [
  {
    id: 'prazo-de-entrega',
    title: 'Prazos de entrega',
    keywords: 'quando chega, quantos dias demora, previsão de entrega, pedido atrasado',
    body: `O prazo começa a contar depois que o pagamento é aprovado. Pix é aprovado em minutos, cartão de crédito em até 24 horas e boleto em até 2 dias úteis após o pagamento.

Prazos por região (dias úteis):
- Capitais do Sul e Sudeste: 2 a 4 dias.
- Demais capitais: 4 a 7 dias.
- Interior: 5 a 10 dias.
- Região Norte: 7 a 15 dias.

Se o pedido passou do prazo, aguarde 2 dias úteis, porque a transportadora pode atrasar a atualização. Depois disso, fale com o atendimento informando o número do pedido para abrirmos uma investigação com a transportadora.`,
  },
  {
    id: 'rastreamento',
    title: 'Como rastrear meu pedido',
    keywords: 'código de rastreio, onde está meu pedido, acompanhar a entrega',
    body: `Acesse Minha conta > Pedidos > Rastrear. O código de rastreio também é enviado por e-mail quando o pedido é despachado, o que acontece em até 2 dias úteis após a aprovação do pagamento.

A transportadora pode levar até 24 horas para mostrar a primeira atualização depois do despacho.

Significado dos status:
- Pagamento aprovado: o pedido entrou na fila de separação.
- Em separação: o produto está sendo embalado.
- Despachado: o pedido saiu do nosso centro de distribuição.
- Entregue: a transportadora registrou a entrega.`,
  },
  {
    id: 'troca-e-devolucao',
    title: 'Trocas e devoluções',
    keywords: 'devolver, desistir da compra, arrependimento, trocar produto',
    body: `Devolução por arrependimento: você tem 7 dias corridos a partir do recebimento (Código de Defesa do Consumidor, art. 49). O produto deve estar sem uso, com acessórios e embalagem original. O frete da devolução é por nossa conta.

Troca por outro modelo, cor ou voltagem: até 30 dias após o recebimento. A primeira troca tem frete grátis.

Como solicitar: Minha conta > Pedidos > Solicitar devolução. Geramos uma etiqueta de postagem para você levar o produto a uma agência dos Correios. O reembolso segue as regras do artigo "Reembolso e estorno".`,
  },
  {
    id: 'reembolso',
    title: 'Reembolso e estorno',
    keywords: 'dinheiro de volta, estorno, devolução do valor',
    body: `Quando o produto devolvido chega ao nosso centro de distribuição, a análise leva até 3 dias úteis. Depois da aprovação:

- Pix: o valor volta para a mesma conta em até 2 dias úteis.
- Cartão de crédito: solicitamos o estorno à operadora em até 2 dias úteis. Ele aparece em 1 ou 2 faturas, dependendo da data de fechamento do cartão.
- Boleto: depósito na conta do titular do pedido em até 5 dias úteis, ou vale-compra imediato com 5% de bônus, se você preferir.

Pedidos cancelados antes do despacho seguem os mesmos prazos, sem a etapa de análise.`,
  },
  {
    id: 'formas-de-pagamento',
    title: 'Formas de pagamento',
    keywords: 'parcelar, parcelamento, juros, pix, boleto, cartão',
    body: `Aceitamos:
- Pix, com 5% de desconto no valor dos produtos.
- Cartão de crédito em até 10x sem juros, com parcela mínima de R$ 30.
- Boleto bancário, com vencimento em 2 dias úteis.
- Vale-compra do Bazar Orion.

Não aceitamos cartão de débito nem pagamento na entrega.`,
  },
  {
    id: 'cancelamento',
    title: 'Cancelamento de pedido',
    keywords: 'cancelar, desistir do pedido',
    body: `Você pode cancelar o pedido em Minha conta > Pedidos > Cancelar enquanto o status for "Pagamento aprovado" ou "Em separação".

Depois que o pedido é despachado, não é possível cancelar. Nesse caso, você pode recusar a entrega ou pedir a devolução por arrependimento em até 7 dias após o recebimento.

O reembolso de pedidos cancelados segue o artigo "Reembolso e estorno".`,
  },
  {
    id: 'garantia-e-defeito',
    title: 'Produto com defeito ou avariado',
    keywords: 'parou de funcionar, não liga, quebrado, estragado, danificado, trincado, amassado',
    body: `Defeito em até 90 dias após o recebimento (garantia legal): solicitamos a troca ou o reparo diretamente com a gente. Abra a solicitação em Minha conta > Pedidos > Relatar problema e envie fotos ou vídeo do defeito.

Defeito depois de 90 dias: vale a garantia do fabricante (12 meses na maioria dos eletrônicos), atendida pela assistência técnica autorizada da marca.

Produto avariado no transporte (caixa amassada, peça quebrada): recuse a entrega se perceber na hora. Se já recebeu, registre em até 7 dias pelo mesmo caminho, com fotos do produto e da embalagem. Enviamos um novo produto sem custo.`,
  },
  {
    id: 'cupons',
    title: 'Cupons de desconto',
    keywords: 'código promocional, desconto',
    body: `Os cupons são aplicados no carrinho, no campo "Cupom de desconto". Só é possível usar um cupom por pedido, mas ele soma com o desconto do Pix.

O cupom de primeira compra BEMVINDO10 dá 10% de desconto, limitado a R$ 50, e só vale para o primeiro pedido da conta.

Se o cupom não funcionar, verifique: a validade, o valor mínimo do pedido, se é a primeira compra (no caso do BEMVINDO10) e se o carrinho tem produtos em promoção relâmpago, que não aceitam cupom.`,
  },
  {
    id: 'frete',
    title: 'Frete e frete grátis',
    keywords: 'valor do frete, frete grátis, entrega expressa',
    body: `O frete é calculado no carrinho a partir do CEP.

Frete grátis:
- Sul e Sudeste: compras acima de R$ 199.
- Demais regiões: compras acima de R$ 299.

Entrega expressa: disponível para capitais do Sul e Sudeste, com entrega em 1 dia útil para pedidos aprovados até as 14h. Tem custo adicional, mostrado no carrinho.`,
  },
  {
    id: 'alterar-endereco',
    title: 'Alterar o endereço de entrega',
    keywords: 'endereço errado, mudar endereço, número da casa, CEP errado, complemento',
    body: `O endereço só pode ser alterado antes do despacho, em Minha conta > Pedidos > Alterar endereço, enquanto o status for "Pagamento aprovado" ou "Em separação".

Depois do despacho, não conseguimos alterar. A transportadora faz 3 tentativas de entrega. Se nenhuma der certo, o pedido volta para o nosso centro de distribuição e o reembolso é feito automaticamente em até 10 dias úteis.`,
  },
  {
    id: 'conta-e-senha',
    title: 'Conta, senha e dados pessoais',
    keywords: 'login, acesso, cadastro, e-mail, senha, dados pessoais',
    body: `Esqueci a senha: clique em "Esqueci minha senha" na tela de login. O link de redefinição vale por 1 hora. Se o e-mail não chegar em 10 minutos, confira a caixa de spam e as abas de promoções.

Trocar o e-mail da conta: Minha conta > Dados pessoais. É preciso confirmar a senha atual.

O CPF não pode ser alterado pelo site. Solicitações de exclusão de conta ou de dados pessoais (LGPD) são tratadas pela equipe de privacidade, que responde em até 15 dias, e precisam ser feitas com um atendente.`,
  },
  {
    id: 'nota-fiscal',
    title: 'Nota fiscal',
    keywords: 'NF-e, nota, CPF na nota, CNPJ',
    body: `A nota fiscal eletrônica (NF-e) é enviada por e-mail quando o pedido é despachado e também fica em Minha conta > Pedidos > Nota fiscal.

A nota usa os dados do cadastro no momento da compra. Para compras com CNPJ, informe o CNPJ antes de finalizar o pedido.

Uma nota já emitida não pode ter CPF, CNPJ ou nome alterados pelo site. Esses casos precisam ser analisados por um atendente.`,
  },
];
