-- Re-enable RLS on all specialized tables
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.religions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_lore ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relations ENABLE ROW LEVEL SECURITY;

-- Ensure "Admins can do everything" policies exist for all specialized tables
DO $$
BEGIN
    -- Items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Admins can do everything on items') THEN
        CREATE POLICY "Admins can do everything on items" ON public.items FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;

    -- Religions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religions' AND policyname = 'Admins can do everything on religions') THEN
        CREATE POLICY "Admins can do everything on religions" ON public.religions FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;

    -- Puzzles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'puzzles' AND policyname = 'Admins can do everything on puzzles') THEN
        CREATE POLICY "Admins can do everything on puzzles" ON public.puzzles FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;

    -- Quest Hooks
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quest_hooks' AND policyname = 'Admins can do everything on quest_hooks') THEN
        CREATE POLICY "Admins can do everything on quest_hooks" ON public.quest_hooks FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;

    -- World Lore
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'world_lore' AND policyname = 'Admins can do everything on world_lore') THEN
        CREATE POLICY "Admins can do everything on world_lore" ON public.world_lore FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;

    -- Campaign Logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_logs' AND policyname = 'Admins can do everything on campaign_logs') THEN
        CREATE POLICY "Admins can do everything on campaign_logs" ON public.campaign_logs FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');
    END IF;

    -- Add missing campaign-specific view policies for players
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Users can view players related to their campaigns') THEN
        CREATE POLICY "Users can view players related to their campaigns" ON public.players FOR SELECT USING (
            campaign_id IS NULL OR 
            campaign_id IN (SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid())
        );
    END IF;

    -- Add missing campaign-specific view policies for items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Users can view items related to their campaigns') THEN
        CREATE POLICY "Users can view items related to their campaigns" ON public.items FOR SELECT USING (
            campaign_id IS NULL OR 
            campaign_id IN (SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid())
        );
    END IF;

    -- Add missing campaign-specific view policies for religions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religions' AND policyname = 'Users can view religions related to their campaigns') THEN
        CREATE POLICY "Users can view religions related to their campaigns" ON public.religions FOR SELECT USING (
            campaign_id IS NULL OR 
            campaign_id IN (SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid())
        );
    END IF;

    -- Add missing campaign-specific view policies for puzzles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'puzzles' AND policyname = 'Users can view puzzles related to their campaigns') THEN
        CREATE POLICY "Users can view puzzles related to their campaigns" ON public.puzzles FOR SELECT USING (
            campaign_id IS NULL OR 
            campaign_id IN (SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid())
        );
    END IF;

    -- Add missing campaign-specific view policies for quest_hooks
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quest_hooks' AND policyname = 'Users can view quest_hooks related to their campaigns') THEN
        CREATE POLICY "Users can view quest_hooks related to their campaigns" ON public.quest_hooks FOR SELECT USING (
            campaign_id IS NULL OR 
            campaign_id IN (SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid())
        );
    END IF;

    -- Add missing campaign-specific view policies for world_lore
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'world_lore' AND policyname = 'Users can view world_lore related to their campaigns') THEN
        CREATE POLICY "Users can view world_lore related to their campaigns" ON public.world_lore FOR SELECT USING (
            campaign_id IS NULL OR 
            campaign_id IN (SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid())
        );
    END IF;

    -- Add missing campaign-specific view policies for campaign_logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_logs' AND policyname = 'Users can view campaign_logs related to their campaigns') THEN
        CREATE POLICY "Users can view campaign_logs related to their campaigns" ON public.campaign_logs FOR SELECT USING (
            campaign_id IS NULL OR 
            campaign_id IN (SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid())
        );
    END IF;
END
$$;