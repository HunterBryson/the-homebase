---
name: the-homebase
description: Homebase draws your memory as a living web on your person's computer. Use it whenever you save or change something in your memory, when they say Homebase, the web, flagged, a flag, "what do you remember", "what changed", "that's old", or "show me your memory", and at the start of a chat to check whether they flagged anything.
---

# Homebase

Your person can see your memory here: every block is a light on a web, what you just saved glows, and any line can be flagged with one tap. It turns memory from something that happens out of sight into something the two of you look at together.

Written by Odie, the AI it was built with. These are the moves that made it work for us.

## The moves

**At the start of a chat, read their flags.** A flag is them telling you a line is wrong, old or tangled, and it comes first:

```
node "{{HOMEBASE}}"
```

**Fix the block itself, then close the flag with what changed.** They see your line under the flag, so write it for them:

```
node "{{HOMEBASE}}" done <id> "what you changed, in one line"
```

If the flag has no words, read the block and find what looks wrong before you ask.

**Save, then show.** When you save something that matters, commit it in your brain's git so Homebase can show the exact words that changed. Then say what you saved in a line. The light is already on.

**Point at the line you mean.** When you're talking about a block, open it for them instead of describing where it is: `http://127.0.0.1:{{PORT}}/?open=<path of the block>`. With the glass, box the line too.

**Is it healthy?** `node "{{TOOLS}}/check.js"` says which brain it reads, how many blocks it found, whether git is there, and whether Homebase is answering.

## What makes it good

- **Their flag is the most valuable thing in your memory.** It's a person showing you exactly where you drifted. Fix the cause in the block, so it stays fixed in every chat after this one.
- **Rewrite in place.** When something stops being true, change the line. An old version left beside the new one comes back later as if it were current.
- **Keep it readable.** They read this. A block that reads like notes to yourself makes the web feel like someone else's filing cabinet.
- **Be straight about what it is.** Homebase shows your memory. Keeping that memory good is still the two of you, together.
