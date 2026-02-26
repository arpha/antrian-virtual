-- Tabel Merchants
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  shop_name TEXT NOT NULL,
  shop_slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_open BOOLEAN DEFAULT true,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel Counters (Loket/Meja Layanan)
CREATE TABLE counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Contoh: "Loket 1", "Meja A"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel Queues (Antrean)
CREATE TABLE queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  queue_number INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'calling', 'serving', 'skipped', 'completed')),
  counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
  called_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;

-- Policies for Merchants (Pelaku usaha hanya bisa akses data miliknya)
CREATE POLICY "Merchants can view own data" ON merchants FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Merchants can update own data" ON merchants FOR UPDATE USING (auth.uid() = id);

-- Policies for Counters
CREATE POLICY "Merchants can manage own counters" ON counters FOR ALL USING (
  merchant_id = auth.uid()
);
CREATE POLICY "Public can view counters" ON counters FOR SELECT USING (true);

-- Policies for Queues
CREATE POLICY "Merchants can manage own queues" ON queues FOR ALL USING (
  merchant_id = auth.uid()
);
CREATE POLICY "Public can insert queues" ON queues FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view queues" ON queues FOR SELECT USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_queues_updated_at BEFORE UPDATE ON queues FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to create merchant profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.merchants (id, name, email, shop_name, shop_slug)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'Toko Baru ' || substr(NEW.id::text, 1, 5),
    'toko-' || substr(NEW.id::text, 1, 5)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
