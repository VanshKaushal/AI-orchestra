I have a full-stack application:

- Frontend: Next.js (App Router)
- Backend: Node.js/Express (REST API)
- Communication: fetch()

I am facing issues like:
- "Failed to fetch"
- API calls failing
- Undefined data errors (e.g., session_id)
- Inconsistent frontend-backend behavior

Your task is to act as a senior full-stack system auditor and perform a COMPLETE END-TO-END VERIFICATION.

DO NOT skip any step. DO NOT assume anything works.

---

# 🔍 PHASE 1: BACKEND VERIFICATION (ISOLATED)

1. Check if backend server is running
   - Verify process is active
   - Confirm port (e.g., 5000)

2. Test backend independently (NO frontend)
   - Open browser/Postman:
     http://localhost:<port>

3. Verify ALL API endpoints:
   - GET /sessions
   - POST /sessions
   - POST /message
   - Any other used endpoint

4. For each endpoint:
   - Does it exist? (404 check)
   - Does it return valid JSON?
   - Does it return correct status codes?

5. Validate response format:
   REQUIRED STRUCTURE:
   {
     "success": true,
     "data": {...},
     "error": null
   }

6. Check backend logs:
   - Are requests reaching server?
   - Any runtime errors?

7. Check CORS:
   - Is frontend origin allowed?
   - Is cors() middleware enabled?

---

# 🌐 PHASE 2: NETWORK & CONNECTION CHECK

1. Verify API base URL used in frontend
   - Check environment variables
   - Example:
     NEXT_PUBLIC_API_URL

2. Test API manually in browser:
   - Paste exact URL used in fetch()

3. Open browser DevTools → Network tab:
   For each request:
   - Status code (200, 404, 500, blocked)
   - Request URL correctness
   - Response payload
   - CORS errors

4. Check protocol mismatch:
   - frontend: https vs backend: http

5. Check port mismatch

---

# ⚛️ PHASE 3: FRONTEND FETCH LAYER

1. Locate ALL fetch() calls

2. For each fetch:
   VERIFY:
   - Correct URL
   - Correct method (GET/POST)
   - Headers (Content-Type, auth)
   - Body format (JSON.stringify)

3. Ensure SAFE FETCH PATTERN:

   try {
     const res = await fetch(url);

     if (!res.ok) {
       throw new Error("API failed");
     }

     const data = await res.json();
   } catch (err) {
     console.error(err);
   }

4. Check:
   - No direct access like data.session_id without validation
   - Use optional chaining or guards

---

# 🔄 PHASE 4: DATA CONTRACT VALIDATION

1. Match frontend expectations vs backend response

Example mismatch:
Frontend expects:
  data.session_id

Backend sends:
  data.id

2. Ensure:
   - Same field names
   - Same nesting structure

3. Verify required fields always exist

---

# ⚛️ PHASE 5: REACT STATE & HOOKS

1. Check useEffect:
   - Does it trigger infinite calls?
   - Correct dependency array?

2. Check:
   - API calls inside useEffect
   - State updates only after valid data

3. Prevent:
   - state updates on undefined
   - multiple repeated fetch calls

---

# 🧱 PHASE 6: ERROR HANDLING SYSTEM

1. Ensure:
   - All API calls wrapped in try/catch
   - Errors logged clearly

2. UI must:
   - Not crash
   - Show fallback (loading / error)

---

# 🧪 PHASE 7: FULL FLOW TESTING

Test complete flow:

1. Load app
2. Fetch sessions
3. Create session
4. Send message
5. Load graph/state

At each step:
- Check Network tab
- Check console
- Check UI

---

# 🚨 PHASE 8: ROOT CAUSE IDENTIFICATION

For every failure:
- Identify EXACT failing layer:
  - Backend down?
  - Wrong endpoint?
  - CORS?
  - Bad response?
  - Frontend misuse?

Map error → root cause → fix

---

# 🧨 PHASE 9: OUTPUT REQUIREMENTS

Provide:

1. List of ALL issues found
2. Exact root cause of each issue
3. Minimal fixes (no rewrites)
4. Corrected fetch examples
5. Correct backend response format
6. Final verification checklist

---

GOAL:
Ensure full-stack system works perfectly:
- Backend responds correctly
- Frontend calls correctly
- Data flows correctly
- No "Failed to fetch"
- No undefined crashes