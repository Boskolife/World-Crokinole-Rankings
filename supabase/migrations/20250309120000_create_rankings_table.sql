CREATE TABLE IF NOT EXISTS public.rankings (
    id bigserial PRIMARY KEY,
    category text NOT NULL CHECK (category IN ('laurels', 'singles', 'doubles')),
    rank integer NOT NULL,
    player_id text,
    name text NOT NULL DEFAULT '',
    laurels integer NOT NULL DEFAULT 0,
    trend text NOT NULL DEFAULT '—',
    trend_up boolean NOT NULL DEFAULT true,
    wins integer NOT NULL DEFAULT 0,
    losses integer NOT NULL DEFAULT 0,
    ties integer NOT NULL DEFAULT 0,
    kingdom text NOT NULL DEFAULT '',
    club text NOT NULL DEFAULT '',
    rating numeric(10,2) NOT NULL DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    UNIQUE (category, rank)
);

CREATE INDEX IF NOT EXISTS idx_rankings_category ON public.rankings (category);
CREATE INDEX IF NOT EXISTS idx_rankings_category_rank ON public.rankings (category, rank);

ALTER TABLE public.rankings ADD COLUMN IF NOT EXISTS player_id text;
ALTER TABLE public.rankings ADD COLUMN IF NOT EXISTS rating numeric(10,2) DEFAULT 0;

ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rankings are readable by everyone" ON public.rankings;
CREATE POLICY "Rankings are readable by everyone"
    ON public.rankings FOR SELECT
    TO public
    USING (true);

CREATE OR REPLACE FUNCTION refresh_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cutoff_90d date := current_date - interval '90 days';
    cutoff_12m date := current_date - interval '12 months';
    cutoff_24m date := current_date - interval '24 months';
