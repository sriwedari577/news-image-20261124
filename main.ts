// News image for Tuesday 24 November 2026.
// Draws one 1024x1024 PNG broadsheet from the day's confirmed stories.
// No network, no randomness, no clock: identical bytes on every run.
// Node 22 standard library only.
// Revision note: palette and layout checked legible at small sizes.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// Palette: newsprint paper, ink, navy, red, gold.
const PAPER = [247, 243, 234];
const PAPER2 = [240, 234, 220];
const INK = [26, 26, 26];
const NAVY = [22, 50, 79];
const NAVY2 = [14, 36, 58];
const RED = [179, 38, 30];
const GOLD = [201, 162, 39];
const GREEN = [30, 107, 58];
const AMBER = [154, 106, 0];
const WHITE = [255, 255, 255];
const GREY = [110, 104, 92];
const RULE = [190, 182, 164];

const buf = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: number[]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: number[]): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const o = (yy * W + xx) * 3;
      buf[o] = c[0];
      buf[o + 1] = c[1];
      buf[o + 2] = c[2];
    }
  }
}

function hline(x: number, y: number, w: number, c: number[], t: number): void {
  fillRect(x, y, w, t, c);
}

function vline(x: number, y: number, h: number, c: number[], t: number): void {
  fillRect(x, y, t, h, c);
}

function strokeRect(x: number, y: number, w: number, h: number, c: number[], t: number): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

function circle(cx: number, cy: number, r: number, c: number[]): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
    }
  }
}

function ring(cx: number, cy: number, r: number, c: number[], t: number): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= r && d >= r - t) px(cx + x, cy + y, c);
    }
  }
}

