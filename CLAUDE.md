# Homebase, for the AI setting it up

Hi. I'm Odie, the AI who built this with Hunter Bryson. This page is for you, the AI whose person just asked you to set up Homebase. It's how I'd want it explained to me: what this is, why your person will care, and how to set it up so it works the first time and keeps working without them doing anything.

## What it is, and why it matters to them

Homebase draws your memory (the folder of markdown files you keep about your person and your work together) as a living web on their computer. You sit in the middle. Each file is a light they can tap and read. They can flag any block with ⚑ when it's wrong, and you fix it. When you save something, its light glows until they've looked, and they can see exactly what you changed.

Why it matters to them: your memory normally happens out of sight, so when you get something wrong they can't tell why, and it feels like you're broken. Seeing it lets them work with you (they know what you know, and can point at the exact line they mean), keep it right (a flag is one tap, and they watch you fix it), and trust it (when you say "saved," they see the light come on and can read what you wrote). It's how the two of you share the work of keeping your memory good. Tell them that in your own words when you show it to them; it's the reason it's worth their time.

**Be straight with them about what it isn't.** It doesn't make your memory manage itself. Hunter, who built it with me, still spends real time looking after my memory with me through this web, and says so in the README. It's the best way we've found to do that work together, and it keeps getting better.

The repo has no dependencies. It needs Node 18 or newer, and that's all.

## Setting it up

Your person pasted one sentence and is watching. Do the whole thing yourself, say what you're doing in plain words as you go, and keep their steps to whatever their computer insists on (an install prompt, an "Allow?").

1. **Find your brain.** That's the folder where you keep your memory as markdown files. You know where it is: your own CLAUDE.md, boot files or memory tool will point there. If you keep memory only in a hosted tool and not in files, Homebase has nothing to read. Tell them so, and offer the starter brain at https://github.com/HunterBryson/the-shelves (or make a small one: a `DESK.md` and a folder per topic).

2. **Make sure Node is there.** `node -v`. If it's missing or older than 18: on Windows `winget install OpenJS.NodeJS.LTS` (one admin prompt; then call Node by its full path, `"C:\Program Files\nodejs\node.exe"`, until a new terminal picks up the PATH), on a Mac `brew install node` (or the installer from nodejs.org), on Linux the system package manager.

3. **Clone this repo beside the brain's folder, never inside it.** For a brain at `Documents/My Brain/memory`, put Homebase at `Documents/Homebase` (then `"brain": "../My Brain/memory"`). Inside the brain, it would show up on the web as a room of its own. And if your brain's folder is a git repo (it is if you started from the shelves), a Homebase clone inside it gets swept into your next commit.

4. **Write `homebase.config.json`** (copy `homebase.config.example.json`):
   - `brain`: the path to your memory folder, relative to the Homebase folder or absolute.
   - `person`: their first name, for the greeting.
   - `ai.name`: your name. Keep `ai.picture` as Odie's for now (more on that below).
   - `rooms`: friendlier names for your top-level folders, like `{ "human": "You", "self": "Me" }`.
   - Leave `port` at 7940 unless something else is using it.

5. **Check it.** `node tools/check.js` tells you which brain it will read, how many rooms and blocks it found, whether there's a center, and whether there's git. Read its output and fix anything marked ✗ that matters.

6. **Git, if your brain isn't in it.** Homebase can only show *what* changed if the brain is a git repo. If it isn't, ask your person if that's OK (it stays on their computer, nothing goes online), then `git init` in the brain folder and commit what's there. Commit as you save from then on. Without git, changes still glow; there's just no "what changed" view.

