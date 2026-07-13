/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface CsvRecord {
  [key: string]: string;
}

interface CompanySeedRow extends Record<string, unknown> {
  name: string;
  domain: string;
  logo_domain: string | null;
  logo_background: string | null;
  hourly_pay: number | null;
  num_submits: number | null;
  housing_perk: string | null;
  signature_perk: string | null;
}

interface SeedOptions {
  csvPath: string;
  dryRun: boolean;
}

const DEFAULT_CSV_PATH = "data/internships.csv";
const BATCH_SIZE = 500;
const ENV_FILE_PATH = ".env.local";
const REMOVED_COMPANY_NAMES = [
  "Amazon (APP)",
  "AWS",
  "Cisco Meraki",
  "Citadel Securities",
  "Collins Aerospace",
  "SIG",
];

const COMPANY_OVERRIDES: Record<
  string,
  {
    domain?: string;
    logoDomain?: string;
    logoBackground?: "dark";
  }
> = {
  Anduril: {
    logoBackground: "dark",
  },
  "Balyasny Asset Management": {
    domain: "bamfunds.com",
  },
  "Cohere.ai": {
    domain: "cohere.com",
  },
  "Ernst & Young": {
    domain: "ey.com",
  },
  "Millennium Management": {
    domain: "mlp.com",
  },
  Tiktok: {
    domain: "tiktok.com",
  },
  "Verily Life Sciences": {
    domain: "verily.com",
  },
  "Voloridge Investment Managment": {
    domain: "voloridge.com",
  },
  "Walleye Capital": {
    domain: "walleyecapital.com",
  },
  "Walmart Global Tech": {
    domain: "walmart.com",
  },
  "X - The Moonshot Factory": {
    domain: "x.company",
  },
};

function loadLocalEnv() {
  if (!existsSync(ENV_FILE_PATH)) {
    return;
  }

  const lines = readFileSync(ENV_FILE_PATH, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

function parseSeedOptions(args: string[]): SeedOptions {
  const dryRun = args.includes("--dry-run");
  const csvPath =
    args.find((argument) => argument !== "--dry-run") ?? DEFAULT_CSV_PATH;

  return {
    csvPath,
    dryRun,
  };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(value);
      value = "";
      continue;
    }

    value += character;
  }

  values.push(value);

  return values;
}

function parseCsv(csv: string): CsvRecord[] {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const [headerLine, ...recordLines] = lines;

  if (!headerLine) {
    return [];
  }

  const headers = parseCsvLine(headerLine).map((header) => header.trim());

  return recordLines.map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvRecord>((record, header, index) => {
      record[header] = values[index]?.trim() ?? "";
      return record;
    }, {});
  });
}

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function normalizeNullableText(value: string | undefined): string | null {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

function parseNullableInteger(
  value: string | undefined,
  fieldName: string,
  companyName: string,
  rowNumber: number,
): number | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  if (!/^\d+$/.test(normalizedValue)) {
    throw new Error(
      `Invalid ${fieldName} for "${companyName}" in CSV row ${rowNumber}.`,
    );
  }

  return Number.parseInt(normalizedValue, 10);
}

function mapCsvRecordsToCompanies(records: CsvRecord[]): CompanySeedRow[] {
  return records.flatMap((record, index) => {
    const rowNumber = index + 2;
    const name = record.name?.trim();

    if (!name) {
      throw new Error(`Missing name in CSV row ${rowNumber}.`);
    }

    if (REMOVED_COMPANY_NAMES.includes(name)) {
      return [];
    }

    const override = COMPANY_OVERRIDES[name];
    const domain = normalizeDomain(override?.domain ?? record.domain ?? "");
    const logoDomain = override?.logoDomain
      ? normalizeDomain(override.logoDomain)
      : null;

    if (!domain) {
      throw new Error(
        `Missing domain for "${name}" in CSV row ${rowNumber}. ` +
          "Regenerate data/internships.csv with the domain column before seeding.",
      );
    }

    return [{
      name,
      domain,
      logo_domain: logoDomain,
      logo_background: override?.logoBackground ?? null,
      hourly_pay: parseNullableInteger(
        record.hourly_pay,
        "hourly_pay",
        name,
        rowNumber,
      ),
      num_submits: parseNullableInteger(
        record.num_submits,
        "num_submits",
        name,
        rowNumber,
      ),
      housing_perk: normalizeNullableText(record.housing_perk),
      signature_perk: normalizeNullableText(record.signature_perk),
    }];
  });
}

async function seedInternships() {
  loadLocalEnv();

  const { csvPath, dryRun } = parseSeedOptions(process.argv.slice(2));

  const csv = await readFile(csvPath, "utf8");
  const records = parseCsv(csv);
  const companies = mapCsvRecordsToCompanies(records);

  if (dryRun) {
    console.log(`Validated ${companies.length} companies from ${csvPath}.`);
    console.log(
      `Configured ${REMOVED_COMPANY_NAMES.length} companies for deletion from Supabase.`,
    );
    console.table(companies.slice(0, 5));
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: deleteError } = await supabase
    .from("companies")
    .delete()
    .in("name", REMOVED_COMPANY_NAMES);

  if (deleteError) {
    throw new Error(`Could not delete removed companies: ${deleteError.message}`);
  }

  for (let index = 0; index < companies.length; index += BATCH_SIZE) {
    const batch = companies.slice(index, index + BATCH_SIZE);
    const { error } = await supabase
      .from("companies")
      .upsert(batch, { onConflict: "name" });

    if (error) {
      throw new Error(`Could not seed companies: ${error.message}`);
    }
  }

  console.log(`Seeded ${companies.length} companies from ${csvPath}.`);
}

seedInternships().catch((error) => {
  console.error(error);
  process.exit(1);
});
