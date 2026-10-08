import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Rect, Path, G } from 'react-native-svg';
import { Palette, Type, Spacing } from '../../constants/theme';

// Front and back body outline with the worked muscles lit up:
// main muscles solid, supporting muscles faint, the rest neutral.
// Drawn on a 100×190 grid per figure, mirrored left/right.

const L = (cx, rest) => ({ cx, ...rest });
const mirror = shapes => shapes.flatMap(s => [s, { ...s, cx: 100 - s.cx, rotation: s.rotation ? -s.rotation : undefined }]);

const FRONT = {
  front_delts: mirror([L(30, { cy: 41, rx: 7, ry: 7.5 })]),
  side_delts:  mirror([L(26, { cy: 44, rx: 3.5, ry: 6 })]),
  chest:       mirror([L(41.5, { cy: 47, rx: 8.5, ry: 6.5 })]),
  biceps:      mirror([L(26, { cy: 60, rx: 4.6, ry: 9, rotation: 8 })]),
  forearms:    mirror([L(22, { cy: 81, rx: 4, ry: 10, rotation: 10 })]),
  obliques:    mirror([L(37.5, { cy: 70, rx: 3.6, ry: 9 })]),
  hip_flexors: mirror([L(43, { cy: 91, rx: 4, ry: 4 })]),
  quads:       mirror([L(40.5, { cy: 112, rx: 7.5, ry: 17 })]),
  adductors:   mirror([L(47, { cy: 106, rx: 2.6, ry: 10 })]),
  calves:      mirror([L(41, { cy: 151, rx: 4.6, ry: 13 })]),
};

const BACK = {
  rear_delts:  mirror([L(30, { cy: 41, rx: 7, ry: 7.5 })]),
  side_delts:  mirror([L(26, { cy: 44, rx: 3.5, ry: 6 })]),
  triceps:     mirror([L(26, { cy: 60, rx: 4.6, ry: 9, rotation: 8 })]),
  forearms:    mirror([L(22, { cy: 81, rx: 4, ry: 10, rotation: 10 })]),
  lats:        mirror([L(38.5, { cy: 61, rx: 6, ry: 12, rotation: -12 })]),
  glutes:      mirror([L(43.5, { cy: 93, rx: 7.5, ry: 8 })]),
  abductors:   mirror([L(34.5, { cy: 92, rx: 2.6, ry: 6 })]),
  hamstrings:  mirror([L(41, { cy: 119, rx: 7, ry: 15 })]),
  calves:      mirror([L(41, { cy: 150, rx: 5.4, ry: 12 })]),
};

function Silhouette() {
  return (
    <G>
      <Circle cx={50} cy={15} r={9.5} />
      <Rect x={45.5} y={23} width={9} height={8} rx={3} />
      <Path d="M30 33 Q50 28 70 33 L71 56 Q64 86 61 98 L39 98 Q36 86 29 56 Z" />
      <Path d="M24 36 Q18 52 17 72 L15 92 Q19 94 22 93 L27 72 Q31 54 31 40 Z" />
      <Path d="M76 36 Q82 52 83 72 L85 92 Q81 94 78 93 L73 72 Q69 54 69 40 Z" />
      <Path d="M38 96 L49 96 L48 132 L46 168 L39 170 L35 132 Q33 112 38 96 Z" />
      <Path d="M62 96 L51 96 L52 132 L54 168 L61 170 L65 132 Q67 112 62 96 Z" />
    </G>
  );
}

function Region({ shapes, fill }) {
  return shapes.map((s, i) => (
    <Ellipse
      key={i}
      cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
      transform={s.rotation ? `rotate(${s.rotation} ${s.cx} ${s.cy})` : undefined}
      fill={fill}
    />
  ));
}

function Figure({ regions, extra, primary, secondary, height }) {
  const colour = key => (primary.includes(key) ? Palette.kcal : secondary.includes(key) ? Palette.kcal + '59' : Palette.track);
  return (
    <Svg width={(height * 100) / 190} height={height} viewBox="0 0 100 190">
      <G fill={Palette.surface2} stroke={Palette.line} strokeWidth={1}>
        <Silhouette />
      </G>
      {extra?.(colour)}
      {Object.entries(regions).map(([key, shapes]) => (
        <Region key={key} shapes={shapes} fill={colour(key)} />
      ))}
    </Svg>
  );
}

export default function MuscleMap({ primary = [], secondary = [], height = 150, labels = true }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`Works ${primary.join(', ').replace(/_/g, ' ')}`}>
      <View style={styles.col}>
        <Figure
          regions={FRONT}
          primary={primary}
          secondary={secondary}
          height={height}
          extra={colour => <Rect x={44} y={55} width={12} height={30} rx={4} fill={colour('abs')} />}
        />
        {labels && <Text style={styles.label}>Front</Text>}
      </View>
      <View style={styles.col}>
        <Figure
          regions={BACK}
          primary={primary}
          secondary={secondary}
          height={height}
          extra={colour => (
            <G>
              <Path d="M50 30 L37 38 L44 50 L50 54 L56 50 L63 38 Z" fill={colour('traps')} />
              <Rect x={44} y={50} width={12} height={18} rx={3} fill={colour('upper_back')} />
              <Rect x={44.5} y={70} width={11} height={15} rx={3} fill={colour('lower_back')} />
            </G>
          )}
        />
        {labels && <Text style={styles.label}>Back</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  col:   { alignItems: 'center', gap: 4 },
  label: { ...Type.label, fontSize: 9, color: Palette.textDim },
});
