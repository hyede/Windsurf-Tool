// Cloudflare Workers 反向代理脚本
// 用于国内访问 Firebase API
// 部署到 Cloudflare Workers 后，将 URL 配置到 firebaseApiEndpoint

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // 解析请求体
    const body = await request.json()
    const { grant_type, refresh_token, api_key } = body

    // 构建 Firebase API 请求
    const firebaseUrl = `https://securetoken.googleapis.com/v1/token?key=${api_key}`
    
    const formData = new URLSearchParams()
    formData.append('grant_type', grant_type)
    formData.append('refresh_token', refresh_token)

    // 转发请求到 Firebase
    const response = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'x-client-version': 'Chrome/JsCore/11.0.0/FirebaseCore-web'
      },
      body: formData.toString()
    })

    // 返回响应
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
