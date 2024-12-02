const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const iconColor = '#8B5CF6'; // Purple color

async function generateIcons() {
  const iconsDir = path.join(__dirname, '../src/icons');
  
  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Create SVG icon
  const svg = `
    <svg width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="24" fill="${iconColor}"/>
      <path d="M64 32C45.2 32 30 47.2 30 66C30 84.8 45.2 100 64 100C82.8 100 98 84.8 98 66C98 47.2 82.8 32 64 32Z" fill="white"/>
    </svg>
  `;

  // Generate icons for each size
  for (const size of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon${size}.png`));
  }
}

generateIcons().catch(console.error); 