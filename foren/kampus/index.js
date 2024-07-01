const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const port = 8082;

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const { db } = require("./helper/connectionDb");

app.post("/login", (req, res) => {
 
    let { username, password } = req.body;

  // Melakukan kueri SQL dengan menggunakan teknik blind time-based
  console.log(username,"ini");
  console.log(password);

  if(username === "admin") {
    db.query(
        `SELECT password from user where password = '${password}`,
        [password],
        (err, result) => {
          console.log(err);
          if (err) {
            return res.status(200).send("something wrong");
          }
    
          if (result.length !== 1)
                return res.status(200).send({
                  error: true,
                  message: `Unauthorized: Wrong username or password`,
                });
    
          let data = JSON.parse(JSON.stringify(result[0]));
          delete data.password;
    
          return res.status(200).send({
            error: false,
            message: "login success",
          });
        }
      );
  } else {
    return res.status(200).send({
        erorr: true,
        message: "wrong username"
    })
  }
  
});

server.listen(port, () => console.log(`this server running on port ${port}`));
