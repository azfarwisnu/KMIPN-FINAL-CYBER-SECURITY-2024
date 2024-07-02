<<<<<<< HEAD
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const pug = require("pug");
const Jimp = require("jimp");
const jsQR = require("jsqr");
const Multer = require("multer");

const port = 3300;
const multer = Multer({
  storage: Multer.MemoryStorage,
  fileSize: 3 * 1024 * 1024,
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.post("/create", (req, res) => {
  try {
    const { message } = req.body;

    QRCode.toString(
      message,
      {
        errorCorrectionLevel: "H",
        type: "svg",
      },
      function (err, data) {
        if (err) {
          throw err;
        }
        return res.status(200).send(data);
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.post("/scan", [multer.single("file")], (req, res) => {
  try {
    const buffer = req.file.buffer;

    if (!buffer) {
      throw new Error("Buffer is null.");
    }

    if (buffer.length === 0) {
      throw new Error("Buffer is empty.");
    }

    Jimp.read(buffer, function (err, image) {
      console.log(image);
      if (err) {
        throw err;
      }

      const imageData = {
        data: new Uint8ClampedArray(image.bitmap.data),
        width: image.bitmap.width,
        height: image.bitmap.height,
      };

      const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

      if (!decodedQR) {
        throw new Error("QR code not found in the image.");
      }
;

      const result = decodedQR.data;
      let blacklist = ["*", "~", "<", ":", "%"];

      function containsBlacklistedChar(str, blacklist) {
        return blacklist.some((char) => str.includes(char));
      }
      if (containsBlacklistedChar(result, blacklist)) {
        // Return status 500 error
        res
          .status(500)
          .send("Error: Blacklisted character found in the result");
      } else {
        const out = `h1 hasil scan qr anda ${result}`;
        const html = pug.render(out);
        res.send(html);
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  server.close(() => {
    console.log("Server closed.");
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  });
});

server.listen(port, () => console.log(`this server running on port ${port}`));
=======
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const pug = require("pug");
const Jimp = require("jimp");
const jsQR = require("jsqr");
const Multer = require("multer");

const port = 3300;
const multer = Multer({
  storage: Multer.MemoryStorage,
  fileSize: 3 * 1024 * 1024,
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.post("/create", (req, res) => {
  try {
    const { message } = req.body;

    QRCode.toString(
      message,
      {
        errorCorrectionLevel: "H",
        type: "svg",
      },
      function (err, data) {
        if (err) {
          throw err;
        }
        return res.status(200).send(data);
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.post("/scan", [multer.single("file")], (req, res) => {
  try {
    const buffer = req.file.buffer;

    if (!buffer) {
      throw new Error("Buffer is null.");
    }

    if (buffer.length === 0) {
      throw new Error("Buffer is empty.");
    }

    Jimp.read(buffer, function (err, image) {
      console.log(image);
      if (err) {
        throw err;
      }

      const imageData = {
        data: new Uint8ClampedArray(image.bitmap.data),
        width: image.bitmap.width,
        height: image.bitmap.height,
      };

      const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);

      if (!decodedQR) {
        throw new Error("QR code not found in the image.");
      }
;

      const result = decodedQR.data;
      let blacklist = ["*", "~", "<", ":", "%"];

      function containsBlacklistedChar(str, blacklist) {
        return blacklist.some((char) => str.includes(char));
      }
      if (containsBlacklistedChar(result, blacklist)) {
        // Return status 500 error
        res
          .status(500)
          .send("Error: Blacklisted character found in the result");
      } else {
        const out = `h1 hasil scan qr anda aaaaa${result}`;
        const html = pug.render(out);
        res.send(html);
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  server.close(() => {
    console.log("Server closed.");
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  });
});

server.listen(port, () => console.log(`this server running on port ${port}`));
>>>>>>> 011793f5512b84238fe995ab9c34f02f36a6a771
