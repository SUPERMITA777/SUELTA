-- Create garments table for the SUELTA circular fashion store
CREATE TABLE IF NOT EXISTS public.garments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  size TEXT,
  brand TEXT,
  condition TEXT DEFAULT 'Buen estado',
  tags TEXT[] DEFAULT '{}',
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.garments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active garments (public storefront)
CREATE POLICY "Anyone can read active garments"
  ON public.garments
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to manage garments (admin)
CREATE POLICY "Authenticated users can insert garments"
  ON public.garments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update garments"
  ON public.garments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete garments"
  ON public.garments
  FOR DELETE
  TO authenticated
  USING (true);

-- Also allow authenticated users to read all garments (including inactive)
CREATE POLICY "Authenticated users can read all garments"
  ON public.garments
  FOR SELECT
  TO authenticated
  USING (true);
