module.exports = {
    browser: process.env.BROWSER ? process.env.BROWSER : 'chromium',
    launch: {
        headless: process.env.HEADLESS ? process.env.HEADLESS : false,
        slowMo: process.env.SLOWMO ? process.env.SLOWMO : 200,
        devtools: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-fullscreen'],
        defaultViewport: null
    }
};
