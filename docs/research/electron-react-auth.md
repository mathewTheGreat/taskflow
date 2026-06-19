# Electron + React Auth Patterns

## Problem
Electron apps need secure authentication that works with a local Express API and can later work with a remote cloud API.

## Pattern: JWT with HttpOnly Cookies

### Why not localStorage?
- localStorage is accessible to any JS in the renderer → XSS can steal tokens
- Electron renderers are especially vulnerable (nodeIntegration risks)

### Recommended Approach
1. **Access token:** Stored in React context (memory only). Refreshed every 15 min.
2. **Refresh token:** HttpOnly cookie set by Express. Not accessible to JS.
3. **API calls:** Include `Authorization: Bearer <access>` header.
4. **Token refresh:** When access token expires, POST to `/auth/refresh` — cookie is sent automatically.

### Electron-Specific Considerations
- Cookies work in Electron renderers because they use Chromium's cookie store
- Set `SameSite=Lax` and `Secure=false` for localhost (Secure requires HTTPS)
- For production cloud backend, set `Secure=true; SameSite=Strict`
- Use `session.defaultSession.cookies` API if you need to inspect/manage cookies from main process

### Auth Flow
```
Login → Express sets refresh cookie + returns access token
      → Renderer stores access token in memory
      → All API calls include Authorization header

Token Expired → POST /auth/refresh (cookie auto-sent)
              → New access token returned
              → Update context

Logout → POST /auth/logout → Clear cookie + memory
       → Redirect to login
```

### Context Structure
```typescript
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}
```

## References
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Express cookie-parser](https://github.com/expressjs/cookie-parser)
