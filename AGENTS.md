# Custom Agent Instructions

The user has established the following permanent rules for this project:

1. **Discuss Before Commit:** 
If the user requests a significant feature, architectural change, or integration (especially ones relating to local vs. cloud services, platform limitations like iOS, or complex overhauls), you **MUST** discuss the plan, potential limitations, and proposed implementations with the user *before* making the code changes. Wait for their confirmation before writing the code.

2. **Auto-Increment Application Version:**
Every time you make an update to the app's code or add a feature in a turn, you **MUST** increment the version number displayed in the GUI. 
Currently, this is located in `src/components/Sidebar.tsx` (e.g., `<span className="font-sans text-[10px] text-white/40 font-normal">v1.6</span>`). Increase it by 1 count (e.g., from v1.6 to v1.7) on each update.
