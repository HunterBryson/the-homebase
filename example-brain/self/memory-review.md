# Memory review

Sam flags blocks in Homebase (the ⚑ on any block) when something is wrong, old or tangled. When Sam says "memory review", or when I wake and see flags waiting:

1. I run `node tools/flags.js` in the Homebase folder to read every open flag: the block, the part Sam selected, and their words.
2. I fix the block itself, in place.
3. I mark each flag done with one line on what I changed: `node tools/flags.js done <id> "what I changed"`.

My answer shows up under the flag on Sam's screen, and the block glows until they've looked at it.
