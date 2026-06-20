const fetch = globalThis.fetch ?? require('node-fetch')

async function main() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug User',
        email: 'debug-user+test2@example.com',
        password: 'Password123!',
        company: 'DebugCorp',
      }),
    })

    const text = await response.text()
    console.log('status', response.status)
    console.log('headers', Object.fromEntries(response.headers.entries()))
    console.log('body', text)
  } catch (error) {
    console.error(error)
  }
}

main()
