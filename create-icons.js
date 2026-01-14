#!/usr/bin/env node

/**
 * Generate simple PNG icons for the Chrome extension
 */

const fs = require('fs');
const { PNG } = require('pngjs');

/**
 * Create a simple icon with gradient background and play button
 */
function createIcon(size) {
  const png = new PNG({ width: size, height: size });

  // Draw each pixel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Calculate distance from center
      const dx = x - size / 2;
      const dy = y - size / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Create circular background with gradient
      if (distance < size * 0.47) {
        // Gradient from #667eea to #764ba2
        const t = (x + y) / (size * 2);
        const r = Math.floor(102 + (118 - 102) * t);
        const g = Math.floor(126 + (75 - 126) * t);
        const b = Math.floor(234 + (162 - 234) * t);

        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;

        // Draw play button (white triangle)
        const playScale = size / 128;
        const inPlayButton = isInTriangle(
          x, y,
          45 * playScale, 35 * playScale,
          45 * playScale, 93 * playScale,
          90 * playScale, 64 * playScale
        );

        if (inPlayButton) {
          png.data[idx] = 255;
          png.data[idx + 1] = 255;
          png.data[idx + 2] = 255;
          png.data[idx + 3] = 242;
        }

        // Draw HD badge for larger sizes
        if (size >= 48) {
          const badgeScale = size / 128;
          const badgeX = 72 * badgeScale;
          const badgeY = 78 * badgeScale;
          const badgeW = 40 * badgeScale;
          const badgeH = 18 * badgeScale;

          if (x >= badgeX && x < badgeX + badgeW &&
              y >= badgeY && y < badgeY + badgeH) {
            // White badge background
            png.data[idx] = 255;
            png.data[idx + 1] = 255;
            png.data[idx + 2] = 255;
            png.data[idx + 3] = 242;

            // Simple "HD" text (very basic)
            const textX = x - badgeX - badgeW / 4;
            const textY = y - badgeY - badgeH / 3;

            if ((textX >= 2 && textX <= 4 && textY >= 2 && textY <= 10) || // H left
                (textX >= 8 && textX <= 10 && textY >= 2 && textY <= 10) || // H right
                (textX >= 2 && textX <= 10 && textY >= 5 && textY <= 7) || // H middle
                (textX >= 14 && textX <= 22 && textY >= 2 && textY <= 4) || // D top
                (textX >= 14 && textX <= 22 && textY >= 8 && textY <= 10) || // D bottom
                (textX >= 14 && textX <= 16 && textY >= 2 && textY <= 10) || // D left
                (textX >= 20 && textX <= 22 && textY >= 4 && textY <= 8)) { // D right curve
              png.data[idx] = r;
              png.data[idx + 1] = g;
              png.data[idx + 2] = b;
              png.data[idx + 3] = 255;
            }
          }
        }

        // Draw quality bars for larger sizes
        if (size >= 48) {
          const barScale = size / 128;
          const bars = [
            { x: 18, y: 100, h: 12 },
            { x: 30, y: 95, h: 17 },
            { x: 42, y: 88, h: 24 },
            { x: 54, y: 82, h: 30 }
          ];

          bars.forEach((bar, i) => {
            const barX = bar.x * barScale;
            const barY = bar.y * barScale;
            const barW = 8 * barScale;
            const barH = bar.h * barScale;

            if (x >= barX && x < barX + barW &&
                y >= barY && y < barY + barH) {
              const alpha = i === 3 ? 255 : 230;
              png.data[idx] = 255;
              png.data[idx + 1] = 255;
              png.data[idx + 2] = 255;
              png.data[idx + 3] = alpha;
            }
          });
        }
      } else {
        // Transparent outside the circle
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }

  return png;
}

/**
 * Check if point is inside a triangle
 */
function isInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const areaOrig = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
  const area1 = Math.abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py));
  const area2 = Math.abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py));
  const area3 = Math.abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py));

  return Math.abs(areaOrig - (area1 + area2 + area3)) < 1;
}

// Generate icons
const sizes = [16, 48, 128];

console.log('Generating PNG icons...');

sizes.forEach(size => {
  const png = createIcon(size);
  const filename = `icons/icon${size}.png`;

  png.pack().pipe(fs.createWriteStream(filename))
    .on('finish', () => {
      console.log(`✓ Generated ${filename}`);
    })
    .on('error', (err) => {
      console.error(`✗ Failed to generate ${filename}:`, err.message);
    });
});

console.log('Generating icons...');
