-- Modelos de condições gerais (PT + EN). Execute após criar a tabela terms_templates.
INSERT INTO terms_templates (id, name, content_pt, content_en, is_default) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Condições Gerais (Padrão)',
  'Orçamento válido por 30 dias. Aos valores apresentados acresce IVA à taxa legal em vigor.
A reserva da data é efetuada mediante adjudicação de 50% do valor total.
O restante valor deverá ser pago durante a semana do evento.
Pagamentos por transferência bancária ou MB Way (913 588 183).
Inclui montagem, desmontagem, transporte, loiça, atoalhados, mesas, talheres, pratos, copos, rechauds em inox, decoração simples e lavandaria.
Serviços adicionais disponíveis mediante orçamento.
Sobras alimentares são da responsabilidade do cliente, exceto bebidas (apenas garrafas abertas).
Horas extra: 50 EUR por hora.
Cancelamento a menos de 15 dias implica pagamento total.',
  'Quote valid for 30 days. VAT at the applicable legal rate applies to the values presented.
Date reservation is made upon payment of 50% of the total value.
The remaining amount shall be paid during the week of the event.
Payment by bank transfer or MB Way (913 588 183).
Includes setup, dismantling, transport, crockery, tablecloths, tables, cutlery, plates, glasses, stainless steel chafing dishes, simple decoration and laundry.
Additional services available upon quote.
Leftover food is the responsibility of the client, except drinks (opened bottles only).
Overtime: 50 EUR per hour.
Cancellation with less than 15 days notice implies full payment.',
  true
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Condições Gerais (Curto)',
  'Orçamento válido por 30 dias.
Reserva mediante adjudicação de 50% do valor total.
Pagamento final na semana do evento.
Serviços adicionais sob orçamento.
Cancelamento a menos de 15 dias implica pagamento total.',
  'Quote valid for 30 days.
Reservation upon payment of 50% of the total value.
Final payment during the week of the event.
Additional services upon quote.
Cancellation with less than 15 days notice implies full payment.',
  false
)
ON CONFLICT (id) DO NOTHING;
