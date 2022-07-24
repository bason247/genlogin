
const os = require('os')
const path = require('path')
const userHomeDir = os.homedir()
const localAppData = path.resolve(process.env.LOCALAPPDATA)

const firefoxExecPath = path.resolve(userHomeDir, '.genlogin/nightly/firefox/firefox.exe')
const chromeExecPath = path.resolve(localAppData, 'GenBrowser/Application/chrome.exe')

const firefoxFingerprintPath = path.resolve(userHomeDir, '.genlogin/fp-firefox.exe')
const chromeFingerprintPath = path.resolve(userHomeDir, '.genlogin/fp-chrome.exe')

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const checkPortAvailable = async (port) => {
    try {
        const { stdout } = await exec(`lsof -i:${port}`);
        if (stdout && stdout.match(/LISTEN/gmi)) {
            return false;
        }
    } catch (e) { }

    return true;
}

const getRandomPort = async () => {
    const min = 2000
    const max = 50000
    let port = getRandomInt(min, max);
    let portAvailable = checkPortAvailable(port);

    while (!portAvailable) {
        port = getRandomInt(min, max);
        portAvailable = await checkPortAvailable(port);
    }
    return port;
}

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
    firefoxExecPath,
    chromeExecPath,
    firefoxFingerprintPath,
    chromeFingerprintPath,
    getRandomPort,
    sleep
}
