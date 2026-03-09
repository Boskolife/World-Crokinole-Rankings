CREATE TABLE IF NOT EXISTS public.doubles (
    id bigserial PRIMARY KEY,
    match_number integer NOT NULL,
    match_date date NOT NULL,
    player1_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    player2_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    player3_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    player4_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    points_won_team1 numeric(5,2) NOT NULL DEFAULT 0,
    points_won_team2 numeric(5,2) NOT NULL DEFAULT 0,
    rounds numeric(5,2),
    winner text CHECK (winner IN ('T1', 'T2', 'TIE')),
    p1_kscore integer,
    p1_rating_old numeric(10,2),
    p1_rating_change numeric(10,2),
    p1_rating_new numeric(10,2),
    p2_kscore integer,
    p2_rating_old numeric(10,2),
    p2_rating_change numeric(10,2),
    p2_rating_new numeric(10,2),
    p3_kscore integer,
    p3_rating_old numeric(10,2),
    p3_rating_change numeric(10,2),
    p3_rating_new numeric(10,2),
    p4_kscore integer,
    p4_rating_old numeric(10,2),
    p4_rating_change numeric(10,2),
    p4_rating_new numeric(10,2),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doubles_match_date ON public.doubles (match_date);
CREATE INDEX IF NOT EXISTS idx_doubles_player1_id ON public.doubles (player1_id);
CREATE INDEX IF NOT EXISTS idx_doubles_player2_id ON public.doubles (player2_id);
CREATE INDEX IF NOT EXISTS idx_doubles_player3_id ON public.doubles (player3_id);
CREATE INDEX IF NOT EXISTS idx_doubles_player4_id ON public.doubles (player4_id);

ALTER TABLE public.doubles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doubles are readable by everyone"
    ON public.doubles FOR SELECT
    TO public
    USING (true);
