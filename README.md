# medauth-app-forked
Created with CodeSandbox

## Testing the app in CodeSandbox

1. Open the project in the CodeSandbox web editor.
2. Open the **Tasks** or **Terminal** panel.
3. Start the React dev server:

   ```bash
   yarn start
   ```

4. Open the preview for port `3000`.

Only port `3000` is expected to show the React app. Other ports, such as
`2222` or random high-numbered ports, may be used internally by CodeSandbox or
debug tools. Opening those ports in the browser can show `502 Bad Gateway`, even
when the app itself is working.

If the port `3000` preview shows `502 Bad Gateway`, restart the `start` task or
restart the CodeSandbox VM, then run `yarn start` again.

## Testing the app locally

1. Install dependencies if needed:

   ```bash
   yarn install
   ```

2. Start the local dev server:

   ```bash
   yarn start
   ```

3. Open the app in your browser:

   ```text
   http://localhost:3000
   ```

If you prefer npm, use:

```bash
npm install
npm start
```
