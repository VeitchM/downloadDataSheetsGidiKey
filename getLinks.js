const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const zlib = require('zlib')
const pathLib = require('path')
const csv = require('csv-parser')



const firstKey = 'SS-6488-NF'
const secondKey = '388284'
const url = `https://www.digikey.com/en/products/detail/${firstKey}/${secondKey}`;
const linkSearched = "datasheet-download"
//const url = 'https://www.belfuse.com:443/resources/drawings/stewartconnector/dr-stw-ss-6488-nf-ss-6488-nf-50.pdf'
//const url = 'https://google.com'
//const url = 'https://www.digikey.com/en/products/detail/17-101800/2341067'

const csvFilePath = './testBorrar.csv'
const csvData = []
fs.createReadStream(csvFilePath)
  .pipe(csv()) // Use the csv-parser package to parse the CSV data
  .on('data', (row) => {
    // Add each row of data to the csvData array
    csvData.push(row);
  })
  .on('end', () => {
    // All the data has been read and added to the csvData array
    console.log(csvData);
    // Here you can use the csvData array to process the CSV data as needed

    csvData.forEach((item)=>{
      const firstKey = item.firstKey;
      const secondKey = item.secondKey;
      console.log('Item',item);

      customGet(`https://www.digikey.com/en/products/detail/${firstKey}/${secondKey}`,
      (data) => {
        const link = getLinkFromData(data)
        customGet(link, (data) => {
          writeFile(data, `./${firstKey}/${secondKey}/datasheet.pdf`)
        }
        )
        console.log(link);
      },
      true);
    })
  });

function customGet(url, callback, compressed = false) {

  const options = {
    headers: {
      //'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      'User-Agent': 'PostmanRuntime/7.31.1',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    }
  };


  https.get(url, options, (res) => {
    console.log('Response headers:', res.headers);

    console.log('statusCode:', res.statusCode);

    let data = []; //Consider using pipes if files are big

    let pipe = res

    if (compressed) {
      pipe = res.pipe(zlib.createGunzip());
    }


    pipe.on('data', (chunk) => {
      data.push(chunk);
      //console.log('Received',chunk);n
      //console.log('Forming',data);
    });

    pipe.on('end', () => {
      //data=data.toString()
      //console.log(data);
      const newData = Buffer.concat(data)

      callback(newData)


    });

  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}

const getLinkFromData = (data) => {

  const $ = cheerio.load(data);


  console.log($('a').attr('href'));
  const link = $(`a[data-testid="${linkSearched}"]`).attr('href');
  console.log(`Link found: ${link}`);
  return link

}

const writeFile = (data, path) => {

  const dir = pathLib.dirname(path)
  const fileName = pathLib.basename(path)
  console.log(path, dir, fileName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFile(path, data, (err) => {
    if (err) {
      console.error(`Error writing file: ${err.message}`);
    } else {
      console.log('Data written to file');
    }
  });
}