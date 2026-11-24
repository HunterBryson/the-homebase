# Memory review

Alex flags blocks in Homebase (the ⚑ button on any block) when a time moved, a reminder changed, or something feels off. When Alex opens a chat or says "memory review":

1. Run `node tools/flags.js` in the Homebase folder to read every open flag—the block, the exact highlighted line, and Alex's note.
2. Rewrite the block directly in place (`schedule/personal-schedule.md`, `schedule/reminders.md`, or whichever file changed) instead of piling notes underneath.
3. Mark the flag done with a short concrete receipt (`node tools/flags.js done <id> "what changed"`).

Alex sees the reply right under their flag, and the changed block glows in Homebase (`DESK.md`) until they open and inspect the diff.
