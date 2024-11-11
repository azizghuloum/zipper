/* */

/*
 * based on Functional Pearl, The Zipper, Gerard Huet
 *
 * https://www.st.cs.uni-saarland.de/edu/seminare/2005/advanced-fp/docs/huet-zipper.pdf
 *
 */

export type LL<A> = null | [A, LL<A>];

function empty<I>(): LL<I> {
  return null;
}

function cons<A>(a: A, d: LL<A>): LL<A> {
  return [a, d];
}

function snoc<A>(d: LL<A>, a: A): LL<A> {
  return cons(a, d);
}

function revappend<A>(l: LL<A>, r: LL<A>) {
  while (l !== null) {
    r = cons(l[0], r);
    l = l[1];
  }
  return r;
}

export type Tree<T> = { tag: T; list: LL<Tree<T>> };

function section<T>(tag: T, list: LL<Tree<T>>): Tree<T> {
  return { tag, list };
}

export type Path<T> =
  | { type: "top" }
  | { type: "node"; tag: T; l: LL<Tree<T>>; p: Path<T>; r: LL<Tree<T>> };

function node<T>(tag: T, l: LL<Tree<T>>, p: Path<T>, r: LL<Tree<T>>): Path<T> {
  return { type: "node", tag, l, p, r };
}

export type Loc<T> = { type: "loc"; t: Tree<T>; p: Path<T> };

function loc<T>(t: Tree<T>, p: Path<T>): Loc<T> {
  return { type: "loc", t, p };
}

export function go_left<T>({ t, p }: Loc<T>): Loc<T> {
  switch (p.type) {
    case "top":
      throw new Error("left of top");
    case "node":
      if (p.l === null) throw new Error("left of first");
      const [l, left] = p.l;
      return loc(l, node(p.tag, left, p.p, [t, p.r]));
  }
}

export function go_right<T>({ t, p }: Loc<T>): Loc<T> {
  switch (p.type) {
    case "top":
      throw new Error("right of top");
    case "node":
      if (p.r === null) throw new Error("right of last");
      const [r, right] = p.r;
      return loc(r, node(p.tag, [t, p.l], p.p, right));
  }
}

export function go_up<T>({ t, p }: Loc<T>): Loc<T> {
  switch (p.type) {
    case "top":
      throw new Error("up of top");
    case "node":
      return loc(section(p.tag, revappend(p.l, [t, p.r])), p.p);
  }
}

export function go_down<T>({ t, p }: Loc<T>): Loc<T> {
  if (t.list === null) throw new Error("down of empty");
  const [t1, trees] = t.list;
  return loc(t1, node(t.tag, null, p, trees));
}

export function change<T>({ p }: Loc<T>, t: Tree<T>): Loc<T> {
  return loc(t, p);
}

/* end of the Zipper */

/* some helpers */

type TR<T> = { tag: T; children: TR<T>[] };

export function convert_tree<T>(x: TR<T>): Tree<T> {
  return section(
    x.tag,
    x.children.map(convert_tree).reduceRight(snoc, empty())
  );
}

export function unconvert_tree<T>(tree: Tree<T>): TR<T> {
  const a: TR<T>[] = [];
  let x = tree.list;
  while (x !== null) {
    a.push(unconvert_tree(x[0]));
    x = x[1];
  }
  return { tag: tree.tag, children: a };
}

export function convert<T>(tree: TR<T>): Loc<T> {
  return loc(convert_tree(tree), { type: "top" });
}

export function unconvert<T>(loc: Loc<T>): TR<T> {
  switch (loc.p.type) {
    case "top":
      return unconvert_tree(loc.t);
    case "node":
      return unconvert(go_up(loc));
  }
}

/* */
