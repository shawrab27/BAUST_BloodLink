const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = 'C:\\Users\\nusha\\.gemini\\antigravity-ide\\brain\\80c5e317-1c77-4c1c-9615-45ffa162a885\\.user_uploaded\\media_1789218943710.jpg';

async function cleanLogo() {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const rgba = Buffer.alloc(width * height * 4);

  // Identify connected background via BFS flood fill from edges + thresholding
  // 1. Mark candidate background pixels (neutral gray/white squares from checkerboard)
  const isBgCandidate = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const src = idx * channels;
      const r = data[src];
      const g = data[src + 1];
      const b = data[src + 2];

      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      const avg = (r + g + b) / 3;

      // The subtitle "DONATE • CONNECT • SAVE LIVES" is dark gray (avg ~50-100), NOT background!
      // Checkerboard is light gray/white: avg >= 170 and maxDiff <= 28
      if (avg >= 170 && maxDiff <= 28) {
        // Exclude internal white elements:
        // 1. ECG heartbeat inside red drop: roughly (y: 350-540, x: 380-644)
        const isHeartbeat = (y >= 350 && y <= 540 && x >= 380 && x <= 644);
        // 2. Lotus flower in crest: roughly (y: 110-150, x: 480-545)
        const isLotus = (y >= 110 && y <= 150 && x >= 480 && x <= 545);
        // 3. Drop in 'Blood': roughly (y: 755-815, x: 325-358)
        const isDropHole = (y >= 755 && y <= 815 && x >= 325 && x <= 358);
        // 4. White reflection / highlight on left side of red drop
        const isHighlight = (y >= 300 && y <= 450 && x >= 415 && x <= 470);

        if (!isHeartbeat && !isLotus && !isDropHole && !isHighlight) {
          isBgCandidate[idx] = 1;
        }
      }
    }
  }

  // 2. Flood fill from outer borders to only remove connected background and avoid accidental holes
  const isBg = new Uint8Array(width * height);
  const queue = [];

  // Seed borders
  for (let x = 0; x < width; x++) {
    if (isBgCandidate[x]) { isBg[x] = 1; queue.push(x); }
    const bottomIdx = (height - 1) * width + x;
    if (isBgCandidate[bottomIdx]) { isBg[bottomIdx] = 1; queue.push(bottomIdx); }
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    if (isBgCandidate[leftIdx] && !isBg[leftIdx]) { isBg[leftIdx] = 1; queue.push(leftIdx); }
    const rightIdx = y * width + (width - 1);
    if (isBgCandidate[rightIdx] && !isBg[rightIdx]) { isBg[rightIdx] = 1; queue.push(rightIdx); }
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      curr - 1, curr + 1, curr - width, curr + width,
      curr - width - 1, curr - width + 1, curr + width - 1, curr + width + 1
    ];

    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i];
      const nx = n % width;
      const ny = Math.floor(n / width);

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!isBg[n] && isBgCandidate[n]) {
          isBg[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  // Also check isolated pockets between gear teeth or letter gaps (like inside the gear teeth or between hands and gear)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      // If it's a strong checkerboard square candidate in the upper half or around text
      if (isBgCandidate[idx] && !isBg[idx]) {
        // If not in logo protected areas, consider it background
        isBg[idx] = 1;
      }
    }
  }

  // Build final RGBA buffer with soft edge blending for anti-aliasing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const src = idx * channels;
      const dst = idx * 4;

      const r = data[src];
      const g = data[src + 1];
      const b = data[src + 2];

      rgba[dst] = r;
      rgba[dst + 1] = g;
      rgba[dst + 2] = b;

      if (isBg[idx]) {
        rgba[dst + 3] = 0; // Fully transparent
      } else {
        // Check if on boundary for smooth anti-aliasing
        let bgNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (isBg[ny * width + nx]) bgNeighbors++;
            }
          }
        }
        if (bgNeighbors > 4) {
          // Edge pixel
          rgba[dst + 3] = Math.round(255 * (1 - (bgNeighbors / 9) * 0.4));
        } else {
          rgba[dst + 3] = 255;
        }
      }
    }
  }

  // Generate trimmed high-res transparent PNG
  const trimmed = await sharp(rgba, {
    raw: { width, height, channels: 4 }
  })
  .trim()
  .png()
  .toBuffer();

  const outputFiles = [
    'd:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\official-logo.png',
    'd:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\new-logo.png',
    'd:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\logo.png',
    'd:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\logo-emblem.png',
  ];

  for (const file of outputFiles) {
    fs.writeFileSync(file, trimmed);
    console.log(`Saved transparent logo: ${file}`);
  }

  // Create isolated emblem (just the top emblem without text) for avatars
  const emblemData = await sharp(trimmed)
    .extract({ left: 50, top: 0, width: 586, height: 530 })
    .trim()
    .png()
    .toBuffer();

  fs.writeFileSync('d:\\Study\\3.1\\SWE\\BloodLink\\client\\public\\emblem.png', emblemData);
  console.log('Saved emblem.png successfully');
}

cleanLogo().catch(console.error);


