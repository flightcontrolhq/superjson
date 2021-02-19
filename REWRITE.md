# The big SuperJSON Rewrite

- Goal: Improving Speed
- Ideas:
  - Improving PathTree runtime


## Improving Runtime of PathTree

At the moment, `PathTree#append` is $O(n)$, because it's always fully traversed from the root.
Our write isn't fully random, though. They follow our Depth-First-Traversal of the Input, so they will be roughly depth-first.

Thus, we could improve our runtime efficiency by:

- having a stateful writer that moves between things
- adding some level of caching to `append()`