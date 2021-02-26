const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  let data = fs.readFileSync("persons.json", "utf-8");
  let person = JSON.parse(data);
  res.write(JSON.stringify(person));
  res.end();
});

server.listen(8000, () => {
  console.log("Server is listening on port 8000");
});
