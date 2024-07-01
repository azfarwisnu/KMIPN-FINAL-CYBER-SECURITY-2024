const express = require('express')
const eta = require('eta')
const app = express()
const sqlite3 = require('sqlite3')
const session = require('express-session')
const crypto = require('crypto')
const fileUpload = require('express-fileupload')
const net = require('net')
const bodyParser = require('body-parser')
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const createDOMPurify = require('dompurify');
const util = require('util')

// Initialize DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// reCAPTCHA
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
const Recaptcha = require('express-recaptcha').RecaptchaV2
const recaptcha = new Recaptcha(RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY)

const BOT_HOST = process.env.BOT_HOST || 'localhost'
const BOT_PORT = process.env.BOT_PORT || 6565
const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 8687

app.engine("eta", eta.renderFile)
eta.configure({ views: "./views", cache: false })
app.set("views", "./views")
app.set("view cache", false)
app.set("view engine", "eta")

const db = new sqlite3.Database(':memory:')
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY, 
        username TEXT, 
        password TEXT, 
        sticker TEXT DEFAULT 'stickers/defaultsticker.png',
        about TEXT DEFAULT '<h5>Misii puhhh!</h5>\nTest<span style="color: red;">new</span> guide.'
    )`);
})

app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff")
    res.set("X-Frame-Options", "DENY")
    res.set("X-XSS-Protection", "1; mode=block")
    const nonce = crypto.randomBytes(32).toString('hex')
    res.nonce = nonce
    res.set("Content-Security-Policy",
        `\
    default-src 'none'; \
    script-src 'nonce-${nonce}' https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js https://*.clarity.ms https://c.bing.com https://w3c.github.io/trusted-types/ https://*.google.com https://*.googletagmanager.com https://*.gstatic.com https://cdnjs.cloudflare.com/ajax/libs/dompurify/; \
    style-src https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css 'unsafe-inline'; \
    connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com ; \
    img-src 'self' blob: data: https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com ; \
    frame-src https://*.google.com https://*.gstatic.com ; \
    base-uri 'none' ; \
    require-trusted-types-for 'script' ; \
    trusted-types default dompurify recaptcha goog#html ; \
    `);
    next()
})

app.use(express.static('public'))

app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
}))

app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: true,
        httpOnly: true,
        maxAge: 86400 * 1000
    }
}))

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    if (req.session.username) {
        return res.redirect("/quotes")
    }
    return res.redirect("/login")
})

app.get("/login", (req, res) => {
    return res.render("login", { nonce: res.nonce })
})

app.post("/api/login", (req, res) => {
    const { username, password } = req.body
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ success: false, message: "NO!" })
    }
    db.get("SELECT username, password FROM Users WHERE username = ?", username,
        (err, row) => {
            if (err)
                return res.status(500).json({ success: false, message: "Server Error" })
            if (row && row.password === password) {
                req.session.username = username
                return res.json({ success: true, message: "Logged in" })
            }
            if (row) {
                return res.status(401).json({ success: false, message: "Sorry Wrong password" })
            } else {
                // register
                db.run("INSERT INTO Users (username, password) VALUES (?, ?)", username, password, (err) => {
                    if (err)
                        return res.status(500).json({ success: false, message: "Server Error" })
                    req.session.username = username
                    return res.json({ success: true, message: "Register succeed" })
                })
            }

        })
})

app.get("/quotes", (req, res) => {
    if (!req.session.username)
        return res.redirect("/login")
    res.render("quotes", { nonce: res.nonce, RECAPTCHA_SITE_KEY })
})

app.get("/api/quotes", (req, res) => {
    if (!req.session.username)
        return res.status(401).json({ success: false, message: "Unauthorized" })
    db.get("SELECT * FROM Users WHERE username = ?", req.session.username, (err, row) => {
        if (err)
            return res.status(500).json({ success: false, message: "Server error" })
        if (!row)
            return res.status(404).json({ success: false, message: "404 - Not found" })
        return res.json({ success: true, data: row })
    })
})


const sanitizeSvgContent = (svgContent) => {
    if (/[<>]/.test(svgContent)) {
        return svgContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } else if (/&lt;|&gt;/i.test(svgContent)) {
        return svgContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    } else {
        return DOMPurify.sanitize(svgContent);
    }
}


app.put("/api/quotes", (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updateQuotes = () => {
        if (typeof req.body.about !== 'string') {
            return res.status(400).json({ success: false, message: "NO!" });
        }
        db.run("UPDATE Users SET about = ? WHERE username = ?", req.body.about, req.session.username, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Server error" });
            }
            return res.json({ success: true });
        });
    };

    const allowMimes = ['image/webp', 'image/jpeg', 'image/gif', 'image/png', 'image/svg+xml'];
    const allowExtentions = ['webp', 'jpg', 'jpeg', 'gif', 'png', 'svg'];

    if (req.files && req.files.sticker) {
        const ext = req.files.sticker.name.split('.').pop();
        if (allowMimes.indexOf(req.files.sticker.mimetype) === -1 || allowExtentions.indexOf(ext) === -1) {
            return res.status(400).json({ success: false, message: "Only WEBP, JPG, JPEG, GIF, PNG, SVG" });
        }

        const filename = req.files.sticker.md5 + '.' + ext;
        req.files.sticker.mv(`public/stickers/${filename}`, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "cannot move sticker to public dir" });
            }

            if (ext === 'svg') {
                fs.readFile(`public/stickers/${filename}`, 'utf8', (err, data) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: "Server Error: cannot read SVG file" });
                    }
                    let sanitizedSVG = data;
                    console.log(sanitizedSVG)

                    if (!sanitizedSVG.startsWith('<svg')) {
                        return res.status(400).json({ success: false, message: "Invalid SVG content." });
                    }
                    if (!sanitizedSVG.includes('xmlns="http://www.w3.org/2000/svg"')) {
                        sanitizedSVG = sanitizedSVG.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                    }

                    const svgMatch = sanitizedSVG.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
                    if (svgMatch && svgMatch[1]) {
                        const innerSvg = svgMatch[1];
                        console.log(innerSvg);
                        let sanitizedContent = sanitizeSvgContent(innerSvg);
                        console.log(sanitizedContent)
                    contentclear=sanitizedContent}

                    const svgCloseTagIndex = sanitizedSVG.lastIndexOf('</svg>');
                    if (svgCloseTagIndex !== -1) {
                        sanitizedSVG = sanitizedSVG.slice(0, svgCloseTagIndex) + contentclear + sanitizedSVG.slice(svgCloseTagIndex);
                    }
                    console.log(sanitizedSVG)
                    fs.writeFile(`public/stickers/${filename}`, sanitizedSVG, (err) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: "Server Error: cannot write sanitized SVG file" });
                        }

                        db.run("UPDATE Users SET sticker = ? WHERE username = ?", `stickers/${filename}`, req.session.username, (err) => {
                            if (err) {
                                return res.status(500).json({ success: false, message: "Server Error: cannot update sticker path" });
                            }
                            updateQuotes();
                        });
                    });
                });
            } else {
                db.run("UPDATE Users SET sticker = ? WHERE username = ?", `stickers/${filename}`, req.session.username, (err) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: "Server Error: cannot update sticker path" });
                    }
                    updateQuotes();
                });
            }
        });
    } else {
        updateQuotes();
    }
});

app.get("/share", (req, res) => {
    res.render("share", { nonce: res.nonce })
})

app.get("/api/share", (req, res) => {
    if (req.query.username === undefined || typeof req.query.username !== 'string')
        return res.status(400).json({ success: false, message: "NO!" })
    db.get("SELECT username, about, sticker FROM Users WHERE username = ?", req.query.username, (err, row) => {
        if (err)
            return res.status(500).json({ success: false, message: "Server Error" })
        if (!row)
            return res.status(404).json({ success: false, message: "Not found" })
        return res.json({ success: true, data: row })
    })
})

app.post("/api/logout", (req, res) => {
    req.session.destroy()
    res.json({ success: true })
})

app.post("/api/report", recaptcha.middleware.verify, (req, res) => {
    if (!req.body.url || typeof req.body.url !== 'string')
        return res.status(400).json({ success: false, message: "Invalid URL" })
    if (req.recaptcha.error) {
        console.error(req.recaptcha.error)
        return res.status(400).json({ success: false, message: "Invalid captcha" })
    }
    const url = new URL(req.body.url)
    url.host = HOST

    try {
        const bot_net = net.connect(BOT_PORT, BOT_HOST, () => {
            bot_net.write(url.href)
        })
        let result
        bot_net.on('data', (data) => {
            result = data.toString()
            bot_net.end()
        })
        bot_net.on('error', (err) => {
            console.error(err)
            return res.status(500).json({ success: false, message: "Server Error" })
        })
        bot_net.on('end', () => {
            return res.json({ success: true, data: result })
        })
    } catch (e) {
        return res.status(500).json({ success: false, message: "Server Error" })
    }
})

process.on('exit', () => {
    db.close()
})

app.listen(PORT, () => {
    console.log("Listening on port", PORT)
})

        