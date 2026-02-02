-- FLOWYA: tabla feedback para MVP (Bitácora 031 ajuste)
-- Sin relaciones ni triggers.

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  user_id uuid,
  user_email text,
  url text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: permitir insert desde anon (API serverless usa anon key)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert feedback"
  ON feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
