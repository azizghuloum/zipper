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

export type Tree<T, I> =
  | { type: "item"; item: I }
  | { type: "section"; tag: T; list: LL<Tree<T, I>> };

function item<T, I>(item: I): Tree<T, I> {
  return { type: "item", item };
}

function section<T, I>(tag: T, list: LL<Tree<T, I>>): Tree<T, I> {
  return { type: "section", tag, list };
}

export type Path<T, I> =
  | { type: "top" }
  | {
      type: "node";
      tag: T;
      l: LL<Tree<T, I>>;
      p: Path<T, I>;
      r: LL<Tree<T, I>>;
    };

function node<T, I>(
  tag: T,
  l: LL<Tree<T, I>>,
  p: Path<T, I>,
  r: LL<Tree<T, I>>
): Path<T, I> {
  return { type: "node", tag, l, p, r };
}

export type Loc<T, I> = { type: "loc"; t: Tree<T, I>; p: Path<T, I> };

function loc<T, I>(t: Tree<T, I>, p: Path<T, I>): Loc<T, I> {
  return { type: "loc", t, p };
}

export function go_left<T, I>({ t, p }: Loc<T, I>): Loc<T, I> {
  switch (p.type) {
    case "top":
      throw new Error("left of top");
    case "node":
      if (p.l === null) throw new Error("left of first");
      const [l, left] = p.l;
      return loc(l, node(p.tag, left, p.p, [t, p.r]));
  }
}

export function go_right<T, I>({ t, p }: Loc<T, I>): Loc<T, I> {
  switch (p.type) {
    case "top":
      throw new Error("right of top");
    case "node":
      if (p.r === null) throw new Error("right of last");
      const [r, right] = p.r;
      return loc(r, node(p.tag, [t, p.l], p.p, right));
  }
}

export function go_up<T, I>({ t, p }: Loc<T, I>): Loc<T, I> {
  switch (p.type) {
    case "top":
      throw new Error("up of top");
    case "node":
      return loc(section(p.tag, revappend(p.l, [t, p.r])), p.p);
  }
}

export function go_down<T, I>({ t, p }: Loc<T, I>): Loc<T, I> {
  switch (t.type) {
    case "item":
      throw new Error("down of item");
    case "section":
      if (t.list === null) throw new Error("down of empty");
      const [t1, trees] = t.list;
      return loc(t1, node(t.tag, null, p, trees));
  }
}

export function change<T, I>({ p }: Loc<T, I>, t: Tree<T, I>): Loc<T, I> {
  return loc(t, p);
}

/* end of the Zipper */

/* some helpers */

type converter<T, I, X> = (
  x: X,
  atom: (a: I) => Tree<T, I>,
  list: (tag: T, children: X[]) => Tree<T, I>
) => Tree<T, I>;

export function convert_tree<T, I, X>(x: X, f: converter<T, I, X>): Tree<T, I> {
  return f(x, item, (tag, ls) =>
    section(tag, ls.map((x) => convert_tree(x, f)).reduceRight(snoc, empty()))
  );
}

export function unconvert_tree<T, I, X>(
  tree: Tree<T, I>,
  item: (item: I) => X,
  list: (tag: T, children: X[]) => X
): X {
  switch (tree.type) {
    case "item":
      return item(tree.item);
    case "section": {
      const children: X[] = [];
      let x = tree.list;
      while (x !== null) {
        children.push(unconvert_tree(x[0], item, list));
        x = x[1];
      }
      return list(tree.tag, children);
    }
  }
}

export function convert<T, I, X>(tree: X, f: converter<T, I, X>): Loc<T, I> {
  return loc(convert_tree(tree, f), { type: "top" });
}

export function unconvert<T, I, X>(
  loc: Loc<T, I>,
  item: (item: I) => X,
  list: (tag: T, children: X[]) => X
): X {
  switch (loc.p.type) {
    case "top":
      return unconvert_tree(loc.t, item, list);
    case "node":
      return unconvert(go_up(loc), item, list);
  }
}

/* */
