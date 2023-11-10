const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const axios = require('axios');
const cron = require('node-cron');
const schedule = require('node-schedule');


let nextScheduledTime;
// Function to calculate and display the time difference
function displayTimeDifference() {
  if (nextScheduledTime) {
    const currentTime = new Date();
    const timeDifference = nextScheduledTime - currentTime;
    const minutesRemaining = Math.floor(timeDifference / (1000 * 60));

    console.log(`Next execution in ${minutesRemaining} minutes at ${nextScheduledTime}`);
  } else {
    console.log('Next scheduled time not yet set.');
  }
}



const url = 'https://onepiecescan.fr/';

async function executeScript() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const content = await page.content();
  const $ = cheerio.load(content);
  console.log('Page title:', $('title').text());

  const latestChapter = {
    title: '',
    link: ''
  }

  const a = $('li#ceo_latest_comics_widget-2 li').first();

  latestChapter.title = a.children()[0].children[0].data;
  latestChapter.link = a.children()[0].attribs.href;

  console.log('latestChapter: ', latestChapter)

  console.log('Downloading images...')
  const chapterPage = await browser.newPage();
  await chapterPage.goto(latestChapter.link);
  const chapterContent = await chapterPage.content();
  const $$ = cheerio.load(chapterContent);
  const imageLinks = [];

  const b = $$("div.elementor-element-f766019 img");
  b.each((index, element) => {
    imageLinks.push(element.attribs.src);
  });

  console.log('imageLink: ', imageLinks)

  console.log('Creating directory for images...')
  const dir = './one_piece_images';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

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
}

//lancer la première fois
// executeScript();
displayTimeDifference();

// Schedule the script to run every 5 minutes
const job = schedule.scheduleJob('*/5 * * * *', () => {
  console.log('Running script...');
  executeScript().then(() => {
    // Display the time difference after each execution
    displayTimeDifference();
  }).catch(err => console.error(err));
});

// // Schedule the script to run every Monday at 8:30 AM
// const job = schedule.scheduleJob('*30 8 * * 1', () => {
//   console.log('Running script...');
//   executeScript().then(() => {
//     // Display the time difference after each execution
//     displayTimeDifference();
//   }).catch(err => console.error(err));
// });

// Capture the next scheduled time when the job is scheduled
job.on('scheduled', fireDate => {
  nextScheduledTime = fireDate;
  displayTimeDifference();
});


// 30: Run at the 30th minute of the hour.
// 8: Run at the 8th hour (8:00 AM).
// *: Any day of the month.
// *: Any month.
// 1: Only on Monday (Sunday is 0)


