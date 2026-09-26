import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const FILE_KEY = process.env.FIGMA_FILE_KEY;
const ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const VARIABLES_SCSS_PATH = path.resolve('src/styles/variables.scss');

if (!FILE_KEY || !ACCESS_TOKEN) {
  console.error('Error: FIGMA_FILE_KEY and FIGMA_ACCESS_TOKEN must be set in environment (.env).');
  process.exit(1);
}

function toHex(c) {
  const hex = Math.round(c * 255).toString(16).padStart(2, '0');
  return hex;
}

function rgbToHex(r, g, b) {
  const full = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
  if (/^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/.test(full)) {
    return `#${full[1]}${full[3]}${full[5]}`;
  }
  return full;
}

async function fetchFigma(url) {
  const res = await fetch(url, {
    headers: {
      'X-Figma-Token': ACCESS_TOKEN,
    },
  });
  if (!res.ok) {
    throw new Error(`Figma API returned ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

async function findTokensFrame() {
  console.log(`🔍 Inspecting Figma file: ${FILE_KEY}...`);
  const fileData = await fetchFigma(`https://api.figma.com/v1/files/${FILE_KEY}?depth=2`);

  // Search for a frame named "Design Tokens" on any page
  for (const page of fileData.document.children) {
    if (page.children) {
      const match = page.children.find((child) => child.name === 'Design Tokens');
      if (match) {
        return match.id;
      }
    }
  }

  // Default fallback if known
  return '11:2';
}

async function main() {
  const nodeId = await findTokensFrame();
  console.log(`📦 Found "Design Tokens" frame with ID: ${nodeId}`);

  const nodeData = await fetchFigma(
    `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(nodeId)}`
  );

  const tokensFrame = nodeData.nodes[nodeId]?.document;
  if (!tokensFrame) {
    throw new Error(`Could not find frame node with ID ${nodeId}`);
  }

  const extractedTokens = [];

  for (const child of tokensFrame.children || []) {
    if (child.name.startsWith('--')) {
      const rect = child.children?.find((c) => c.type === 'RECTANGLE');
      const solidFill = rect?.fills?.find((f) => f.type === 'SOLID' && f.visible !== false);

      if (solidFill?.color) {
        const { r, g, b } = solidFill.color;
        const hex = rgbToHex(r, g, b);
        extractedTokens.push({ name: child.name, hex });
      }
    }
  }

  console.log(`🎨 Extracted ${extractedTokens.length} tokens from Figma:`);
  for (const t of extractedTokens) {
    console.log(`   ${t.name}: ${t.hex}`);
  }

  if (extractedTokens.length === 0) {
    console.warn('⚠️ No tokens starting with "--" found in Design Tokens frame.');
    return;
  }

  // Update src/styles/variables.scss
  const tokenLines = extractedTokens.map((t) => `  ${t.name}: ${t.hex};`).join('\n');

  const updatedScss = `:root {
  /* Colors synchronized from Figma (Design Tokens) */
${tokenLines}

  /* Layout & Typography */
  --max-width: 1200px;
  --gap: 1.5rem;
  --radius: 0.5rem;
  --font-heading: 'Space Grotesk', 'Noto Sans JP', sans-serif;
  --font-sans: 'Plus Jakarta Sans', 'Noto Sans JP', sans-serif;
}
`;

  await fs.writeFile(VARIABLES_SCSS_PATH, updatedScss, 'utf-8');
  console.log(`✅ Successfully updated ${VARIABLES_SCSS_PATH}`);
}

main().catch((err) => {
  console.error('❌ Error synchronizing tokens:', err);
  process.exit(1);
});
