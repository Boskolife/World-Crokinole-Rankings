import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSV_PATH = join(
    __dirname,
    "..",
    "public",
    "Copy of Crokinole Rankings for Anton - Doubles.csv"
);

function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += c;
        }
    }
    result.push(current.trim());
    return result;
}

function parseDate(s) {
    const t = (s || "").trim();
    if (!t) return null;
    const parts = t.split("/");
    if (parts.length !== 3) return null;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) return null;
    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

function loadEnv() {
    try {
        const path = join(__dirname, "..", ".env.local");
        const content = readFileSync(path, "utf8");
        for (const line of content.split("\n")) {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
            if (m) {
                const value = m[2].replace(/^["']|["']$/g, "").trim();
                process.env[m[1]] = value;
            }
        }
    } catch (_) {}
}

async function main() {
    loadEnv();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.error(
            "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local"
        );
        process.exit(1);
    }

    const supabase = createClient(url, key);

    const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, player_identifier");
    if (playersError) {
        console.error("Failed to load players:", playersError.message);
        process.exit(1);
    }
    const idByIdentifier = new Map();
    for (const p of players || []) {
        const ident = p.player_identifier != null ? String(p.player_identifier).trim() : "";
        if (ident) idByIdentifier.set(ident, p.id);
    }
    console.log("Loaded", idByIdentifier.size, "players by player_identifier");

    const raw = readFileSync(CSV_PATH, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
    const header = parseCSVLine(lines[0]);
    const idx = (name) => header.indexOf(name);
    const getCell = (cells, i) => (cells[i] ?? "").trim();
    const getNum = (cells, i) => {
        const s = getCell(cells, i);
        if (!s) return null;
        const n = parseFloat(s);
        return Number.isNaN(n) ? null : n;
    };
    const getInt = (cells, i) => {
        const n = parseInt(getCell(cells, i), 10);
        return Number.isNaN(n) ? null : n;
    };

    const pointsWonCol1 = header.indexOf("Points Won");
    const pointsWonCol2 = header.indexOf("Points Won", pointsWonCol1 + 1);

    const rows = [];
    let skipped = 0;
    for (let i = 1; i < lines.length; i++) {
        const c = parseCSVLine(lines[i]);
        const p1IdRaw = getCell(c, idx("P1 ID"));
        const p2IdRaw = getCell(c, idx("P2 ID"));
        const p3IdRaw = getCell(c, idx("P3 ID"));
        const p4IdRaw = getCell(c, idx("P4 ID"));
        const player1Id = idByIdentifier.get(p1IdRaw);
        const player2Id = idByIdentifier.get(p2IdRaw);
        const player3Id = idByIdentifier.get(p3IdRaw);
        const player4Id = idByIdentifier.get(p4IdRaw);
        if (!player1Id || !player2Id || !player3Id || !player4Id) {
            skipped++;
            if (skipped <= 5) {
                console.warn(
                    "Skip row: missing player for P1=%s P2=%s P3=%s P4=%s",
                    p1IdRaw,
                    p2IdRaw,
                    p3IdRaw,
                    p4IdRaw
                );
            }
            continue;
        }
        const matchDate = parseDate(getCell(c, idx("Date")));
        if (!matchDate) {
            skipped++;
            continue;
        }
        const winner = getCell(c, idx("Winner"));
        const winnerNorm = winner === "T1" || winner === "T2" || winner === "TIE" ? winner : null;
        rows.push({
            match_number: getInt(c, idx("Match #")) ?? 0,
            match_date: matchDate,
            player1_id: player1Id,
            player2_id: player2Id,
            player3_id: player3Id,
            player4_id: player4Id,
            points_won_team1: getNum(c, pointsWonCol1) ?? 0,
            points_won_team2: getNum(c, pointsWonCol2) ?? 0,
            rounds: getNum(c, idx("Rounds")),
            winner: winnerNorm,
            p1_kscore: getInt(c, idx("P1 KScore")),
            p1_rating_old: getNum(c, idx("P1 Old")),
            p1_rating_change: getNum(c, idx("P1 Change")),
            p1_rating_new: getNum(c, idx("P1 New")),
            p2_kscore: getInt(c, idx("P2 KScore")),
            p2_rating_old: getNum(c, idx("P2 Old")),
            p2_rating_change: getNum(c, idx("P2 Change")),
            p2_rating_new: getNum(c, idx("P2 New")),
            p3_kscore: getInt(c, idx("P3 KScore")),
            p3_rating_old: getNum(c, idx("P3 Old")),
            p3_rating_change: getNum(c, idx("P3 Change")),
            p3_rating_new: getNum(c, idx("P3 New")),
            p4_kscore: getInt(c, idx("P4 KScore")),
            p4_rating_old: getNum(c, idx("P4 Old")),
            p4_rating_change: getNum(c, idx("P4 Change")),
            p4_rating_new: getNum(c, idx("P4 New")),
        });
    }
    if (skipped > 0) console.log("Skipped rows (player not found or invalid date):", skipped);

    const BATCH = 200;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const { error } = await supabase.from("doubles").insert(chunk);
        if (error) {
            console.error("Insert error:", error.message);
            process.exit(1);
        }
        inserted += chunk.length;
        console.log("Inserted", inserted, "/", rows.length);
    }
    console.log("Done. Total inserted:", inserted);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
