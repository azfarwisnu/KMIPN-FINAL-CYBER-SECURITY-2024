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
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


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
        messages TEXT DEFAULT 'Misii puhhh!.'
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
    const decodeUnicode = (text) => {
        return text.replace(/&#x([0-9A-Fa-f]+);/g, (match, code) => {
            return String.fromCharCode(parseInt(code, 16));
        });
    };

    const replaceHtmlEntities = (text) => {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    if (/<script/i.test(svgContent)) {
        const decodedContent = decodeUnicode(svgContent);
        const sanitizedContent = DOMPurify.sanitize(decodedContent);
        return replaceHtmlEntities(sanitizedContent);
    }

    const sanitizedContent = decodeUnicode(replaceHtmlEntities(svgContent));
    return sanitizedContent;
};

app.put("/api/quotes", (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userDir = path.join(__dirname, 'public', 'stickers', req.session.username);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    const updateQuotes = () => {
        if (typeof req.body.messages !== 'string') {
            return res.status(400).json({ success: false, message: "NO!" });
        }
        db.run("UPDATE Users SET messages = ? WHERE username = ?", req.body.messages, req.session.username, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Server error" });
            }
            return res.json({ success: true });
        });
    };

    const allowMimes = ['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml'];
    const allowExtensions = ['webp', 'jpeg', 'png', 'svg'];

    if (req.files && req.files.sticker) {
        const ext = req.files.sticker.name.split('.').pop();
        if (allowMimes.indexOf(req.files.sticker.mimetype) === -1 || allowExtensions.indexOf(ext) === -1) {
            return res.status(400).json({ success: false, message: "Only WEBP, JPEG, PNG, SVG" });
        }

        const filename = req.files.sticker.md5 + '.' + ext;
        const filePath = path.join(userDir, filename);
        req.files.sticker.mv(filePath, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "cannot move sticker to public dir" });
            }

            if (ext === 'svg') {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: "Server Error: cannot read SVG file" });
                    }
                    let sanitizedSVG = data;

                    if (!sanitizedSVG.startsWith('<svg')) {
                        return res.status(400).json({ success: false, message: "Invalid SVG content." });
                    }
                    if (!sanitizedSVG.includes('xmlns="http://www.w3.org/2000/svg"')) {
                        sanitizedSVG = sanitizedSVG.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                    }

                    const svgMatch = sanitizedSVG.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
                    if (svgMatch && svgMatch[1]) {
                        const innerSvg = svgMatch[1];
                        let sanitizedContent = sanitizeSvgContent(innerSvg);
                        sanitizedSVG = sanitizedSVG.slice(0, sanitizedSVG.indexOf(innerSvg)) + sanitizedContent + sanitizedSVG.slice(sanitizedSVG.indexOf(innerSvg) + innerSvg.length);
                    }

                    fs.writeFile(filePath, sanitizedSVG, (err) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: "Error" });
                        }

                        db.run("UPDATE Users SET sticker = ? WHERE username = ?", path.join('stickers', req.session.username, filename), req.session.username, (err) => {
                            if (err) {
                                return res.status(500).json({ success: false, message: "Server Error: cannot update sticker path" });
                            }
                            updateQuotes();
                        });
                    });
                });
            } else {
                db.run("UPDATE Users SET sticker = ? WHERE username = ?", path.join('stickers', req.session.username, filename), req.session.username, (err) => {
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


app.get("/preview", (req, res) => {
    res.render("preview", { nonce: res.nonce })
})

app.get("/api/preview", (req, res) => {
    if (req.query.username === undefined || typeof req.query.username !== 'string')
        return res.status(400).json({ success: false, message: "NO!" })
    db.get("SELECT username, messages, sticker FROM Users WHERE username = ?", req.query.username, (err, row) => {
        if (err)
            return res.status(500).json({ success: false, message: "Server Error" })
        if (!row)
            return res.status(404).json({ success: false, message: "Not found" })
        return res.json({ success: true, data: row })
    })
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

const path = require('path');
const cookieParser = require('cookie-parser');

// const { COOKIE } = require(path.join(__dirname, '../../bot/src/bot.js')); debug
const COOKIE = process.env.COOKIE 
const FLAG = process.env.FLAG

app.use(cookieParser()); 
app.use(express.static(path.join(__dirname, 'public')));

app.get("/admin-page", (req, res) => {
    console.log(req.cookies.admin)
    if (req.cookies.admin === COOKIE) {
        const filePath = path.join(__dirname, 'views', 'admin-page.html');

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Internal Server Error');
                return;
            }
            const updatedHtml = data.replace('{{FLAG}}', FLAG);
            res.send(updatedHtml);
        });
    } else {
        res.status(403).send("<h1>403 Forbidden</h1>");
    }
});

const COOKIEE = process.env.COOKIEE
const FLAGG = process.env.FLAGG

app.get("/don-page", (req, res) => {
    console.log(req.cookies.admin)
    if (req.cookies.admin === COOKIEE) {
        const filePath = path.join(__dirname, 'views', 'don-page.html');

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Internal Server Error');
                return;
            }
            const updatedHtml = data.replace('{{FLAGG}}', FLAGG);
            res.send(updatedHtml);
        });
    } else {
        res.status(403).send("<h1>403 Forbidden</h1>");
    }
});

process.on('exit', () => {
    db.close()
})

app.listen(PORT, () => {
    console.log("Listening on port", PORT)
})

        