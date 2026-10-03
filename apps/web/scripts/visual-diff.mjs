// Image comparison for the visual preview, run inside a Playwright page so it needs no image
// library: the browser decodes the PNG screenshots, finds what changed, and draws the crops and
// overview as JPEG data URLs. Both functions are passed to page.evaluate, so they use nothing from
// outside their own bodies.

// Compares two screenshots row by row, like a text diff compares lines, so content that only moved
// (because something above it was added or removed) is not counted as changed.
//   page mode: close-ups of up to maxAreas changed areas, and an overview of the whole "after"
//     screenshot with every change boxed and numbered, at most overviewWidth × overviewHeight.
//   slide mode (slideWidth set): both whole images, scaled to slideWidth, with the changes boxed.
export async function compareImages({
  before, after, slideWidth = 0, overviewWidth = 880, overviewHeight = 800, context = 60, maxAreas = 3, maxCrop = 900,
}) {
  const NOTICEABLE = 24; // a color channel this far off is a visible difference
  const MIN_VISIBLE_PIXELS = 8; // fewer visibly different pixels than this is rendering noise
  const decode = async base64 => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context2d = canvas.getContext("2d");
    context2d.drawImage(bitmap, 0, 0);
    return { bitmap, width: bitmap.width, height: bitmap.height, pixels: context2d.getImageData(0, 0, bitmap.width, bitmap.height).data };
  };
  const [old, now] = await Promise.all([decode(before), decode(after)]);
  const width = Math.min(old.width, now.width);

  const rowHashes = image => {
    const hashes = new Uint32Array(image.height);
    for (let y = 0; y < image.height; y++) {
      let hash = 2166136261;
      for (let i = y * image.width * 4, end = i + width * 4; i < end; i++) {
        if ((i & 3) !== 3) hash = Math.imul(hash ^ image.pixels[i], 16777619);
      }
      hashes[y] = hash >>> 0;
    }
    return hashes;
  };

  // Myers' diff over rows; returns the changed stretches as [beforeStart, beforeEnd, afterStart, afterEnd].
  const diffRows = (a, b, limit = 2000) => {
    const n = a.length, m = b.length;
    if (!n || !m) return n || m ? [[0, n, 0, m]] : [];
    const max = n + m;
    const v = new Int32Array(2 * max + 3);
    const at = k => k + max + 1;
    const trace = [];
    let finished = -1;
    for (let d = 0; d <= Math.min(max, limit) && finished < 0; d++) {
      for (let k = -d; k <= d; k += 2) {
        let x = k === -d || (k !== d && v[at(k - 1)] < v[at(k + 1)]) ? v[at(k + 1)] : v[at(k - 1)] + 1;
        let y = x - k;
        while (x < n && y < m && a[x] === b[y]) { x++; y++; }
        v[at(k)] = x;
        if (x >= n && y >= m) { finished = d; break; }
      }
      trace.push(v.slice(at(-d), at(d) + 1)); // diagonals -d..d after step d
    }
    if (finished < 0) return [[0, n, 0, m]]; // too different to align: one changed stretch
    const runs = [];
    let x = n, y = m;
    for (let d = finished; d > 0; d--) {
      const previous = trace[d - 1]; // diagonals -(d-1)..(d-1)
      const value = k => previous[k + d - 1];
      const k = x - y;
      const down = k === -d || (k !== d && value(k - 1) < value(k + 1));
      const previousK = down ? k + 1 : k - 1;
      const previousX = value(previousK);
      const moveX = down ? previousX : previousX + 1; // where the diagonal run ending at (x, y) starts
      if (x > moveX) runs.push([moveX, x, moveX - k, y]);
      x = previousX;
      y = previousX - previousK;
    }
    if (x > 0) runs.push([0, x, 0, y]);
    runs.reverse();
    const stretches = [];
    let a0 = 0, b0 = 0;
    for (const [x0, x1, y0, y1] of runs) {
      if (x0 > a0 || y0 > b0) stretches.push([a0, x0, b0, y0]);
      a0 = x1; b0 = y1;
    }
    if (a0 < n || b0 < m) stretches.push([a0, n, b0, m]);
    return stretches;
  };

  const a = rowHashes(old), b = rowHashes(now);
  let top = 0;
  while (top < a.length && top < b.length && a[top] === b[top]) top++;
  let endA = a.length, endB = b.length;
  while (endA > top && endB > top && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  const stretches = diffRows(a.subarray(top, endA), b.subarray(top, endB))
    .map(([s0, s1, t0, t1]) => [s0 + top, s1 + top, t0 + top, t1 + top]);

  // Stretches less than 40 rows apart are one area.
  const areas = [];
  for (const s of stretches) {
    const last = areas.at(-1);
    if (last && s[0] - last.beforeEnd < 40 && s[2] - last.afterEnd < 40) {
      last.beforeEnd = s[1]; last.afterEnd = s[3];
    } else {
      areas.push({ beforeStart: s[0], beforeEnd: s[1], afterStart: s[2], afterEnd: s[3] });
    }
  }
  // Where an area changed in place (same height on both sides), narrow it to the changed columns,
  // and drop it if only a few pixels changed visibly: the browser can draw the edges of large text
  // and icons a little differently from one run to the next. Added or removed rows always count.
  for (const area of areas) {
    area.left = 0; area.right = width;
    const height = area.beforeEnd - area.beforeStart;
    if (!height || height !== area.afterEnd - area.afterStart) continue;
    let left = width, right = 0, visible = 0;
    for (let row = 0; row < height; row++) {
      const i = (area.beforeStart + row) * old.width * 4, j = (area.afterStart + row) * now.width * 4;
      for (let x = 0; x < width; x++) {
        const p = i + x * 4, q = j + x * 4;
        const change = Math.max(Math.abs(old.pixels[p] - now.pixels[q]), Math.abs(old.pixels[p + 1] - now.pixels[q + 1]),
          Math.abs(old.pixels[p + 2] - now.pixels[q + 2]));
        if (!change) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (change > NOTICEABLE) visible++;
      }
    }
    if (right >= left) { area.left = left; area.right = right + 1; }
    area.visible = visible;
  }
  const significant = areas.filter(area => area.visible === undefined || area.visible >= MIN_VISIBLE_PIXELS);
  areas.length = 0;
  areas.push(...significant);

  const red = "#e11d48";
  const jpeg = async canvas => {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let text = "";
    for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(text);
  };
  const box = (context2d, x, y, w, h, scale, lineWidth) => {
    context2d.strokeStyle = red;
    context2d.lineWidth = lineWidth;
    context2d.strokeRect(x * scale, y * scale, Math.max(w * scale, 2), Math.max(h * scale, 2));
  };

  if (slideWidth) {
    const render = async (image, start, end) => {
      const scale = slideWidth / image.width;
      const canvas = new OffscreenCanvas(slideWidth, Math.round(image.height * scale));
      const context2d = canvas.getContext("2d");
      context2d.drawImage(image.bitmap, 0, 0, canvas.width, canvas.height);
      for (const area of areas) {
        const y0 = area[start], y1 = Math.max(area[end], area[start] + 2);
        box(context2d, area.left - 4, y0 - 4, area.right - area.left + 8, y1 - y0 + 8, scale, 3);
      }
      return jpeg(canvas);
    };
    if (!areas.length) return { areaCount: 0 };
    return { areaCount: areas.length, before: await render(old, "beforeStart", "beforeEnd"), after: await render(now, "afterStart", "afterEnd") };
  }

  // A close-up of one area on one side, with the change outlined.
  const crop = async (image, area, start, end) => {
    const y0 = area[start], y1 = Math.max(area[end], y0 + 1);
    const top = Math.max(0, y0 - context);
    const bottom = Math.min(image.height, Math.min(y1 + context, top + maxCrop));
    let left = Math.max(0, area.left - context), right = Math.min(width, area.right + context);
    if (right - left < 480) { // keep enough around a small change to recognize it
      const middle = (left + right) / 2;
      left = Math.max(0, Math.min(width - 480, middle - 240));
      right = Math.min(width, left + 480);
    }
    const canvas = new OffscreenCanvas(right - left, bottom - top);
    const context2d = canvas.getContext("2d");
    context2d.drawImage(image.bitmap, left, top, right - left, bottom - top, 0, 0, right - left, bottom - top);
    box(context2d, area.left - left - 3, y0 - top - 3, area.right - area.left + 6, Math.min(y1, bottom) - y0 + 6, 1, 3);
    return { image: await jpeg(canvas), truncated: y1 + context > bottom && bottom < image.height };
  };
  // The rows above compare only the columns both screenshots have. A page that got wider or
  // narrower (say, something now sticks out past the side of the screen) changed even when those
  // columns did not; where it got wider, the new strip is boxed in the overview.
  const widthChange = old.width === now.width ? null : { before: old.width, after: now.width };
  let wider = null;
  if (now.width > old.width) {
    let first = -1, last = -1;
    for (let y = 0; y < now.height; y++) {
      const row = y * now.width * 4, edge = row + width * 4;
      for (let p = edge + 4; p < row + now.width * 4; p += 4) {
        if (now.pixels[p] === now.pixels[edge] && now.pixels[p + 1] === now.pixels[edge + 1] && now.pixels[p + 2] === now.pixels[edge + 2]) continue;
        if (first < 0) first = y;
        last = y;
        break;
      }
    }
    wider = first < 0 ? { top: 0, bottom: now.height } : { top: first, bottom: last + 1 }; // a blank strip still scrolls
  }
  if (!areas.length && !widthChange) return { areaCount: 0, closeUps: [] };
  const shown = areas.slice(0, maxAreas);
  const closeUps = [];
  for (const area of shown) {
    const [beforeCrop, afterCrop] = [await crop(old, area, "beforeStart", "beforeEnd"), await crop(now, area, "afterStart", "afterEnd")];
    closeUps.push({ before: beforeCrop.image, after: afterCrop.image, truncated: beforeCrop.truncated || afterCrop.truncated });
  }

  // The whole "after" page, small, with every change boxed and the close-ups numbered. A long page
  // is cut into columns set side by side, like a newspaper, so the overview stays short.
  const gap = 12;
  let columnWidth = Math.min(now.width, 400), columns, columnHeight;
  for (;; columnWidth -= 10) {
    const scaledHeight = now.height * columnWidth / now.width;
    columns = Math.ceil(scaledHeight / overviewHeight);
    columnHeight = Math.ceil(scaledHeight / columns);
    if (columns * columnWidth + (columns - 1) * gap <= overviewWidth || columnWidth <= 60) break;
  }
  const scale = columnWidth / now.width;
  const columnLeft = column => column * (columnWidth + gap);
  const canvas = new OffscreenCanvas(columnLeft(columns) - gap, columnHeight);
  const context2d = canvas.getContext("2d");
  context2d.fillStyle = "#cbd5e1";
  context2d.fillRect(0, 0, canvas.width, canvas.height);
  for (let column = 0; column < columns; column++) {
    const top = column * columnHeight / scale, height = Math.min(columnHeight / scale, now.height - top);
    context2d.drawImage(now.bitmap, 0, top, now.width, height, columnLeft(column), 0, columnWidth, height * scale);
  }
  const columnAt = y => Math.min(columns - 1, Math.max(0, Math.floor(y / columnHeight)));
  // Boxes a part of the page given in page pixels, numbered if it has a close-up.
  const outline = (left, right, top, bottom, number) => {
    // The box in overview pixels, as if the columns were one long strip, kept inside the page's sides.
    const x0 = Math.max(1.5, (left - 6) * scale), x1 = Math.min(columnWidth - 1.5, (right + 6) * scale);
    const y0 = (top - 6) * scale, y1 = Math.max(bottom + 6, top + 10) * scale;
    for (let column = columnAt(y0); column <= columnAt(y1); column++) { // each column the box falls in
      context2d.save();
      context2d.beginPath();
      context2d.rect(columnLeft(column), 0, columnWidth, columnHeight);
      context2d.clip();
      context2d.strokeStyle = red;
      context2d.lineWidth = 3;
      context2d.strokeRect(columnLeft(column) + x0, y0 - column * columnHeight, x1 - x0, y1 - y0);
      context2d.restore();
    }
    if (!number) return;
    const column = columnAt(y0);
    const x = columnLeft(column) + Math.min(Math.max(12, x0), columnWidth - 12);
    const y = Math.min(Math.max(12, y0 - column * columnHeight), columnHeight - 12);
    context2d.fillStyle = red;
    context2d.beginPath();
    context2d.arc(x, y, 11, 0, Math.PI * 2);
    context2d.fill();
    context2d.fillStyle = "#fff";
    context2d.font = "bold 14px sans-serif";
    context2d.textAlign = "center";
    context2d.textBaseline = "middle";
    context2d.fillText(String(number), x, y + 1);
  };
  areas.forEach((area, index) =>
    outline(area.left, area.right, area.afterStart, area.afterEnd, index < shown.length ? index + 1 : 0));
  if (wider) outline(width, now.width, wider.top, wider.bottom, 0);
  return { areaCount: areas.length, widthChange, closeUps, overview: await jpeg(canvas), columns };
}

