🎨 1. UI/UX Design System (The Visual Language)
Kyunki ye ek developer-focused social network hai, hum isko "Dark Mode Default" aur sleek rakhenge (Vercel ya GitHub jaisa aesthetic).

A. Color Palette (Tailwind Variables)

Backgrounds (The Canvas): * bg-zinc-950 (Pure dark, for the main page background)

bg-zinc-900 (Slightly lighter, for cards, navbars, and modals)

bg-zinc-800 (For hover states on cards/inputs)

Primary Accent (The Brand Color): * bg-indigo-600 (Main buttons, active links)

hover:bg-indigo-500 (Hover states)

ring-indigo-500 (Focus rings for inputs)

Typography (Text Colors):

text-zinc-50 (Primary text: Headings, Usernames, Post Content)

text-zinc-400 (Secondary text: Timestamps, Subtitles, Placeholders)

Status Colors:

text-emerald-400 (Success messages / Online indicators)

text-red-400 (Error states / Validation messages)

B. Typography

Primary Font: Inter ya system sans-serif (Clean, readable).

Monospace Font: Fira Code ya JetBrains Mono (Dev-vibe ke liye, usernames ya tags ko monospace me dikha sakte ho).

C. Spacing & Geometry

Border Radius: rounded-xl (Sleek, modern curves for cards), rounded-lg (For buttons and inputs).

Borders: Subtle borders using border border-zinc-800 to separate elements without heavy shadows.

🧩 2. Core Component Library (Atomic Design)
In components ko apne frontend mein reusable banana hai.

1. Primary Button:

Classes: w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-500 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none flex justify-center items-center gap-2

2. Input Field:

Classes: w-full bg-zinc-900 border border-zinc-700 text-zinc-50 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors

3. Post Card (Feed Item):

Classes: bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors

4. Navbar:

Classes: sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex justify-between items-center@