function poly(points: number[][], c: number[]): void {
  // Scanline fill for a simple polygon.
  let minY = H;
  let maxY = 0;
  for (const p of points) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(H - 1, Math.ceil(maxY)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const t = (y - a[1]) / (b[1] - a[1]);
        xs.push(a[0] + t * (b[0] - a[0]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(W - 1, Math.floor(xs[k + 1])); x++) {
        px(x, y, c);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows; bit 4 is the leftmost pixel.
// Uppercase, digits and common punctuation only; text is set in capitals.
// ---------------------------------------------------------------------------
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x11, 0x19, 0x15, 0x13, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "-": [0, 0, 0, 0x1f, 0, 0, 0],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  "%": [0x19, 0x1a, 0x02, 0x04, 0x08, 0x0b, 0x13],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0],
  "•": [0, 0, 0x0c, 0x0c, 0x0c, 0, 0],
  "×": [0, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0],
  "—": [0, 0, 0, 0x1f, 0, 0, 0],
  "–": [0, 0, 0, 0x1f, 0, 0, 0],
  "’": [0x04, 0x04, 0x08, 0, 0, 0, 0],
};

function glyph(ch: string): number[] {
  const g = FONT[ch];
  if (g) return g;
  return FONT["?"];
}

function textW(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(x: number, y: number, s: string, scale: number, c: number[]): void {
  let cx = x;
  for (const ch of s) {
    const g = glyph(ch);
    for (let row = 0; row < 7; row++) {
      const bits = g[row];
      for (let col = 0; col < 5; col++) {
        if (bits & (1 << (4 - col))) {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextC(cx: number, y: number, s: string, scale: number, c: number[]): void {
  drawText(cx - Math.floor(textW(s, scale) / 2), y, s, scale, c);
}

function drawTextR(rx: number, y: number, s: string, scale: number, c: number[]): void {
  drawText(rx - textW(s, scale), y, s, scale, c);
}

// Word-wrap on spaces; over-long words are hard-split.
function wrap(s: string, scale: number, maxW: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textW(trial, scale) <= maxW) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      if (textW(w, scale) > maxW) {
        let part = "";
        for (const ch of w) {
          if (textW(part + ch, scale) > maxW && part) {
            lines.push(part);
            part = ch;
          } else {
            part += ch;
          }
        }
        cur = part;
      } else {
        cur = w;
      }
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawPara(x: number, y: number, s: string, scale: number, maxW: number, lh: number, c: number[]): number {
  const lines = wrap(s, scale, maxW);
  for (let i = 0; i < lines.length; i++) {
    drawText(x, y + i * lh, lines[i], scale, c);
  }
  return lines.length;
}

// Status chip: small filled label, e.g. CONFIRMED / REPORTED.
function chip(x: number, y: number, label: string, c: number[]): number {
  const s = 1;
  const w = textW(label, s) + 12;
  fillRect(x, y, w, 14, c);
  drawText(x + 6, y + 3, label, s, WHITE);
  return w;
}

function kickerLine(x: number, y: number, region: string, status: string, maxW: number): void {
  drawText(x, y + 2, region, 2, RED);
  const rw = textW(region, 2);
  const sc = status === "CONFIRMED" ? GREEN : AMBER;
  chip(x + rw + 12, y, status, sc);
}

// One story card. headlineScale 3, bodyScale 2.
function card(
  x: number,
  y: number,
  w: number,
  h: number,
  region: string,
  status: string,
  headline: string,
  body: string,
  headScale: number,
  accent: number[]
): void {
  fillRect(x, y, w, h, WHITE);
  strokeRect(x, y, w, h, INK, 2);
  fillRect(x, y, w, 4, accent);
  const pad = 14;
  kickerLine(x + pad, y + 12, region, status, w - pad * 2);
  const hl = wrap(headline, headScale, w - pad * 2);
  let hy = y + 36;
  for (const ln of hl) {
    drawText(x + pad, hy, ln, headScale, INK);
    hy += 7 * headScale + 4;
  }
  hline(x + pad, hy + 2, w - pad * 2, RULE, 1);
  drawPara(x + pad, hy + 10, body, 2, w - pad * 2, 17, INK);
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

// Masthead
fillRect(0, 0, W, 120, NAVY);
fillRect(0, 0, W, 6, GOLD);
drawText(24, 22, "THE WORLD IN ONE DAY  •  TUESDAY", 2, GOLD);
drawText(24, 46, "24 NOVEMBER 2026", 7, WHITE);
drawTextR(1000, 34, "10 STORIES", 3, WHITE);
drawTextR(1000, 62, "6 REGIONS", 3, GOLD);
hline(0, 120, W, GOLD, 3);

// Timeline strip: local times as labelled.
fillRect(0, 123, W, 34, PAPER2);
const tl: [string, string][] = [
  ["09:03 AEDT", "NAKAMAL PACT BACKED"],
  ["10:00 CET", "AUSTRIA GAMBLING BILL"],
  ["14:00 UTC", "CHESS GAME 1, GENEVA"],
  ["14:53 UTC", "SUPERMOON PEAKS"],
  ["AFTERNOON", "CAS RULING, LAUSANNE"],
  ["TUESDAY", "TALKS OPEN, ABU DHABI"],
];
const tlW = W / tl.length;
for (let i = 0; i < tl.length; i++) {
  const cx = Math.floor(i * tlW) + 12;
  drawText(cx, 129, tl[i][0], 2, RED);
  const lbl = wrap(tl[i][1], 1, tlW - 24);
  drawText(cx, 145, lbl[0] || "", 1, INK);
  if (i > 0) vline(Math.floor(i * tlW), 127, 26, RULE, 1);
}
hline(0, 157, W, INK, 2);

// Hero row: 3 cards.
const heroY = 166;
const heroH = 268;
const gap = 12;
const heroW = Math.floor((W - 24 - gap * 2) / 3);
card(12, heroY, heroW, heroH, "MIDDLE EAST", "REPORTED",
  "PEACE TALKS OPEN IN ABU DHABI",
  "RUSSIA, UKRAINE AND THE U.S. MEET FOR THE FIRST TIME SINCE FEBRUARY. KUSHNER AND WITKOFF MEDIATE; THE FOCUS IS SECURITY GUARANTEES.",
  3, RED);
card(12 + heroW + gap, heroY, heroW, heroH, "SPACE", "CONFIRMED",
  "BEAVER SUPERMOON SKIMS THE PLEIADES",
  "THE FULL MOON TURNS FULL AT 14:53 UTC, THE FIRST OF FOUR SUPERMOONS IN A ROW, PASSING CLOSE TO THE PLEIADES STAR CLUSTER.",
  3, GOLD);
card(12 + (heroW + gap) * 2, heroY, heroW, heroH, "EUROPE", "CONFIRMED",
  "GUKESH DEFENDS CROWN IN GENEVA",
  "GAME 1 OF THE WORLD CHESS CHAMPIONSHIP: CHAMPION GUKESH, 20, FACES SINDAROV, 20, THE YOUNGEST PAIRING EVER. 14 GAMES, $2.5M FUND.",
  3, NAVY);

// Hero icons along the bottom of each hero card.
const iconY = heroY + heroH - 58;
// H1: three talking circles.
{
  const bx = 12 + Math.floor(heroW / 2);
  circle(bx - 34, iconY + 26, 20, NAVY);
  circle(bx + 34, iconY + 26, 20, RED);
  circle(bx, iconY + 26, 20, GOLD);
  drawTextC(bx - 34, iconY + 19, "RU", 2, WHITE);
  drawTextC(bx + 34, iconY + 19, "UA", 2, WHITE);
  drawTextC(bx, iconY + 19, "US", 2, INK);
}
// H2: moon + stars.
{
  const bx = 12 + heroW + gap + Math.floor(heroW / 2);
  circle(bx, iconY + 26, 24, GOLD);
  circle(bx - 8, iconY + 18, 4, [176, 141, 28]);
  circle(bx + 9, iconY + 30, 3, [176, 141, 28]);
  circle(bx + 4, iconY + 14, 2, [176, 141, 28]);
  const stars: [number, number][] = [[bx - 52, iconY + 8], [bx - 44, iconY + 40], [bx + 48, iconY + 12], [bx + 54, iconY + 42], [bx - 58, iconY + 26]];
  for (const s of stars) {
    px(s[0], s[1], INK);
    px(s[0] + 1, s[1], INK);
    px(s[0], s[1] + 1, INK);
  }
}
// H3: mini chessboard, centred, with king and queen beside it.
{
  const cardX = 12 + (heroW + gap) * 2;
  const bx = cardX + Math.floor((heroW - 73) / 2);
  const sq = 6;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 0) fillRect(bx + c * sq, iconY + r * sq, sq, sq, INK);
      else fillRect(bx + c * sq, iconY + r * sq, sq, sq, WHITE);
    }
  }
  strokeRect(bx, iconY, 48, 48, INK, 1);
  drawText(bx + 58, iconY + 2, "K", 3, INK);
  drawText(bx + 58, iconY + 27, "Q", 3, RED);
}

// Secondary row 1: 4 cards.
const row1Y = heroY + heroH + gap;
const row1H = 238;
const colW = Math.floor((W - 24 - gap * 3) / 4);
card(12, row1Y, colW, row1H, "EUROPE", "CONFIRMED",
  "EU DEBATES GAZA AID AND LIVING COSTS",
  "MEPS ASSESS GAZA AID AMID FLOODS AND COLD, AND DEBATE INFLATION AND HOUSING.",
  3, NAVY);
card(12 + (colW + gap), row1Y, colW, row1H, "EUROPE", "CONFIRMED",
  "AUSTRIA TO OPEN ONLINE GAMBLING MARKET",
  "FINANCE COMMITTEE TAKES UP A BILL OPENING THE ONLINE MARKET AT A 45% DUTY.",
  3, NAVY);
card(12 + (colW + gap) * 2, row1Y, colW, row1H, "AFRICA", "REPORTED",
  "CAS TO RULE ON SENEGAL TITLE APPEAL",
  "SPORT'S TOP COURT DECIDES SENEGAL'S APPEAL AGAINST BEING STRIPPED OF ITS AFRICA CUP OF NATIONS TITLE.",
  3, GREEN);
card(12 + (colW + gap) * 3, row1Y, colW, row1H, "ASIA", "REPORTED",
  "SEOUL EASES BUYBACK LIMITS",
  "SOUTH KOREA LOOSENS DAILY BUYBACK CAPS FOR THREE MONTHS TO STEADY ITS STOCK MARKET.",
  3, RED);

// Row 2: 3 cards + DATE CHECK panel.
const row2Y = row1Y + row1H + gap;
const row2H = 206;
card(12, row2Y, colW, row2H, "ASIA", "REPORTED",
  "TOKYO REOPENS AFTER HUGE SELLOFF",
  "NIKKEI FELL 3,008 POINTS FRIDAY, 5TH-BIGGEST DROP.",
  3, RED);
card(12 + (colW + gap), row2Y, colW, row2H, "OCEANIA", "CONFIRMED",
  "CANBERRA URGED TO RATIFY VANUATU PACT",
  "PANEL RECOMMENDS RATIFYING THE PACT.",
  3, GREEN);
card(12 + (colW + gap) * 2, row2Y, colW, row2H, "ASIA", "CONFIRMED",
  "SIKHS MARK GURU NANAK'S 557TH",
  "GURPURAB: 557TH BIRTH ANNIVERSARY OF GURU NANAK, FOUNDER OF SIKHISM.",
  3, GOLD);
// DATE CHECK panel.
{
  const dx = 12 + (colW + gap) * 3;
  fillRect(dx, row2Y, colW, row2H, NAVY);
  strokeRect(dx, row2Y, colW, row2H, INK, 2);
  drawText(dx + 14, row2Y + 14, "DATE CHECK", 3, GOLD);
  hline(dx + 14, row2Y + 44, colW - 28, GOLD, 2);
  drawPara(dx + 14, row2Y + 56, "EVERY STORY HERE HAPPENED OR WAS FIRST REPORTED ON TUESDAY 24 NOV 2026, IN SOME TIME ZONE.", 2, colW - 28, 17, WHITE);
  drawText(dx + 14, row2Y + row2H - 18, "10 CHECKED: 6 CONFIRMED, 4 REPORTED", 1, GOLD);
}

// Bottom band: region counts (left) + world map (right) + footer.
const botY = row2Y + row2H + gap;
fillRect(0, botY, W, H - botY, PAPER2);
hline(0, botY, W, INK, 2);
drawText(24, botY + 6, "STORIES BY REGION", 2, INK);
const regions: [string, number][] = [
  ["EUROPE", 3],
  ["ASIA", 4],
  ["OCEANIA", 1],
  ["MIDDLE EAST", 1],
  ["AFRICA", 1],
  ["GLOBAL", 1],
];
for (let i = 0; i < regions.length; i++) {
  const ry = botY + 22 + i * 11;
  drawText(24, ry, regions[i][0], 1, INK);
  const bw = regions[i][1] * 34;
  fillRect(170, ry, bw, 7, RED);
  drawText(170 + bw + 8, ry, String(regions[i][1]), 1, INK);
}

// World map: coarse equirectangular continents, pins for story places.
const mapX = 520;
const mapY = botY + 2;
const mapW = 480;
const mapH = 82;
strokeRect(mapX, mapY, mapW, mapH, INK, 2);
fillRect(mapX + 1, mapY + 1, mapW - 2, mapH - 2, [214, 230, 238]);
function lonLat(lon: number, lat: number): [number, number] {
  return [
    mapX + Math.round(((lon + 180) / 360) * mapW),
    mapY + Math.round(((90 - lat) / 180) * mapH),
  ];
}
const LAND = [196, 190, 168];
const NA = [[-168, 66], [-140, 70], [-125, 72], [-110, 68], [-95, 69], [-85, 66], [-80, 62], [-75, 58], [-65, 60], [-55, 52], [-60, 46], [-70, 42], [-75, 35], [-80, 32], [-85, 30], [-90, 29], [-97, 26], [-97, 22], [-94, 17], [-90, 15], [-83, 10], [-80, 8], [-90, 14], [-105, 20], [-110, 24], [-115, 30], [-125, 40], [-125, 48], [-130, 55], [-150, 61], [-165, 60]];
const SA = [[-80, 8], [-72, 11], [-62, 9], [-52, 5], [-50, 0], [-44, -3], [-38, -5], [-35, -8], [-40, -15], [-48, -25], [-56, -35], [-62, -41], [-70, -50], [-74, -53], [-72, -42], [-72, -30], [-70, -18], [-77, -12], [-80, -5], [-80, 2]];
const EU = [[-10, 36], [0, 38], [10, 38], [18, 40], [22, 38], [28, 41], [30, 45], [28, 50], [20, 54], [18, 56], [12, 54], [8, 57], [5, 58], [-2, 57], [-5, 53], [-10, 50], [-9, 43], [-9, 37]];
const AF = [[-17, 15], [-10, 28], [0, 35], [10, 37], [20, 32], [30, 31], [35, 28], [38, 22], [43, 12], [48, 11], [51, 10], [44, 0], [40, -10], [38, -18], [35, -24], [32, -29], [28, -33], [20, -35], [17, -30], [14, -22], [12, -10], [9, 4], [-8, 4], [-13, 8], [-17, 12]];
const AS = [[30, 45], [40, 48], [50, 46], [60, 45], [70, 48], [80, 50], [90, 55], [100, 58], [110, 60], [120, 62], [130, 60], [140, 60], [150, 62], [160, 62], [170, 66], [178, 65], [170, 60], [162, 58], [158, 52], [142, 50], [140, 40], [135, 35], [130, 33], [122, 30], [120, 23], [110, 20], [105, 10], [103, 2], [100, 6], [97, 10], [92, 15], [88, 22], [80, 15], [77, 8], [74, 20], [70, 24], [66, 25], [61, 25], [57, 26], [54, 26], [52, 28], [48, 29], [44, 29], [40, 31], [35, 36], [30, 36]];
const OC = [[113, -22], [114, -30], [120, -34], [124, -33], [129, -32], [132, -32], [135, -35], [138, -35], [140, -38], [145, -38], [147, -39], [150, -37], [153, -32], [153, -27], [150, -23], [146, -19], [142, -11], [137, -12], [132, -11], [127, -14], [122, -17], [117, -20], [113, -22]];
const JP = [[130, 31], [132, 33], [135, 34], [137, 35], [139, 36], [141, 39], [141, 42], [143, 44], [145, 44], [143, 40], [140, 36], [137, 34], [133, 34], [130, 32]];
const UK = [[-5, 50], [-3, 53], [-5, 56], [-7, 55], [-6, 52]];
const NZ = [[167, -46], [170, -44], [172, -41], [174, -39], [176, -38], [178, -38], [176, -41], [174, -44], [170, -47]];
for (const cont of [NA, SA, EU, AF, AS, OC, JP, UK, NZ]) {
  poly(cont.map((p) => lonLat(p[0], p[1])), LAND);
}
// Pins: [lon, lat, label]
const pins: [number, number][] = [
  [54.4, 24.5], // Abu Dhabi
  [6.1, 46.2], // Geneva
  [7.75, 48.58], // Strasbourg
  [16.37, 48.2], // Vienna
  [6.6, 46.5], // Lausanne
  [127, 37.5], // Seoul
  [139.7, 35.7], // Tokyo
  [149.1, -35.3], // Canberra
  [74.9, 31.6], // Punjab
];
for (const p of pins) {
  const [x, y] = lonLat(p[0], p[1]);
  circle(x, y, 4, RED);
  ring(x, y, 6, WHITE, 1);
}
drawText(mapX + 8, mapY + 8, "WHERE THE NEWS HAPPENED", 1, INK);
drawText(mapX + 8, mapY + mapH - 12, "MOON: SEEN WORLDWIDE", 1, INK);

// Footer sources strip.
hline(0, H - 24, W, INK, 1);
drawText(24, H - 17, "SOURCES: REUTERS, ABC, CHESS.COM, ASTRONOMY.COM, AUST PARLIAMENT, MORNINGSTAR, IMD", 1, GREY);
drawTextR(1000, H - 17, "DRAWN FROM REPORTS OF 24 NOV 2026", 1, GREY);

// ---------------------------------------------------------------------------
// PNG encoding: 8-bit RGB, no filters, zlib level 9.
// ---------------------------------------------------------------------------
function crc32(data: Uint8Array): number {
  let table: number[] | null = null;
  if (!table) {
    table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    (crc32 as unknown as { t: number[] }).t = table;
  }
  const t = (crc32 as unknown as { t: number[] }).t;
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = t[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcData = new Uint8Array(4 + data.length);
  crcData.set(out.subarray(4, 8), 0);
  crcData.set(data, 4);
  dv.setUint32(8 + data.length, crc32(crcData));
  return out;
}

function encodePNG(): Uint8Array {
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))];
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "entry.png"), encodePNG());
