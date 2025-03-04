/*
  # Create queue table for task management

  1. New Tables
    - `queue`
      - `id` (uuid, primary key)
      - `org_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `agent_id` (uuid, foreign key)
      - `action` (text)
      - `status` (text)
      - `priority` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `scheduled_for` (timestamptz)
      - `completed_at` (timestamptz)
      - `error` (text)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on `queue` table
    - Add policy for authenticated users to read queue items
*/

DO $$ 
BEGIN
  -- Create queue table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'queue') THEN
    CREATE TABLE queue (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid REFERENCES organizations(id),
      user_id uuid REFERENCES users(id),
      agent_id uuid REFERENCES agents(id),
      action text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      priority integer NOT NULL DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      scheduled_for timestamptz,
      completed_at timestamptz,
      error text,
      metadata jsonb DEFAULT '{}'::jsonb,
      CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
    );

    -- Enable RLS
    ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

    -- Create policy for reading queue items
    CREATE POLICY "Users can read queue items"
      ON queue
      FOR SELECT
      TO authenticated
      USING (true);

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS queue_status_priority_idx ON queue (status, priority DESC, created_at ASC);
    CREATE INDEX IF NOT EXISTS queue_org_id_idx ON queue (org_id);
    CREATE INDEX IF NOT EXISTS queue_user_id_idx ON queue (user_id);
  END IF;
END $$;