-- Purge existing data to allow for a clean migration
TRUNCATE public.entity_relations, public.characters, public.players, public.locations, public.factions, public.items, public.religions, public.puzzles, public.quest_hooks, public.world_lore, public.campaign_logs, public.entities CASCADE;

-- Ensure service_role and others have access to specialized tables, specifically campaign_logs
GRANT ALL ON public.campaign_logs TO service_role;
GRANT ALL ON public.campaign_logs TO postgres;
GRANT ALL ON public.campaign_logs TO authenticated;
GRANT ALL ON public.campaign_logs TO anon;

-- Explicitly disable RLS on specialized tables to ensure the service role can migrate data
ALTER TABLE public.campaign_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.religions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_hooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_lore DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.factions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relations DISABLE ROW LEVEL SECURITY;

-- Also ensure other specialized tables have proper grants
GRANT ALL ON public.players TO service_role;
GRANT ALL ON public.items TO service_role;
GRANT ALL ON public.religions TO service_role;
GRANT ALL ON public.puzzles TO service_role;
GRANT ALL ON public.quest_hooks TO service_role;
GRANT ALL ON public.world_lore TO service_role;
GRANT ALL ON public.characters TO service_role;
GRANT ALL ON public.factions TO service_role;
GRANT ALL ON public.locations TO service_role;
GRANT ALL ON public.entities TO service_role;
GRANT ALL ON public.entity_relations TO service_role;

-- Ensure proper policies for all specialized tables
-- These follow the pattern established in 20260801170000_add_specialized_entities.sql
DO $$
BEGIN
    -- Characters
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Admins can do everything on characters') THEN
        CREATE POLICY "Admins can do everything on characters" ON public.characters FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'Global knowledge viewable on characters') THEN
        CREATE POLICY "Global knowledge viewable on characters" ON public.characters FOR SELECT USING (campaign_id IS NULL);
    END IF;

    -- Factions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'factions' AND policyname = 'Admins can do everything on factions') THEN
        CREATE POLICY "Admins can do everything on factions" ON public.factions FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'factions' AND policyname = 'Global knowledge viewable on factions') THEN
        CREATE POLICY "Global knowledge viewable on factions" ON public.factions FOR SELECT USING (campaign_id IS NULL);
    END IF;

    -- Locations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Admins can do everything on locations') THEN
        CREATE POLICY "Admins can do everything on locations" ON public.locations FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Global knowledge viewable on locations') THEN
        CREATE POLICY "Global knowledge viewable on locations" ON public.locations FOR SELECT USING (campaign_id IS NULL);
    END IF;
END
$$;
