# Getting started
```bash
npm i https://github.com/genlogin/genlogin
```

# Example

```js
const puppeteer = require('puppeteer-core')
const GenLogin = require('genlogin')

const main = async () => {
    try {
        const genLogin = new GenLogin({
            profile_id: 10061,
        })

        const { wsEndpoint } = await genLogin.startProfile()
        const browser = await puppeteer.connect({
            browserWSEndpoint: wsEndpoint.toString(),
            ignoreHTTPSErrors: true,
            defaultViewport: null,
        })

        const page = await browser.newPage()
        await page.goto('https://getip.pro')
        await page.waitForTimeout(5000)
        await browser.close()
        await genLogin.stopProfile()
    } catch (error) {
        console.log(error)
    }
}

main()
```
