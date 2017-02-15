const ftpClient = require('ftp');
const fs = require('fs');
const xml2json = require('xml-to-json');
const MySQL = require('mysql');

const filename = 'test.xml';
const downloadPath = './downloads';
const downloadFilename = 'test.local.xml';

let ftpConnection = {
    host: 'localhost',
    user: 'daemon',
    password: 'xampp',
    port: 21
};

const connection = MySQL.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ftpxml'
});
connection.connect();

setInterval(() => {
  // Just loop listing dir contents from ftp
  //displayFTP();

  // Download File to system using ftpXML
  checkDirExists();
  ftpXML((file) => { // use callback to get the filename to use
    //console.log(`Downloaded File: ${file}`);
    // begin conversion.
    xml2json({
      input: file,
    }, (err, result) => {
      if (err) throw err;
      //console.log(JSON.parse(JSON.stringify(result)));
      let data = fs.readFileSync(file).toString();
      let resp = JSON.stringify(JSON.parse(JSON.stringify(result)));
      connection.query('Insert into conversion (id, data, output) VALUES (null, ' + connection.escape(data) + ', ' + connection.escape(resp) + ')',
        function (error, results, fields) {
          if (error) throw error;
          console.log(resp);
        });
    });

  });
}, 10000);

function checkDirExists() {
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }
}

function displayFTP() {
  var fc = new ftpClient();
  fc.on('ready', () => {
    fc.list((err, list) => {
      if (err) throw err;
      console.dir(list);
      fc.end();
    });
  });
  fc.connect(ftpConnection);
}

function ftpXML(callback) {
  var fc = new ftpClient();
  fc.on('ready', () => {
    fc.get(filename, (err, stream) => {
      if (err) throw err;
      let date = new Date().getTime();
      let downloadFile = downloadPath + '/' + downloadFilename + '-' + date;
      stream.once('close', function() { fc.end(); });
      stream.pipe(fs.createWriteStream(downloadFile));
      return callback(downloadFile);
    });
  });
  fc.connect(ftpConnection);
}