BEGIN
    DELETE FROM public.rankings;

    CREATE TEMP TABLE IF NOT EXISTS _laurels_per_player (player_id text PRIMARY KEY, laurels int);
    TRUNCATE _laurels_per_player;

    INSERT INTO _laurels_per_player (player_id, laurels)
    WITH all_matches AS (
        SELECT player1_id AS player_id, match_date, COALESCE(p1_rating_change, 0) AS rating_change FROM public.singles
        UNION ALL
        SELECT player2_id, match_date, COALESCE(p2_rating_change, 0) FROM public.singles
        UNION ALL
        SELECT player1_id, match_date, COALESCE(p1_rating_change, 0) FROM public.doubles
        UNION ALL
        SELECT player2_id, match_date, COALESCE(p2_rating_change, 0) FROM public.doubles
        UNION ALL
        SELECT player3_id, match_date, COALESCE(p3_rating_change, 0) FROM public.doubles
        UNION ALL
        SELECT player4_id, match_date, COALESCE(p4_rating_change, 0) FROM public.doubles
    ),
    tournament_scores AS (
        SELECT player_id, match_date,
            SUM(rating_change) AS day_score
        FROM all_matches
        WHERE match_date >= cutoff_24m
        GROUP BY player_id, match_date
    ),
    top8_with_weight AS (
        SELECT player_id, day_score,
            CASE WHEN match_date >= cutoff_12m THEN 1.0 ELSE 0.75 END AS weight,
            ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY day_score DESC) AS rn
        FROM tournament_scores
    )
    SELECT player_id, ROUND(SUM(day_score * weight))::int
    FROM top8_with_weight
    WHERE rn <= 8
    GROUP BY player_id;

    INSERT INTO public.rankings (category, rank, player_id, name, laurels, trend, trend_up, wins, losses, ties, kingdom, club, rating)
    WITH singles_players AS (
        SELECT player1_id AS player_id, match_date, p1_rating_new AS rating_new, COALESCE(p1_rating_change, 0) AS rating_change,
            (CASE WHEN winner = 'P1' THEN 1 ELSE 0 END) AS wins,
            (CASE WHEN winner = 'P2' THEN 1 ELSE 0 END) AS losses,
            (CASE WHEN winner = 'TIE' THEN 1 ELSE 0 END) AS ties
        FROM public.singles
        UNION ALL
        SELECT player2_id, match_date, p2_rating_new, COALESCE(p2_rating_change, 0),
            (CASE WHEN winner = 'P2' THEN 1 ELSE 0 END),
            (CASE WHEN winner = 'P1' THEN 1 ELSE 0 END),
            (CASE WHEN winner = 'TIE' THEN 1 ELSE 0 END)
        FROM public.singles
    ),
    rating_90d_singles AS (
        SELECT DISTINCT ON (player_id) player_id, rating_new AS rating_90d
        FROM singles_players
        WHERE match_date <= cutoff_90d
        ORDER BY player_id, match_date DESC
    ),
    singles_agg AS (
        SELECT player_id,
            (array_agg(rating_new ORDER BY match_date DESC NULLS LAST))[1] AS rating,
            SUM(wins)::int AS wins,
            SUM(losses)::int AS losses,
            SUM(ties)::int AS ties
        FROM singles_players
        GROUP BY player_id
    ),
    singles_ranked AS (
        SELECT player_id, wins, losses, ties, sa.rating,
            ROW_NUMBER() OVER (ORDER BY COALESCE(sa.rating, 0) DESC)::int AS rn
        FROM singles_agg sa
    )
    SELECT 'singles', sr.rn, sr.player_id, COALESCE(p.name, ''),
        COALESCE(lp.laurels, 0),
        CASE WHEN r90.rating_90d IS NULL THEN '—'
             WHEN sr.rating - r90.rating_90d = 0 THEN '—'
             WHEN sr.rating - r90.rating_90d > 0 THEN '+' || ROUND((sr.rating - r90.rating_90d)::numeric, 2)::text
             ELSE ROUND((sr.rating - r90.rating_90d)::numeric, 2)::text END,
        COALESCE((sr.rating - r90.rating_90d) >= 0, true),
        sr.wins, sr.losses, sr.ties, COALESCE(p.kingdom, ''), COALESCE(p.club, ''), COALESCE(sr.rating, 0)
    FROM singles_ranked sr
    LEFT JOIN public.players p ON p.id::text = sr.player_id OR p.user_id::text = sr.player_id
    LEFT JOIN _laurels_per_player lp ON lp.player_id = sr.player_id
    LEFT JOIN rating_90d_singles r90 ON r90.player_id = sr.player_id
    ORDER BY sr.rn;

    INSERT INTO public.rankings (category, rank, player_id, name, laurels, trend, trend_up, wins, losses, ties, kingdom, club, rating)
    WITH doubles_players AS (
        SELECT player1_id AS player_id, match_date, p1_rating_new AS rating_new, COALESCE(p1_rating_change, 0) AS rating_change,
            (CASE WHEN winner = 'T1' THEN 1 ELSE 0 END) AS wins, (CASE WHEN winner = 'T2' THEN 1 ELSE 0 END) AS losses, (CASE WHEN winner = 'TIE' THEN 1 ELSE 0 END) AS ties FROM public.doubles
        UNION ALL
        SELECT player2_id, match_date, p2_rating_new, COALESCE(p2_rating_change, 0),
            (CASE WHEN winner = 'T1' THEN 1 ELSE 0 END), (CASE WHEN winner = 'T2' THEN 1 ELSE 0 END), (CASE WHEN winner = 'TIE' THEN 1 ELSE 0 END) FROM public.doubles
        UNION ALL
        SELECT player3_id, match_date, p3_rating_new, COALESCE(p3_rating_change, 0),
            (CASE WHEN winner = 'T2' THEN 1 ELSE 0 END), (CASE WHEN winner = 'T1' THEN 1 ELSE 0 END), (CASE WHEN winner = 'TIE' THEN 1 ELSE 0 END) FROM public.doubles
        UNION ALL
        SELECT player4_id, match_date, p4_rating_new, COALESCE(p4_rating_change, 0),
            (CASE WHEN winner = 'T2' THEN 1 ELSE 0 END), (CASE WHEN winner = 'T1' THEN 1 ELSE 0 END), (CASE WHEN winner = 'TIE' THEN 1 ELSE 0 END) FROM public.doubles
    ),
    rating_90d_doubles AS (
        SELECT DISTINCT ON (player_id) player_id, rating_new AS rating_90d
        FROM doubles_players
        WHERE match_date <= cutoff_90d
        ORDER BY player_id, match_date DESC
    ),
    doubles_agg AS (
        SELECT player_id,
            (array_agg(rating_new ORDER BY match_date DESC NULLS LAST))[1] AS rating,
            SUM(wins)::int AS wins,
            SUM(losses)::int AS losses,
            SUM(ties)::int AS ties
        FROM doubles_players
        GROUP BY player_id
    ),
    doubles_ranked AS (
        SELECT player_id, wins, losses, ties, rating,
            ROW_NUMBER() OVER (ORDER BY COALESCE(rating, 0) DESC)::int AS rn
        FROM doubles_agg
    )
    SELECT 'doubles', dr.rn, dr.player_id, COALESCE(p.name, ''),
        COALESCE(lp.laurels, 0),
        CASE WHEN r90.rating_90d IS NULL THEN '—'
             WHEN dr.rating - r90.rating_90d = 0 THEN '—'
             WHEN dr.rating - r90.rating_90d > 0 THEN '+' || ROUND((dr.rating - r90.rating_90d)::numeric, 2)::text
             ELSE ROUND((dr.rating - r90.rating_90d)::numeric, 2)::text END,
        COALESCE((dr.rating - r90.rating_90d) >= 0, true),
        dr.wins, dr.losses, dr.ties, COALESCE(p.kingdom, ''), COALESCE(p.club, ''), COALESCE(dr.rating, 0)
    FROM doubles_ranked dr
    LEFT JOIN public.players p ON p.id::text = dr.player_id OR p.user_id::text = dr.player_id
    LEFT JOIN _laurels_per_player lp ON lp.player_id = dr.player_id
    LEFT JOIN rating_90d_doubles r90 ON r90.player_id = dr.player_id
    ORDER BY dr.rn;

    INSERT INTO public.rankings (category, rank, player_id, name, laurels, trend, trend_up, wins, losses, ties, kingdom, club, rating)
    WITH all_matches_laurels AS (
        SELECT player1_id AS player_id, match_date, p1_rating_new AS rating_new FROM public.singles
        UNION ALL
        SELECT player2_id, match_date, p2_rating_new FROM public.singles
        UNION ALL
        SELECT player1_id, match_date, p1_rating_new FROM public.doubles
        UNION ALL
        SELECT player2_id, match_date, p2_rating_new FROM public.doubles
        UNION ALL
        SELECT player3_id, match_date, p3_rating_new FROM public.doubles
        UNION ALL
        SELECT player4_id, match_date, p4_rating_new FROM public.doubles
    ),
    rating_90d_combined AS (
        SELECT DISTINCT ON (player_id) player_id, rating_new AS rating_90d
        FROM all_matches_laurels
        WHERE match_date <= cutoff_90d
        ORDER BY player_id, match_date DESC
    ),
    laurels_ranked AS (
        SELECT id, user_id, name, kingdom, club,
            COALESCE(rating, 0) AS rating,
            ROW_NUMBER() OVER (ORDER BY COALESCE(rating, 0) DESC NULLS LAST)::int AS rn
        FROM public.players
        WHERE name IS NOT NULL AND name != ''
    )
    SELECT 'laurels', lr.rn, COALESCE(lr.user_id::text, lr.id::text), COALESCE(lr.name, ''),
        COALESCE(lp.laurels, 0),
        CASE WHEN r90.rating_90d IS NULL THEN '—'
             WHEN lr.rating - r90.rating_90d = 0 THEN '—'
             WHEN lr.rating - r90.rating_90d > 0 THEN '+' || ROUND((lr.rating - r90.rating_90d)::numeric, 2)::text
             ELSE ROUND((lr.rating - r90.rating_90d)::numeric, 2)::text END,
        COALESCE((lr.rating - r90.rating_90d) >= 0, true),
        0, 0, 0, COALESCE(lr.kingdom, ''), COALESCE(lr.club, ''), lr.rating
    FROM laurels_ranked lr
    LEFT JOIN _laurels_per_player lp ON lp.player_id = COALESCE(lr.user_id::text, lr.id::text)
    LEFT JOIN rating_90d_combined r90 ON r90.player_id = COALESCE(lr.user_id::text, lr.id::text)
    ORDER BY lr.rn;
END;
$$;

SELECT refresh_rankings();
