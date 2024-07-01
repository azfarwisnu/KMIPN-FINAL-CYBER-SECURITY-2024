const net = require('net')
const dns = require('dns/promises')
const check = require('./bot')
const REPORT_HOST = process.env.REPORT_HOST || 'localhost'
const PORT = process.env.PORT || 6565

dns.lookup(REPORT_HOST).then(({ address }) => {
	const server = net.createServer(async socket => {
		if (!socket.remoteAddress.endsWith(address)) {
			socket.end('Bad report host')
			return
		}
		socket.on('data', async data => {
			try {
				const url = data.toString().trim()
				socket.end('URL received')
				socket.destroy()

				if (!url.match(/^https?:\/\//)) {
					console.log(`[-] Invalid URL: ${url}`)
					return;
				}

				console.log(`[+] Received: ${url}`)
				await check(url)
				console.log(`[+] checked: ${url}`)
			} catch (e) {
				console.log(e)
			}
		})
	})
	server.listen(PORT, () => {
		console.log('Bot server listening on port', PORT)
	})
})