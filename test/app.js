const mossClient = require('../moss')
const client = new mossClient('javascript', '771517505');

client.setComment('project-1');

client.addFile('p1.javascript');
client.addFile('p2.javascript');

client.process().then(url => console.log(url)) 