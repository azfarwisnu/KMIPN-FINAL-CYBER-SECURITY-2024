const puppeteer = require("puppeteer")
const crypto = require("crypto")

const FLAG = process.env.FLAG || 'KMIPNVIPNJ{yEAH_XSS_w1th_CSP_4nd_html_entities_BYp455}'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'adminUname'
const ADMIN_PASSWORD = FLAG
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
		await page.type("#username", ADMIN_USERNAME + crypto.randomBytes(8).toString('hex'))
		await page.type("#password", ADMIN_PASSWORD)
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

module.exports = check

if (require.main === module) {
	check(SITE)
}
