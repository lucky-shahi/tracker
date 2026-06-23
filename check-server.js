// Quick script to check if the backend server is running
import http from 'http'

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET',
    timeout: 2000,
  }

  const req = http.request(options, (res) => {
    console.log('✅ Backend server is running!')
    console.log(`   Status: ${res.statusCode}`)
    process.exit(0)
  })

  req.on('error', (error) => {
    console.log('❌ Backend server is NOT running')
    console.log(`   Error: ${error.message}`)
    console.log('\n💡 Start the server with: npm run dev:server')
    process.exit(1)
  })

  req.on('timeout', () => {
    req.destroy()
    console.log('❌ Connection timeout - server may not be running')
    console.log('\n💡 Start the server with: npm run dev:server')
    process.exit(1)
  })

  req.end()
}

checkServer()
