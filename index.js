const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const axios = require('axios');

const url = 'https://onepiecescan.fr/';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const content = await page.content();
  const $ = cheerio.load(content);
  console.log('Page title:', $('title').text());

//const latestChapterLink = $('div.liste-chapitres a li a').attr('href'); // Update the selector here

// const latestChaptersList = [];
//   $('div.elementor-element-54c010d').each((index, element) => {
//     const chapterLink = $(element).find('div > div > div > ul > li > ul > li > a').attr('href');
//     const chapterTitle = $(element).find('div > div > div > ul > li > ul > li > a')
//     console.log('chapterTitle: ', chapterTitle);
//     latestChaptersList.push({ title: chapterTitle, link: chapterLink });
//     // latestChaptersList.push($(element).text());
//   });

const latestChapter = {
    title: '',
    link: ''
}

const a = $('li#ceo_latest_comics_widget-2 li').first();
// console.log(a.children()[0])

latestChapter.title = a.children()[0].children[0].data;
latestChapter.link = a.children()[0].attribs.href;

console.log('latestChapter: ', latestChapter)


  // Download images
  console.log('Downloading images...')
  const chapterPage = await browser.newPage();
  await chapterPage.goto(latestChapter.link);
  const chapterContent = await chapterPage.content();
  const $$ = cheerio.load(chapterContent);
  const imageLinks = [] ;

  const b = $$("div.elementor-element-f766019 img");
  b.each((index, element) => {
    // imageLink = element.attribs.src;
    imageLinks.push(element.attribs.src);
  });
  
  console.log('imageLink: ', imageLinks)


  // Create a directory for images
  console.log('Creating directory for images...')
  const dir = './one_piece_images';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

   

  // Download and save images
console.log('Saving images...')
  imageLinks.forEach(async (imageLink, index) => {
    const image = await axios.get(imageLink, {
      responseType: 'arraybuffer',
    });
    const date = new Date().toISOString().slice(0, 10);
    fs.writeFile(`${dir}/image_${date}_${index + 1}.jpg`, image.data, 'binary', (err) => {
      if (err) throw err;
      console.log(`Image ${index + 1} downloaded successfully!`);
    });
  });

  await browser.close();
})();