const os = require('os')
const fs = require('fs-extra')
const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');
const { chromeExecPath, firefoxExecPath, firefoxFingerprintPath, chromeFingerprintPath, getRandomPort, sleep } = require("./helpers")

const GENLOGIN_API_BASE_URL = 'http://localhost:55555'

const axiosIns = axios.create({
    baseURL: GENLOGIN_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

const defaultOptions = {
    remoteDebuggingPort: 0,
    profile_id: null,
    isSandbox: true,
    tmpdir: null,
}

const BROWSER_TYPES = {
    CHROME: 'Chrome',
    FIREFOX: 'Firefox',
    OPERA: 'Opera',
}

class GenLogin {
    constructor(options = defaultOptions) {
        this.tmpdir = os.tmpdir()
        this.chromeExecPath = chromeExecPath
        this.firefoxExecPath = firefoxExecPath

        this.profile_id = options.profile_id;
        this.remoteDebuggingPort = options.remoteDebuggingPort || 0;
        this.isSandbox = options.isSandbox
        this.pid = null

        if (options.tmpdir) {
            this.tmpdir = options.tmpdir;
            fs.ensureDirSync(this.tmpdir, { recursive: true })
        }
    }

    async getProfilePath() {
        const profilePath = path.resolve(this.tmpdir, `genlogin_profile_${this.profile_id}`)
        await fs.ensureDir(profilePath)
        return profilePath
    }

    async clearProfileFiles() {
        const profilePath = await this.getProfilePath()
        await fs.rm(profilePath, { recursive: true, force: true })
    }

    async getRemoteDebuggingPort() {
        return this.remoteDebuggingPort || await getRandomPort()
    }

    async stopProfile() {
        if (!this.profile_id) throw Error('Profile id not found')
        await axiosIns.get(`profiles/${this.profile_id}/stop`)

        await sleep(2000);
        await this.clearProfileFiles()
    }

    async startProfile() {
        if (!this.profile_id) throw Error('Profile id not found')
        try {
            const response = await axiosIns.get(`profiles/${this.profile_id}/start`)
            const { success, data } = response.data;
            if (success) {
                const remoteDebuggingPort = this.getRemoteDebuggingPort()
                const profileDir = await this.getProfilePath()
                const { profile_data, expires_at, checksum } = data
                const { browser } = JSON.parse(profile_data)
                const browserExecPath = browser === BROWSER_TYPES.CHROME ? chromeExecPath : firefoxExecPath
                const fingerprintExecPath = browser === BROWSER_TYPES.CHROME ? chromeFingerprintPath : firefoxFingerprintPath
                let wsEndpoint = '';

                const processStart = () => {
                    return new Promise((resolve, reject) => {
                        const profileProcess = spawn(
                            fingerprintExecPath,
                            [browserExecPath, profile_data, expires_at, checksum, profileDir, remoteDebuggingPort.toString()],
                            {
                                detached: true,
                            },
                        )
                        profileProcess.unref()
                        this.pid = profileProcess.pid

                        profileProcess.stdout.on('data', (data) => {
                            if (data.includes('wsEndpoint'))
                                wsEndpoint = data.toString().split('wsEndpoint ').pop().trim()

                            resolve({
                                success: true,
                                ...(wsEndpoint ? { wsEndpoint } : {}),
                            })
                        })
                    })
                }

                return await processStart()
            } else {
            }

        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = GenLogin