// A screenshot scaled to the given width, as a JPEG (for slides added or removed).
export async function scaleImage({ image, width }) {
  const bytes = Uint8Array.from(atob(image), c => c.charCodeAt(0));
  const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
  const canvas = new OffscreenCanvas(width, Math.round(bitmap.height * width / bitmap.width));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
  const data = new Uint8Array(await blob.arrayBuffer());
  let text = "";
  for (let i = 0; i < data.length; i += 0x8000) text += String.fromCharCode(...data.subarray(i, i + 0x8000));
  return btoa(text);
}

// Joins screenshot strips (top to bottom) into one image, returned as a lossless PNG to compare and
// a JPEG to show. Chrome cannot capture a page taller than about 16,000 pixels in one screenshot
// (the bottom repeats earlier content), so tall pages are captured in strips.
export async function stitchStrips({ strips }) {
  const bitmaps = await Promise.all(strips.map(base64 => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return createImageBitmap(new Blob([bytes], { type: "image/png" }));
  }));
  const canvas = new OffscreenCanvas(bitmaps[0].width, bitmaps.reduce((sum, bitmap) => sum + bitmap.height, 0));
  const context2d = canvas.getContext("2d");
  let y = 0;
  for (const bitmap of bitmaps) {
    context2d.drawImage(bitmap, 0, y);
    y += bitmap.height;
  }
  const encode = async (type, quality) => {
    const bytes = new Uint8Array(await (await canvas.convertToBlob({ type, quality })).arrayBuffer());
    let text = "";
    for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(text);
  };
  return { png: await encode("image/png"), jpeg: await encode("image/jpeg", 0.8) };
}
