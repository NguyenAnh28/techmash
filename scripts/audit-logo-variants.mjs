const DEFAULT_SLUGS = [
  "google",
  "apple",
  "microsoft",
  "meta",
  "netflix",
  "stripe",
  "openai",
  "spacex",
  "nvidia",
  "vercel",
  "airbnb",
  "uber",
];

const slugs = process.argv.slice(2);
const slugsToAudit = slugs.length > 0 ? slugs : DEFAULT_SLUGS;

function parseHexColor(value) {
  const normalized = value.trim().toLowerCase();

  if (!normalized.startsWith("#")) {
    return null;
  }

  const hex = normalized.slice(1);

  if (hex.length === 3 || hex.length === 4) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  return null;
}

function isWhiteishColor(value) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "white") {
    return true;
  }

  const rgb = parseHexColor(normalized);

  if (!rgb) {
    return false;
  }

  return rgb.r >= 245 && rgb.g >= 245 && rgb.b >= 245;
}

function extractPaintValues(svg) {
  const values = new Set();
  const patterns = [
    /(?:fill|stroke|color)=["']([^"']+)["']/gi,
    /(?:fill|stroke|color):\s*([^;"'}]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(svg))) {
      const value = match[1].trim().toLowerCase();

      if (
        value &&
        value !== "none" &&
        value !== "transparent" &&
        value !== "inherit" &&
        value !== "currentcolor"
      ) {
        values.add(value);
      }
    }
  }

  return [...values];
}

async function fetchSvg(slug, variant) {
  const url = `https://thesvg.org/icons/${slug}/${variant}.svg`;
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  return response.text();
}

for (const slug of slugsToAudit) {
  const defaultSvg = await fetchSvg(slug, "default");
  const lightSvg = await fetchSvg(slug, "light");

  if (!defaultSvg) {
    console.log(`${slug}: missing default asset`);
    continue;
  }

  const defaultPaintValues = extractPaintValues(defaultSvg);
  const lightPaintValues = lightSvg ? extractPaintValues(lightSvg) : [];
  const defaultHasWhite = defaultPaintValues.some(isWhiteishColor);
  const lightHasWhite = lightPaintValues.some(isWhiteishColor);
  const recommendedVariant =
    defaultHasWhite && lightSvg && !lightHasWhite ? "light" : "default";

  console.log(
    `${slug}: ${recommendedVariant} ` +
      `(default paints: ${defaultPaintValues.join(", ") || "implicit black"})`,
  );
}
