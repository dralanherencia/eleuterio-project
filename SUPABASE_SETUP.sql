-- =====================================================
-- ELEUTERIO PROJECT — Supabase Setup SQL
-- Ejecutar en: supabase.com → SQL Editor → New Query
-- =====================================================

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_id uuid REFERENCES clients(id),
  start_date date,
  end_date date,
  color text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  client_id uuid REFERENCES clients(id),
  title text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','review','done')),
  progress int DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date date,
  next_step text,
  notes text,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS (permisivo para desarrollo)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_clients"  ON clients  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tasks"    ON tasks    FOR ALL USING (true) WITH CHECK (true);

-- Clientes base
INSERT INTO clients (name, color) VALUES
  ('MEPSO',          '#378ADD'),
  ('INERCO / EDF',   '#1D9E75'),
  ('EsSalud',        '#7F77DD'),
  ('Wari San Román', '#D85A30'),
  ('Personal',       '#888780');
