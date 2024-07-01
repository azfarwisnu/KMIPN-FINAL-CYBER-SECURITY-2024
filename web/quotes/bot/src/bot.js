const puppeteer = require("puppeteer")
const crypto = require("crypto")

const COOKIE = process.env.COOKIE //|| 'eyJ6IkpXVCJ9eyJzdWIiOiIxMjM0NTmFF0IjoxNTE2MjM5MDIyfQfTLzlcxdQtXWTitKMfuBMM5KfOmw'
const UsernameAdmin = process.env.UsernameAdmin || 'adminUname'
const CookieAdmin = COOKIE
const SITE = process.env.SITE || 'http://localhost:8687'

const sleep = async s => new Promise(resolve => setTimeout(resolve, 1000 * s))

const check = async url => {
	let browser
	try {
		url = new URL(url)
		browser = await puppeteer.launch({
			headless: true,
			args: ["--disable-gpu", "--no-sandbox"],
			executablePath: "/usr/bin/chromium-browser",
		});
		const context = await browser.createIncognitoBrowserContext()
		const page = await context.newPage()

		await page.goto(SITE)
		await sleep(2)
		await page.type("#username", UsernameAdmin + crypto.randomBytes(8).toString('hex'))
		await page.type("#password", CookieAdmin)
		await page.click("#login");
		await sleep(2);
		await page.goto(url, { timeout: 10000 });
		await sleep(10);

		await browser.close()
	} catch (e) {
		console.log(e)
	} finally {
		if (browser) await browser.close()
	}

}

// module.exports = { COOKIE, check }; debug
module.exports = check
if (require.main === module) {
	check(SITE)
}