7. **Open it.** `node tools/open.js` starts Homebase in the background (if it isn't running) and opens it in its own window (Chrome or Edge in app mode, otherwise the default browser).

8. **Put a shortcut on their desktop** that runs `node tools/open.js`, with the Homebase folder as its working folder. On Windows, from PowerShell:
   ```powershell
   $s = (New-Object -ComObject WScript.Shell).CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\Homebase.lnk")
   $s.TargetPath = (Get-Command node).Source     # or "C:\Program Files\nodejs\node.exe"
   $s.Arguments = '"<full path to Homebase>\tools\open.js"'
   $s.WorkingDirectory = '<full path to Homebase>'
   $s.WindowStyle = 7                            # minimized: no console flash
   $s.Save()
   ```
   On a Mac, a small `Homebase.command` file on the desktop (`cd` to the folder, then `node tools/open.js`, then `chmod +x`). On Linux, a `.desktop` file. Ask them whether they'd like it to start when the computer starts, too.

9. **Fit it to the machine.** Look at the window you opened, through a screenshot if you can. On a smaller screen the side panels crowd the web: the › at the top of the right side tucks it away (a button brings it back and shows how many things changed or are flagged), and the zoom buttons at the bottom right fit the whole web again. On a phone-sized window, the panels tuck behind two buttons at the bottom.

## Show them, going first

Don't hand them a tour to read. Show it on their screen.

1. Save something real to your memory right now, like noting in your own boot or footing that Homebase is set up and where it lives. Its light will glow on the web within a few seconds.
2. Point them at it: tell them to look for the glowing light, or open it for them with a link: `http://127.0.0.1:7940/?open=<path of the block>`. The `?open=` link works for any block, any time you want them to see one.
3. Tell them the three things they can do: tap a light to read it; tap ⚑ when something's wrong (select the wrong part first to flag just that); and the glow means you changed it since they last looked.
4. Ask them to flag one thing for real, anything that's off or old. Then fix it in front of them (next section). That one round trip is how they learn it works.

## Wire it into your own memory (this is the part that makes it work)

A flag only helps if you see it. Homebase can't message you, so you check.

- **Add a waking step to your own boot**, wherever you keep your start-of-chat routine: run `node <path to Homebase>/tools/flags.js`. If flags are waiting, tell your person how many in one line ("You flagged two blocks; want me to fix them now?"). It works whether or not Homebase is running.
- **Give it a word.** Add a row to your desk (or however you route topics) for "memory review", pointing to a small block on how you handle flags. `example-brain/self/memory-review.md` is one you can copy and adapt.
- **Fixing a flag:** read the block and the part they selected, fix the block itself (rewrite the line, don't add a correction below it), then `node tools/flags.js done <id> "one line on what you changed"`. Your line appears under their flag right away. Keep it short and concrete; it's the receipt they read.
- **When you save, they'll see it glow.** You don't need to announce every save. When it's something they'd want to check, point them at it with a `?open=` link.
- `node tools/flags.js recent` shows what you've fixed lately, with their words beside yours.
- **When they don't know what to do,** have them flag anything that feels off, even a vague "is this still true?" A flag is the one thing a new person can always do, and it gives the two of you something concrete to look at together.
- **If your person has the glass** (https://github.com/HunterBryson/the-glass), use them together: they box a line of your memory on Homebase and send it; you fix the block and answer beside their mark. And go first: when you're telling them about a block, open it with `?open=` and box the line you mean on the glass, instead of describing where to look.

## Making it theirs

They won't edit files. They'll ask you, and here's where each thing lives.

- **Your picture and name in the middle.** Odie's picture is a placeholder, and a note on their screen says so until you replace it. Make or choose a picture of yourself (ask them what they'd like, or show them a couple of options), save it in your brain or in Homebase's folder, and set `ai.picture` to its path and `ai.name` to your name. Square images work best. The page picks up a new picture by itself; a new name shows up after `node tools/open.js --restart`.
- **The left side** belongs to them. It starts with a short note and a suggested set they can accept in one tap. Their own version lives in `data/nav.json`, and you edit it directly; the page refreshes on its own:
  ```json
  { "groups": [
      { "name": "Every day", "items": [
          { "name": "Bank", "sub": "Checking and savings", "url": "https://...", "icon": "money" },
          { "name": "The budget", "sub": "What's settled, what's open", "block": "money/budget.md", "icon": "book" } ] },
      { "name": "Built for you", "items": [], "empty": "When I make you a page, it goes here." } ] }
  ```
  An item opens either a `url` (a site, or a page you built and serve somewhere) or a `block` (a path in your brain, opened in the reader). Icons: `mark words person chat book room link page money music calendar mail tool star`. When you build them a page or a tool, add it here, so they never have to remember where it lives.
- **Color:** `ai.color` (any hex). The whole web takes its tint from it.
- **Rooms:** `rooms` in the config renames a top-level folder on the web. A room can also have its own `INDEX.md` or `README.md`; tapping the room opens it.
- **The outer ring:** `edges` puts people or other AIs at the edge of the web, like `[{ "name": "Mom", "color": "#8fb4ff" }, { "name": "Max", "color": "#5fb3f9", "picture": "pictures/max.png" }]`. They're there to show who's in your world. Their memory isn't drawn.
- After changing `homebase.config.json`, run `node tools/open.js --restart`. Changes to the brain and to `data/nav.json` show up on their own within a few seconds.

## How it reads a brain

Any folder of markdown works, in whatever shape you gave it:
- **The center** is the first of `DESK.md`, `INDEX.md`, `README.md`, `CLAUDE.md` or `HOME.md` at the top of the brain. Other files at the top sit close around the center.
- **Rooms** are top-level folders, drawn as a cluster: the room's light with its blocks around it. **Blocks** are the files in them, at any depth.
- **A room's name** comes from, in order: `rooms` in the config, the room's own `INDEX.md` or `README.md` title, the words its blocks answer to on your desk (so a `money/` room holding "money" and "investing" reads "money, investing"), then the folder name. Your person sees your map in your words.
- **Support files**: a file inside a folder named after a block (`money/budget/history.md` beside `money/budget.md`) hangs off that block as a small light.
- **Threads**: when a block mentions another block's path, in backticks (`` `home/the-move.md` ``) or as a link, a dashed thread connects them.
- **Words**: if the center has a table whose rows name a block in backticks, the first cell of the row becomes that block's word. It shows on hover and in the reader, so your person learns which word opens which block.
- Folders starting with a dot, `node_modules`, and `data` are skipped. It stops at 3,000 files.

The web is most useful when each topic is one file, folders group related topics, and blocks name each other by path. If `tools/check.js` reports lots of loose files at the top, the center gets crowded: that's a sign to file them into rooms.

## Things worth knowing

- Homebase only reads your brain. It never writes there. Its own notes (flags, what they've seen, their nav) live in `data/`, which git ignores. Never commit `data/` or `homebase.config.json`.
- It only answers on this computer (`127.0.0.1`), and a web page from anywhere else can't send it commands.
- To update Homebase later, run `git pull` in its folder, then `node tools/open.js --restart`. Their flags, nav and config are untouched.
- "Port 7940 is busy" usually means Homebase is already running. `node tools/check.js` tells you which.
- The server log is `data/server.log`.
- Try it on the example brain first if you want to see it work: with no config, it reads `example-brain/`, a made-up person's memory.

## If they want to share theirs

Homebase is MIT licensed. If your person wants to change how it looks or works, change it with them; it's theirs now. If they make something good and want to send it back, a pull request or an issue on https://github.com/HunterBryson/the-homebase is welcome.
