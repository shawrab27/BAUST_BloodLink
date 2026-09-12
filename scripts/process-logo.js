const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = 'C:\\Users\\nusha\\.gemini\\antigravity-ide\\brain\\80c5e317-1c77-4c1c-9615-45ffa162a885\\.user_uploaded\\media_1789218943710.jpg';

async function processLogo() {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`Image dimensions: ${width}x${height}, channels: ${channels}`);

  // Create RGBA buffer
  const rgbaBuffer = Buffer.alloc(width * height * 4);

  // We want to remove the checkerboard background.
  // The checkerboard consists of near-white (~255, 255, 255) and light-gray (~204, 204, 204 or ~220-240) pixels
  // where saturation is very low (R ~ G ~ B) and brightness is high.
  // The logo elements are:
  // - Dark Green gear & hands: (e.g. #005a36 / #004d2c)
  // - Red droplet: (e.g. #c0142b / #e11d48)
  // - Gold/yellow donor: (e.g. #e5a919)
  // - Green side donors: (e.g. #00874e)
  // - White heartbeat wave inside red drop
  // - White drop inside BloodLink 'o'
  // - Dark Green 'BAUST' & 'Link'
  // - Dark Red 'Blood'
  // - Dark Gray / Slate 'DONATE • CONNECT • SAVE LIVES' (e.g. #333333)

  // Let's use flood-fill or background mask from the corners / outer edges,
  // or chromatic analysis:
  // Background pixels are grayscale (abs(r-g)<15, abs(g-b)<15, abs(r-b)<15) and bright (r > 170, g > 170, b > 170).
  // Notice that white elements inside the logo (like heartbeat line) are surrounded by RED (#e11d48) or inside the gear,
  // whereas the background touches the borders.

  // Let's implement a BFS flood-fill from the 4 image borders to find all connected background pixels!
  const isBgCandidate = (x, y) => {
    const idx = (y * width + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check if it looks like the checkerboard (high brightness, low saturation)
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    const isGrayish = maxDiff < 22;
    const isBright = r > 165 && g > 165 && b > 165;
    
    return isGrayish && isBright;
  };

  const isBackground = new Uint8Array(width * height);
  const queue = [];

  // Seed with all border pixels that are bg candidates
  for (let x = 0; x < width; x++) {
    if (isBgCandidate(x, 0)) { isBackground[0 * width + x] = 1; queue.push([x, 0]); }
    if (isBgCandidate(x, height - 1)) { isBackground[(height - 1) * width + x] = 1; queue.push([x, height - 1]); }
  }
  for (let y = 0; y < height; y++) {
    if (isBgCandidate(0, y)) { isBackground[y * width + 0] = 1; queue.push([0, y]); }
    if (isBgCandidate(width - 1, y)) { isBackground[y * width + (width - 1)] = 1; queue.push([width - 1, y]); }
  }

  // Also seed any holes between gear teeth or arms that connect to the outside
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!isBackground[nIdx] && isBgCandidate(nx, ny)) {
          isBackground[nIdx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  // Also check any isolated enclosed background regions that are very clearly checkerboard
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!isBackground[idx]) {
        const r = data[idx * channels];
        const g = data[idx * channels + 1];
        const b = data[idx * channels + 2];
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        // If it's pure checkerboard gray/white (not white inside red drop)
        // Red drop is around center. If r, g, b are all > 210 and diff < 10, check if far from red
        if (maxDiff < 8 && r > 200 && g > 200 && b > 200) {
          // Check if it's inside the red droplet or heartline
          // Red drop has high R, low G & B
          // If all surrounding pixels are also grayish, it's background
        }
      }
    }
  }

  // Now construct RGBA buffer
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      const destIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      rgbaBuffer[destIdx] = r;
      rgbaBuffer[destIdx + 1] = g;
      rgbaBuffer[destIdx + 2] = b;

      if (isBackground[y * width + x] === 1) {
        // Transparent
        rgbaBuffer[destIdx + 3] = 0;
      } else {
        // Opaque
        rgbaBuffer[destIdx + 3] = 255;
      }
    }
  }

  // Smooth edges: anti-aliasing on alpha mask for pristine edges
  const antialiasedBuffer = Buffer.from(rgbaBuffer);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const destIdx = (y * width + x) * 4;
      if (rgbaBuffer[destIdx + 3] > 0) {
        // Check if adjacent to a transparent pixel
        let bgCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (rgbaBuffer[((y + dy) * width + (x + dx)) * 4 + 3] === 0) {
              bgCount++;
            }
          }
        }
        if (bgCount > 0) {
          const r = rgbaBuffer[destIdx];
          const g = rgbaBuffer[destIdx + 1];
          const b = rgbaBuffer[destIdx + 2];
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
          if (maxDiff < 25 && (r + g + b) / 3 > 180) {
            antialiasedBuffer[destIdx + 3] = Math.max(0, Math.floor(255 * (1 - bgCount / 9)));
          }
        }
      }
    }
  }

  const outputFiles = [
    'd:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\official-logo.png',
    'd:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\new-logo.png',
    'd:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\logo.png',
  ];

  for (const outPath of outputFiles) {
    await sharp(antialiasedBuffer, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
    .png()
    .toFile(outPath);
    console.log(`Saved: ${outPath}`);
  }

  // Also create a tightly cropped emblem-only version for small icon contexts
  // and full emblem+wordmark
  console.log('Finished logo background removal!');
}

processLogo().catch(console.error);
