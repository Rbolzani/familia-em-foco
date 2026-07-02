-- Marca quando um convite pendente foi copiado/compartilhado pelo owner,
-- para que ele deixe de aparecer na lista de "convites pendentes" em
-- Configurações (mesmo após refresh/login em outro dispositivo).
-- O token continua válido para o convidado aceitar — isso só afeta a
-- visibilidade do link na tela do owner, não a validade do convite.

alter table public.family_invites
  add column if not exists shared_at timestamptz;
