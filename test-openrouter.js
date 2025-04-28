require('dotenv').config();

async function testOpenRouter() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VITE_APP_URI || 'http://localhost:4242',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-opus',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testOpenRouter();
