import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SIZES = [16, 32, 48, 128];
const SVG_PATH = path.resolve(process.cwd(), "public/icon.svg");
const OUTPUT_DIR = path.resolve(process.cwd(), "public/icons");

async function generate() {
  if (!fs.existsSync(SVG_PATH)) {
    throw new Error(`SVG source not found: ${SVG_PATH}`);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  for (const size of SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-${size}.png`));

    console.log(`Generated icon-${size}.png`);
  }
}

generate().catch(console.error);
