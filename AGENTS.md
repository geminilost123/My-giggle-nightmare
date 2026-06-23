# Custom Agent Instructions

The user has established the following permanent rules for this project:

1. **Discuss Before Commit & Magic Phrase Execution:** 
You MUST NEVER write, edit, or execute code modifications unless the user explicitly uses the exact phrase: "execute the plan". If this phrase is missing, you must only plan, research, and discuss. Do not apologize when corrected, and stay purely functional.

2. **Auto-Increment Application Version:**
Every time you make an update to the app's code or add a feature in a turn, you **MUST** increment the version number displayed in the GUI. 
Currently, this is located in `src/components/Sidebar.tsx` (e.g., `<span className="font-sans text-[10px] text-white/40 font-normal">v1.6</span>`). Increase it by 1 count (e.g., from v1.6 to v1.7) on each update.
