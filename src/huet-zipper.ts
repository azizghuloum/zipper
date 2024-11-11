/* */

/*
 * based on Functional Pearl, The Zipper, Gerard Huet
 *
 * https://www.st.cs.uni-saarland.de/edu/seminare/2005/advanced-fp/docs/huet-zipper.pdf
 *
 */

export type LL<A> = null | [A, LL<A>];

export type LR<A> = null | [LR<A>, A];

function empty<I>(): LL<I> {
  return null;
}

function cons<A>(a: A, d: LL<A>): LL<A> {
  return [a, d];
}

function snoc<A>(d: LL<A>, a: A): LL<A> {
  return cons(a, d);
}

function revappend<A>(l: LR<A>, r: LL<A>) {
  while (l !== null) {
    r = cons(l[1], r);
    l = l[0];
  }
  return r;
}

export type Tree<I> =
  | { type: "item"; item: I }
  | { type: "section"; list: LL<Tree<I>> };

function item<I>(item: I): Tree<I> {
  return { type: "item", item };
}

function section<I>(list: LL<Tree<I>>): Tree<I> {
  return { type: "section", list };
}

export type Path<I> =
  | { type: "top" }
  | { type: "node"; l: LR<Tree<I>>; p: Path<I>; r: LL<Tree<I>> };

function node<I>(l: LR<Tree<I>>, p: Path<I>, r: LL<Tree<I>>): Path<I> {
  return { type: "node", l, p, r };
}

export type Loc<I> = { type: "loc"; t: Tree<I>; p: Path<I> };

function loc<I>(t: Tree<I>, p: Path<I>): Loc<I> {
  return { type: "loc", t, p };
}

export function go_left<I>({ t, p }: Loc<I>): Loc<I> {
  switch (p.type) {
    case "top":
      throw new Error("left of top");
    case "node":
      if (p.l === null) throw new Error("left of first");
      const [leftleft, left] = p.l;
      return loc(left, node(leftleft, p.p, [t, p.r]));
  }
}

export function go_right<I>({ t, p }: Loc<I>): Loc<I> {
  switch (p.type) {
    case "top":
      throw new Error("right of top");
    case "node":
      if (p.r === null) throw new Error("right of last");
      const [right, rightright] = p.r;
      return loc(right, node([p.l, t], p.p, rightright));
  }
}

export function go_up<I>({ t, p }: Loc<I>): Loc<I> {
  switch (p.type) {
    case "top":
      throw new Error("up of top");
    case "node":
      return loc(section(revappend(p.l, [t, p.r])), p.p);
  }
}

export function go_down<I>({ t, p }: Loc<I>): Loc<I> {
  switch (t.type) {
    case "item":
      throw new Error("down of item");
    case "section":
      if (t.list === null) throw new Error("down of empty");
      const [t1, trees] = t.list;
      return loc(t1, node(null, p, trees));
  }
}

export function change<I>({ p }: Loc<I>, t: Tree<I>): Loc<I> {
  return loc(t, p);
}

/* end of the Zipper */

/* some helpers */

type TR<I> = I | TR<I>[];

export function convert_tree<I>(x: TR<I>): Tree<I> {
  if (Array.isArray(x)) {
    return section(x.map(convert_tree).reduceRight(snoc, empty()));
  } else {
    return item(x);
  }
}

export function unconvert_tree<I>(tree: Tree<I>): TR<I> {
  switch (tree.type) {
    case "item":
      return tree.item;
    case "section": {
      const a: TR<I>[] = [];
      let x = tree.list;
      while (x !== null) {
        a.push(unconvert_tree(x[0]));
        x = x[1];
      }
      return a;
    }
  }
}

export function convert<I>(tree: TR<I>): Loc<I> {
  return loc(convert_tree(tree), { type: "top" });
}

export function unconvert<I>(loc: Loc<I>): TR<I> {
  switch (loc.p.type) {
    case "top":
      return unconvert_tree(loc.t);
    case "node":
      return unconvert(go_up(loc));
  }
}

/* */
