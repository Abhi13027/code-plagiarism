const fs = require("fs");
const path = require("path");
const net = require("net");

const moss_server = "moss.stanford.edu";
const moss_port = 7690;
const moss_languages = [
  "c",
  "cc",
  "java",
  "ml",
  "pascal",
  "ada",
  "lisp",
  "scheme",
  "haskell",
  "fortran",
  "ascii",
  "vhdl",
  "perl",
  "matlab",
  "python",
  "mips",
  "prolog",
  "spice",
  "vb",
  "csharp",
  "modula2",
  "a8086",
  "javascript",
  "plsql",
  "verilog",
];

class mossClient {
  constructor(language, userID) {
    if (!moss_languages.includes(String(language).toLowerCase())) {
      throw new Error("Language is not Supported by Moss");
    }

    this.files = [];
    this.userID = userID;
    this.language = language;
    this.options = {
      l: this.language,
      m: 10,
      d: 0,
      x: 0,
      c: "",
      n: 250,
    };
  }

  setComment(comment) {
    this.options.c = comment;
  }

  async addFile(filePath, description) {
    let file_path = path.resolve(filePath);
    fs.access(file_path, fs.constants.F_OK, (err) => {
      if (err) {
        throw new Error("File Path Cannot be found");
      }
      const stat = fs.statSync(file_path);
      const bytes = stat.size;

      this.files.push({
        description: description,
        path: filePath,
        size: bytes,
      });
    });
  }

  async uploadFile(socket, fileObj, fileID) {
    console.log(fileObj);
    return new Promise((resolve, reject) => {
      fs.readFile(fileObj.path, "utf-8", (err, data) => {
        if (err) {
          reject(err);
        }
        let newData = data.replace(
          /[^a-zA-Z0-9\t\n ./,<>?;:"'`!@#$%^&*()\[\]{}_+=|\\-]/g,
          ""
        );
        let writing = `file ${fileID} ${this.options.l} ${Buffer.byteLength(
          newData
        )} ${fileObj.description}\n`;
        socket.write(writing);
        socket.write(newData);
        resolve();
      });
    });
  }

  async process() {
    return new Promise((resolve, reject) => {
      let socket = new net.Socket();
      socket.connect(moss_port, moss_server, () => {
        console.log(`Connected to MOSS server @ ${moss_server}:${moss_port}`);
        socket.write(`moss ${this.userID}\n`);
        socket.write(`directory ${this.options.d}\n`);
        socket.write(`X ${this.options.x}\n`);
        socket.write(`maxmatches ${this.options.m}\n`);
        socket.write(`show ${this.options.n}\n`);
        socket.write(`language ${this.options.l}\n`);
      });

      socket.on("data", async (data) => {
        console.log("Data: " + data);
        if (data == "no\n") {
          reject(new Error("Language is not supported"));
        }
        if (data == "yes\n") {
          let fileID = 1;

          for (let file of this.files) {
            try {
              await this.uploadFile(socket, file, fileID);
              fileID++;
            } catch (err) {
              console.log("Error Uploading the files: " + err);
            }
          }

          socket.write(`query 0 ${this.options.c}\n`);
        }

        if (String(data).startsWith("http://moss.stanford.edu")) {
          socket.write("end\n");
          socket.destroy();
          resolve(data.toString("utf8"));
        }
      });

      socket.on("close", () => {
        console.log("Connection is closed");
      });
    });
  }
}

module.exports = mossClient;
