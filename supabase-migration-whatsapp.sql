-- Migration: Resumo matinal via WhatsApp
-- Aplicar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_number text,                              -- formato E.164 sem '+': 5511999998888
  daily_summary_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_settings_own ON notification_settings;
CREATE POLICY notification_settings_own ON notification_settings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
