import React from 'react';
import { Text } from 'react-native';
import { Fonts } from '../../constants/theme';

// Renders the light markdown the coach replies with: **bold** spans,
// "- " / "* " bullets and blank-line paragraphs. Everything else is plain text.
export default function RichText({ text = '', style, boldStyle }) {
  const lines = String(text).replace(/\r/g, '').split('\n');
  return (
    <Text style={style}>
      {lines.map((line, i) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const body = bullet ? line.replace(/^\s*[-*•]\s+/, '') : line;
        return (
          <Text key={i}>
            {bullet ? '•  ' : ''}
            {body.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith('**') && part.endsWith('**') && part.length > 4
                ? <Text key={j} style={[{ fontFamily: Fonts.bodyBold }, boldStyle]}>{part.slice(2, -2)}</Text>
                : part)}
            {i < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      })}
    </Text>
  );
}

// "**1. Title** 🔥\nbody…" blocks → [{ title, body }]. Used by Insights and Meal plan.
export function splitSections(text = '') {
  const out = [];
  let cur = null;
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    const head = line.match(/^(?:#{1,4}\s*)?\*\*(.+?)\*\*\s*(.*)$/) || line.match(/^#{1,4}\s+(.+)$/);
    if (head && (line.startsWith('**') || line.startsWith('#'))) {
      cur = { title: head[1].trim(), tail: (head[2] || '').trim(), lines: [] };
      out.push(cur);
    } else if (line) {
      if (!cur) { cur = { title: '', tail: '', lines: [] }; out.push(cur); }
      cur.lines.push(line);
    }
  }
  return out;
}

// "~520 kcal | P: 18g | C: 72g | F: 16g" → { kcal, p, c, f } or null
export function parseMacros(line = '') {
  const kcal = line.match(/(\d[\d,]*)\s*kcal/i);
  if (!kcal) return null;
  const grab = k => { const m = line.match(new RegExp(`\\b${k}\\s*:?\\s*(\\d+)\\s*g`, 'i')); return m ? Number(m[1]) : null; };
  return { kcal: Number(kcal[1].replace(/,/g, '')), p: grab('P'), c: grab('C'), f: grab('F') };
}
