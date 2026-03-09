CREATE TABLE IF NOT EXISTS public.singles (
    id bigserial PRIMARY KEY,
    match_number integer NOT NULL,
    match_date date NOT NULL,
    player1_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    player2_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    points_won_p1 numeric(5,2) NOT NULL DEFAULT 0,
    points_won_p2 numeric(5,2) NOT NULL DEFAULT 0,
    rounds numeric(5,2),
    winner text CHECK (winner IN ('P1', 'P2', 'TIE')),
    p1_kscore integer,
    p1_rating_old numeric(10,2),
    p1_rating_change numeric(10,2),
    p1_rating_new numeric(10,2),
    p2_kscore integer,
    p2_rating_old numeric(10,2),
    p2_rating_change numeric(10,2),
    p2_rating_new numeric(10,2),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_singles_match_date ON public.singles (match_date);
CREATE INDEX IF NOT EXISTS idx_singles_player1_id ON public.singles (player1_id);
CREATE INDEX IF NOT EXISTS idx_singles_player2_id ON public.singles (player2_id);

ALTER TABLE public.singles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Singles are readable by everyone"
    ON public.singles FOR SELECT
    TO public
    USING (true);
