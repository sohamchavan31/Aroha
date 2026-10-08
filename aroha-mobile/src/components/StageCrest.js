import React from 'react';
import Svg, { Circle, Path, Polygon, G } from 'react-native-svg';
import { STAGES } from '../constants/stages';
import { Palette } from '../constants/theme';

// One emblem per evolution stage, drawn on a 100×100 grid. Each stage adds
// detail to the last: spark → eye → chevrons → shield → fortress → peak → crown.
// Matte: brass outlines with a faint flat fill, no glow.

function poly(n, r, rot = -90, cx = 50, cy = 50) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function ticks(n, r1, r2) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = ((360 / n) * i * Math.PI) / 180;
    d += `M${(50 + r1 * Math.cos(a)).toFixed(2)} ${(50 + r1 * Math.sin(a)).toFixed(2)}L${(50 + r2 * Math.cos(a)).toFixed(2)} ${(50 + r2 * Math.sin(a)).toFixed(2)}`;
  }
  return d;
}

const SPARK_STAR = 'M50 24 L56 44 L76 50 L56 56 L50 76 L44 56 L24 50 L44 44 Z';

function Shape({ index, stroke, fill, sw }) {
  const s = { stroke, strokeWidth: sw, strokeLinejoin: 'round', strokeLinecap: 'round' };
  switch (index) {
    case 0: // Spark
      return (
        <G>
          <Circle cx={50} cy={50} r={38} fill="none" {...s} strokeOpacity={0.35} />
          <Path d={SPARK_STAR} fill={fill} {...s} />
        </G>
      );
    case 1: // Awakened
      return (
        <G>
          <Circle cx={50} cy={50} r={40} fill="none" {...s} />
          <Polygon points="50,22 76,68 24,68" fill={fill} {...s} />
          <Circle cx={50} cy={53} r={7} fill="none" {...s} />
        </G>
      );
    case 2: // Ascender
      return (
        <G>
          <Polygon points={poly(6, 42)} fill={fill} {...s} />
          <Path d="M32 52 L50 34 L68 52 M32 70 L50 52 L68 70" fill="none" {...s} />
        </G>
      );
    case 3: // Guardian
      return (
        <G>
          <Path d="M50 10 L84 22 V48 C84 70 70 83 50 92 C30 83 16 70 16 48 V22 Z" fill={fill} {...s} />
          <Path d="M34 50 L50 36 L66 50 M50 36 V74" fill="none" {...s} />
        </G>
      );
    case 4: // Titan
      return (
        <G>
          <Polygon points={poly(8, 44, -67.5)} fill={fill} {...s} />
          <Circle cx={50} cy={50} r={24} fill="none" {...s} />
          <Path d={ticks(8, 28, 36)} fill="none" {...s} />
          <Polygon points="50,38 60,50 50,62 40,50" fill={stroke} fillOpacity={0.5} {...s} />
        </G>
      );
    case 5: // Apex
      return (
        <G>
          <Circle cx={50} cy={50} r={44} fill="none" {...s} />
          <Path d="M16 72 L38 36 L50 54 L62 30 L84 72 Z" fill={fill} {...s} />
          <Path d="M55 42 L62 30 L69 42" fill="none" {...s} />
          <Circle cx={30} cy={26} r={4} fill={stroke} fillOpacity={0.5} {...s} />
        </G>
      );
    default: // Legend
      return (
        <G>
          <Circle cx={50} cy={50} r={45} fill="none" {...s} />
          <Path d={ticks(24, 38, 42)} fill="none" {...s} strokeOpacity={0.6} />
          <Path d="M28 64 L28 38 L40 50 L50 28 L60 50 L72 38 L72 64 Z" fill={fill} {...s} />
          <Path d="M28 72 H72" fill="none" {...s} />
          <Circle cx={28} cy={36} r={3} fill={stroke} {...s} />
          <Circle cx={50} cy={26} r={3} fill={stroke} {...s} />
          <Circle cx={72} cy={36} r={3} fill={stroke} {...s} />
        </G>
      );
  }
}

export function stageIndex(stage) {
  if (typeof stage === 'number') return Math.max(0, Math.min(stage, STAGES.length - 1));
  const i = STAGES.findIndex(s => s.name === stage);
  return i < 0 ? 0 : i;
}

export default function StageCrest({ stage, size = 48, color = Palette.brass, locked = false, style }) {
  const index = stageIndex(stage);
  const stroke = locked ? Palette.textDim : color;
  // Thinner lines on big crests so they stay crisp, thicker on small ones so they stay visible.
  const sw = size >= 120 ? 2.5 : size >= 60 ? 3.2 : 4.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Shape index={index} stroke={stroke} fill={locked ? 'none' : color + '1F'} sw={sw} />
    </Svg>
  );
}
