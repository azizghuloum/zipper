/* */

/*
 * based on Functional Pearl, The Zipper, Gerard Huet
 *
 * https://www.st.cs.uni-saarland.de/edu/seminare/2005/advanced-fp/docs/huet-zipper.pdf
 *
 */

export type LL<A> = null | [A, LL<A>];

function revappend<A>(l: LL<A>, r: LL<A>) {
  while (l !== null) {
    r = [l[0], r];
    l = l[1];
  }
  return r;
}

export type Path<T, X, O> =
  | { type: "top" }
  | {
      type: "node";
      tag: T;
      l: LL<X>;
      p: Path<T, X, O>;
      r: LL<X>;
      o: O;
    };

function node<T, X, O>(
  tag: T,
  l: LL<X>,
  p: Path<T, X, O>,
  r: LL<X>,
  o: O
): Path<T, X, O> {
  return { type: "node", tag, l, p, r, o };
}

export type Loc<T, X, O> = { type: "loc"; t: X; p: Path<T, X, O> };

function loc<T, X, O>(t: X, p: Path<T, X, O>): Loc<T, X, O> {
  return { type: "loc", t, p };
}

export function go_left<T, X, O>({ t, p }: Loc<T, X, O>): Loc<T, X, O> {
  switch (p.type) {
    case "top":
      throw new Error("left of top");
    case "node":
      if (p.l === null) throw new Error("left of first");
      const [l, left] = p.l;
      return loc(l, node(p.tag, left, p.p, [t, p.r], p.o));
  }
}

export function go_right<T, X, O>({ t, p }: Loc<T, X, O>): Loc<T, X, O> {
  switch (p.type) {
    case "top":
      throw new Error("right of top");
    case "node":
      if (p.r === null) throw new Error("right of last");
      const [r, right] = p.r;
      return loc(r, node(p.tag, [t, p.l], p.p, right, p.o));
  }
}

export function go_up<T, X, O>(
  { t, p }: Loc<T, X, O>,
  recon: (tag: T, children: LL<X>, origin: O) => X
): Loc<T, X, O> {
  switch (p.type) {
    case "top":
      throw new Error("up of top");
    case "node":
      return loc(recon(p.tag, revappend(p.l, [t, p.r]), p.o), p.p);
  }
}

export function go_down<T, X, O>(
  { t, p }: Loc<T, X, O>,
  decon: <S>(x: X, cb: (tag: T, children: LL<X>, origin: O) => S) => S
): Loc<T, X, O> {
  return decon(t, (tag, children, origin) => {
    if (children === null) throw new Error("down of empty");
    const [t1, trees] = children;
    return loc(t1, node(tag, null, p, trees, origin));
  });
}

export function change<T, X, O>({ p }: Loc<T, X, O>, t: X): Loc<T, X, O> {
  return loc(t, p);
}

/* end of the Zipper */

/* some helpers */

export function mkzipper<T, X, O>(t: X): Loc<T, X, O> {
  return loc(t, { type: "top" });
}

export function reconvert<T, X, Y, O>(
  loc: Loc<T, X, O>,
  mark: (x: Y) => Y,
  conv: (x: X) => Y,
  list: (tag: T, children: Y[], origin: O) => Y
): Y {
  let y = mark(conv(loc.t));
  let p = loc.p;
  while (p.type !== "top") {
    let ac: Y[] = [];
    let l = p.l;
    while (l) {
      ac.push(conv(l[0]));
      l = l[1];
    }
    ac.reverse();
    ac.push(y);
    let r = p.r;
    while (r) {
      ac.push(conv(r[0]));
      r = r[1];
    }
    y = list(p.tag, ac, p.o);
    p = p.p;
  }
  return y;
}

/* */
