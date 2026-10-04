import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Palette, Fonts } from '../../constants/theme';

// Theme-matched line chart: soft area fill, faint grid, emphasised last point.
// points = [{ label: '3/9', value: 60 }, ...] in time order.
export default function LineChart({ points = [], height = 150, color = Palette.brass, formatValue = v => String(v) }) {
  const [width, setWidth] = useState(0);

  const padL = 34, padR = 12, padT = 12, padB = 22;
  const values = points.map(p => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (!Number.isFinite(min)) { min = 0; max = 1; }
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.15;
  max += span * 0.15;

  const innerW = Math.max(width - padL - padR, 1);
  const innerH = height - padT - padB;
  const x = i => padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = v => padT + (1 - (v - min) / (max - min)) * innerH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = points.length
    ? `${line} L${x(points.length - 1).toFixed(1)},${padT + innerH} L${x(0).toFixed(1)},${padT + innerH} Z`
    : '';

  // Grid lines at round values (e.g. 50 / 55 / 60) inside the visible range
  const rawStep = (max - min) / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= rawStep) || 10 * mag;
  const grid = [];
  for (let g = Math.ceil(min / step) * step; g <= max; g += step) grid.push(Math.round(g * 100) / 100);
  const last = points[points.length - 1];

  // Show at most ~5 x labels, always including the last one
  const labelEvery = Math.max(1, Math.ceil(points.length / 5));

  return (
    <View style={{ height }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && points.length > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.18} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {grid.map((g, i) => (
            <React.Fragment key={i}>
              <Line x1={padL} x2={width - padR} y1={y(g)} y2={y(g)} stroke={Palette.lineSoft} strokeWidth={1} />
              <SvgText x={padL - 6} y={y(g) + 3.5} fontSize={10} fontFamily={Fonts.bodySemi} fill={Palette.textDim} textAnchor="end">
                {formatValue(g)}
              </SvgText>
            </React.Fragment>
          ))}

          <Path d={area} fill="url(#lcFill)" />
          <Path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {points.map((p, i) => (i % labelEvery === 0 || i === points.length - 1) && (
            <SvgText
              key={`l${i}`}
              x={x(i)}
              y={height - 6}
              fontSize={10}
              fontFamily={Fonts.bodySemi}
              fill={Palette.textDim}
              textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'}
            >
              {p.label}
            </SvgText>
          ))}

          {last && (
            <Circle cx={x(points.length - 1)} cy={y(last.value)} r={4.5} fill={Palette.ink} stroke={color} strokeWidth={2} />
          )}
        </Svg>
      )}
    </View>
  );
}

