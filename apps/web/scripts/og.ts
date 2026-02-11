#!/usr/bin/env node

/**
 * Generate static OG image (1200x630) for social sharing previews.
 *
 * Usage: pnpm og (from apps/web)
 * Output: public/og.png
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const WIDTH = 1200;
const HEIGHT = 630;
const OUT_PATH = join(import.meta.dirname, "../public/og.png");

async function fetchFont(weight: 400 | 700): Promise<ArrayBuffer> {
  // Google Fonts API: use old User-Agent to get TTF (satori doesn't support woff2)
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0)" } }
  ).then((r) => r.text());

  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match?.[1]) throw new Error(`Font weight ${weight} URL not found`);

  return fetch(match[1]).then((r) => r.arrayBuffer());
}

async function main() {
  console.log("Fetching fonts...");
  const [regular, bold] = await Promise.all([fetchFont(400), fetchFont(700)]);

  console.log("Rendering OG image...");
  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 100px",
          backgroundColor: "#ffffff",
          fontFamily: "Inter",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontSize: 28,
                fontWeight: 700,
                color: "#171717",
                letterSpacing: "-0.02em",
                marginBottom: 48,
              },
              children: "P",
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: 64,
                fontWeight: 700,
                color: "#171717",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              },
              children: "Patrick Schwagler",
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: 28,
                fontWeight: 400,
                color: "#737373",
                marginTop: 20,
              },
              children: "Forward Deployed Software Engineer",
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const png = resvg.render().asPng();

  writeFileSync(OUT_PATH, png);
  console.log(
    `Done! Wrote ${(png.length / 1024).toFixed(1)}KB to public/og.png`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
