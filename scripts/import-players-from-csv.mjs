import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CSV_PATH = join(
    __dirname,
    "..",
    "public",
    "Copy of Crokinole Rankings for Anton - Players.csv"
);

const KINGDOM_TO_COUNTRY = {
    Canada: "ca",
    England: "gb",
    Hungary: "hu",
    France: "fr",
    Germany: "de",
    Belgium: "be",
    Netherlands: "nl",
    Wales: "gb",
    Scotland: "gb",
    "South Carolina": "us",
    Pennsylvania: "us",
    Ohio: "us",
    Illinois: "us",
    Texas: "us",
    "New York": "us",
    Florida: "us",
    Michigan: "us",
    Georgia: "us",
    Virginia: "us",
    "North Carolina": "us",
    Wisconsin: "us",
    Minnesota: "us",
    Maryland: "us",
    Massachusetts: "us",
    Indiana: "us",
    Missouri: "us",
    Tennessee: "us",
    Colorado: "us",
    Arizona: "us",
    Washington: "us",
    California: "us",
    Oregon: "us",
    Connecticut: "us",
    "New Jersey": "us",
};

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
    const raw = readFileSync(CSV_PATH, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
    const header = parseCSVLine(lines[0]);
    const idx = (name) => header.indexOf(name);
    const firstWinPct = header.indexOf("Win Percentage");
    const secondWinPct = header.indexOf("Win Percentage", firstWinPct + 1);
    const thirdWinPct = header.indexOf("Win Percentage", secondWinPct + 1);
    const help1 = header.indexOf("Helping Column");
    const help2 = header.indexOf("Helping Column", help1 + 1);
    const help3 = header.indexOf("Helping Column", help2 + 1);

    const getCell = (cells, i) => (cells[i] ?? "").trim();
    const getInt = (cells, i) => {
        const n = parseInt(cells[i], 10);
        return Number.isNaN(n) ? null : n;
    };

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const c = parseCSVLine(lines[i]);
        const playerName = getCell(c, idx("Player Name"));
        if (!playerName) continue;

        const kingdom = getCell(c, idx("Kingdom"));
        const club = getCell(c, idx("Club"));
        const combinedRating = getInt(c, idx("Combined Rating")) ?? 1500;
        const countryCode = (kingdom && KINGDOM_TO_COUNTRY[kingdom]) || "";

        rows.push({
            name: playerName,
            country_code: countryCode || "",
            kingdom: kingdom || "",
            club: club || "",
            rating: combinedRating,
            user_id: null,
            player_name: playerName,
            gender: getCell(c, idx("Gender")) || "",
            player_identifier: getCell(c, idx("Player Identifier")) || "",
            title: getCell(c, idx("Title")) || "",
            club_title: getCell(c, idx("Club Title")) || "",
            singles_rating: getInt(c, idx("Singles Rating")),
            doubles_rating: getInt(c, idx("Doubles Rating")),
            combined_rating: getInt(c, idx("Combined Rating")),
            singles_won: getInt(c, idx("Singles Won")),
            singles_played: getInt(c, idx("Singles Played")),
            win_pct_singles: getCell(c, firstWinPct) || "",
            doubles_won: getInt(c, idx("Doubles Won")),
            doubles_played: getInt(c, idx("Doubles Played")),
            win_pct_doubles: getCell(c, secondWinPct) || "",
            total_won: getInt(c, idx("Total Won")),
            total_played: getInt(c, idx("Total Played")),
            win_pct_total: getCell(c, thirdWinPct) || "",
            helping_column_1: getCell(c, help1) || "",
            helping_column_2: getCell(c, help2) || "",
            helping_column_3: getCell(c, help3) || "",
            helping_array: getCell(c, idx("Helping Array")) || "",
            full_name_with_titles: getCell(c, idx("Full Name with Titles")) || "",
        });
    }

    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const { data, error } = await supabase
            .from("players")
            .insert(chunk)
            .select("id");

        if (error) {
            console.error("Insert error:", error.message);
            process.exit(1);
        }
        inserted += data?.length ?? 0;
        console.log(`Inserted ${inserted} / ${rows.length}`);
    }
    console.log("Done. Total inserted:", inserted);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
