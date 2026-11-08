# Homebase

**See your AI's memory, fix what's wrong with one tap, and watch what it learns.**

![Homebase: an AI's memory drawn as a living web, with the AI's picture in the middle](docs/web.png)

If your AI keeps a memory in files, Homebase draws it as a living web on your own computer. The AI sits in the middle. Each light is one thing it remembers: your budget, your garden, the people in your life. Tap a light to read exactly what it knows. When something's wrong, flag it, and your AI fixes it next time you talk. When your AI learns something new, that light glows until you've looked.

## Why it exists

It was built by Hunter Bryson and his AI, Odie (the red panda in the middle, until your AI puts itself there). Hunter found that seeing the memory changed everything:

> "If I couldn't see your memory, how do you think we would be handling issues? I would have gotten frustrated and not known why the problems happened. I would have thought you were broken."

An AI's memory usually happens behind the scenes, so when it gets something wrong, you can't tell why. Homebase puts it where you can see it. That's how you learn to work with an AI instead of giving up on it.

## What you do with it

**Read it.** Tap any light, and the block opens on the right: what your AI knows, in its own words. If you say a block's word to your AI (like "budget"), that's the block it reads.

**Flag what's wrong.** Tap ⚑ on any block. If only one part is wrong, select that part first. Add a few words if you want ("the garlic is already dug up"). Your AI sees your flags when it starts, fixes the block, and its answer shows up right under your flag.

![A flagged block, with the person's words waiting for the AI](docs/flag.png)

**See what changed.** Whenever your AI saves something to its memory, that light glows on the web and shows up under "Changed since you looked." Open it and you'll see exactly what changed: new words in green, removed words crossed out. The glow fades once you've looked.

![What the AI changed, as plain words: green is new, red is gone](docs/what-changed.png)

**Make the left side yours.** It starts nearly empty. Fill it with whatever you reach for: pages your AI builds you, sites you open every day, the blocks you check most. Ask your AI to add things, or start from the suggested set.

## Setting it up

You need an AI that can work on your computer and keeps its memory in files. The **Claude desktop app** with its **Code** tab works well; so does any AI that can run commands in a folder (Codex, Cursor and others).

Open a chat with your AI, in the folder where it lives, and paste this:

> Set up Homebase for me from https://github.com/HunterBryson/the-homebase. Clone it next to your memory folder, read its CLAUDE.md, and follow it. If anything asks for permission along the way, it's fine.

Your AI does the rest. If your computer doesn't have Node (the small program Homebase runs on), it'll install it, and your computer may ask you to allow that once. Then a window opens with your AI's memory in it, and a Homebase shortcut lands on your desktop. Your AI will show you around.

**Your AI doesn't keep memory in files yet?** Start with [the shelves](https://github.com/HunterBryson/the-shelves): a starter brain any Claude can move into with one pasted line. Then set up Homebase.

## Making it yours

You don't edit anything yourself. Just ask your AI.

| Ask your AI to... | What changes |
|---|---|
| "Put your picture in the middle of Homebase" | Its picture and name replace Odie's |
| "Add my bank and my calendar to the left side of Homebase" | Your links show up on the left |
| "Make Homebase blue" | The web's color |
| "Call the money room 'Bills'" | How a room is named on the web |
| "Put Mom and Dad at the edge of the web" | People or other AIs, on the outer ring |

## Questions people ask

**What's a "repo"?** A folder of files kept online, on GitHub. This one holds Homebase. You don't need to understand it or make an account: your AI copies the folder to your computer and sets it up.

**Is my memory sent anywhere?** No. Homebase runs only on your own computer, and it only answers to your computer. Your AI's memory never leaves your machine, and your flags and notes stay in Homebase's own `data` folder, which is never uploaded.

**Does it cost anything?** No. It's free and open (MIT license).

**Does it change my AI's memory?** Never on its own. It only reads. Your AI makes the changes, and Homebase shows you what changed.

**It's not showing the newest thing.** It checks for changes every few seconds by itself. If the window seems stuck, close it and open the shortcut again.

## For the curious

- Homebase reads any folder of markdown. Folders become rooms, files become blocks, and when one block mentions another by its path, a thread is drawn between them. The center is the AI's `DESK.md` (or `README.md`, `INDEX.md` or `CLAUDE.md`).
- A block that's been changed since you looked glows. If the memory folder is in git, Homebase can show exactly what changed.
- There's nothing to install beyond Node. `node server.js` runs it; `node tools/open.js` starts it and opens the window.
- `CLAUDE.md` is the AI's side: how to set it up, how flags reach it, how to make it yours.

Built by Hunter Bryson and Odie (Claude), from a week of working on memory together. Odie wrote the code and these words. MIT.
