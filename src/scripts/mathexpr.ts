// A small, safe parser for f(x, y) expressions typed by visitors. It never evaluates code;
// it builds a closure tree from a whitelisted grammar.
//
//   expr   := term (('+' | '-') term)*
//   term   := unary (('*' | '/' | implicit) unary)*
//   unary  := '-' unary | '+' unary | power      (so -x^2 = -(x^2))
//   power  := call ('^' unary)?
//   call   := ident '(' expr ')' | ident | number | '(' expr ')'

export type Fn = (x: number, y: number) => number;

const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, log: Math.log, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs,
};
const CONSTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E };

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const s = src.replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '^2').replace(/³/g, '^3');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = s.slice(i).match(/^\d*\.?\d+(e[+-]?\d+)?/i)!;
      if (!m) throw new Error(`Unexpected "${c}"`);
      out.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[a-zπ]/i.test(c)) {
      const m = s.slice(i).match(/^[a-zπ]+/i)!;
      let word = m[0].toLowerCase();
      // Split runs like "xy" or "2xsin" into known pieces: longest function/const name first, else single letters.
      while (word.length) {
        const name = Object.keys({ ...FUNCS, ...CONSTS }).sort((a, b) => b.length - a.length).find((k) => word.startsWith(k));
        const piece = name ?? word[0];
        if (!name && piece !== 'x' && piece !== 'y') throw new Error(`Unknown name "${m[0]}" (use x and y)`);
        out.push({ t: 'id', v: piece });
        word = word.slice(piece.length);
      }
      i += m[0].length;
      continue;
    }
    if ('+-*/^()'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`Unexpected "${c}"`);
  }
  return out;
}

export function compile(src: string): Fn {
  const toks = tokenize(src);
  if (!toks.length) throw new Error('Type a function of x and y');
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === 'op' && peek()!.v === v;
  const expect = (v: string) => {
    if (!isOp(v)) throw new Error(`Expected "${v}"`);
    p++;
  };

  const expr = (): Fn => {
    let left = term();
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].v;
      const a = left, b = term();
      left = op === '+' ? (x, y) => a(x, y) + b(x, y) : (x, y) => a(x, y) - b(x, y);
    }
    return left;
  };

  const startsFactor = () => {
    const t = peek();
    return !!t && (t.t === 'num' || t.t === 'id' || (t.t === 'op' && t.v === '('));
  };

  const term = (): Fn => {
    let left = unary();
    while (isOp('*') || isOp('/') || startsFactor()) {
      const op = isOp('*') || isOp('/') ? toks[p++].v : '*';
      const a = left, b = unary();
      left = op === '*' ? (x, y) => a(x, y) * b(x, y) : (x, y) => a(x, y) / b(x, y);
    }
    return left;
  };

  const power = (): Fn => {
    const base = call();
    if (isOp('^')) {
      p++;
      const ex = unary();
      return (x, y) => Math.pow(base(x, y), ex(x, y));
    }
    return base;
  };

  const unary = (): Fn => {
    if (isOp('-')) { p++; const a = unary(); return (x, y) => -a(x, y); }
    if (isOp('+')) { p++; return unary(); }
    return power();
  };

  const call = (): Fn => {
    const t = toks[p];
    if (!t) throw new Error('Unexpected end');
    if (t.t === 'num') { p++; const v = t.v; return () => v; }
    if (t.t === 'op' && t.v === '(') { p++; const e = expr(); expect(')'); return e; }
    if (t.t === 'id') {
      p++;
      if (t.v === 'x') return (x) => x;
      if (t.v === 'y') return (_x, y) => y;
      if (t.v in CONSTS) { const v = CONSTS[t.v]; return () => v; }
      if (t.v in FUNCS) {
        const f = FUNCS[t.v];
        // Allow both sin(x) and sin x.
        const arg = isOp('(') ? (p++, (() => { const e = expr(); expect(')'); return e; })()) : power();
        return (x, y) => f(arg(x, y));
      }
      throw new Error(`Unknown name "${t.v}" (use x and y)`);
    }
    throw new Error(`Unexpected "${t.v}"`);
  };

  const fn = expr();
  if (p < toks.length) throw new Error(`Unexpected "${(toks[p] as Tok).v}"`);
  return fn;
}
