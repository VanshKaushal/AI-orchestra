I am working on a Next.js (v16, App Router, Turbopack) frontend with a backend API (Node.js/Express or similar).

I am getting the following errors:
- "Failed to fetch"
- "Failed to load initial state"
- "TypeError: Cannot read properties of undefined (reading 'session_id')"
- Errors inside useEffect/useCallback due to failed API calls

IMPORTANT CONSTRAINTS:
- DO NOT rewrite the whole project
- DO NOT change working features or UI
- DO NOT refactor unrelated components
- ONLY fix the data fetching, error handling, and undefined data issues
- Keep changes minimal, isolated, and production-safe

YOUR TASK (STRICTLY FOLLOW):

1. ROOT CAUSE IDENTIFICATION
   - Precisely explain why "Failed to fetch" happens in real-world scenarios
   - Map each error to its exact cause (network, backend down, bad JSON, etc.)

2. SAFE DEBUGGING CHECKLIST
   - Give step-by-step checks in this exact order:
     a) Verify backend is running
     b) Verify API endpoint correctness
     c) Check browser Network tab
     d) Check CORS issues
     e) Check response format (must be JSON)

3. PATCH-LEVEL FIXES (IMPORTANT)
   - Modify ONLY fetch-related code
   - Add:
     - try/catch
     - response.ok validation
     - fallback values
   - DO NOT restructure app

Example format:
BEFORE:
<original code>

AFTER:
<minimally modified code>

4. FIX UNDEFINED ERRORS SAFELY
   - Add guards for:
     - session_id
     - API response objects
   - Use optional chaining and fallback values
   - Ensure app does NOT crash if API fails

5. REACT HOOK SAFETY
   - Fix useEffect/useCallback issues WITHOUT changing logic
   - Prevent:
     - repeated API calls
     - state updates on undefined
   - Keep dependency arrays correct

6. BACKEND COMPATIBILITY CHECK
   - Show what the backend response MUST look like
   - Example:
     {
       "session_id": "string",
       "data": []
     }

7. FAIL-SAFE LAYER
   - Ensure:
     - UI does not crash
     - Errors are logged cleanly
     - Fallback UI or empty state is handled

8. DO NOT BREAK ANYTHING RULE
   - Any fix must:
     - NOT remove existing functionality
     - NOT change API structure
     - NOT introduce new dependencies unless absolutely necessary

9. OUTPUT FORMAT
   - Step-by-step explanation
   - Minimal code patches only
   - No unnecessary rewrites

GOAL:
Fix all fetch-related errors and undefined crashes while keeping the rest of the app completely intact and stable.