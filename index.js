const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/search', async (req, res) => {
  const { start, end, date, time } = req.body;

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://rozklad-pkp.pl/');

  await page.click('.css-47sehv');
  await page.type('#from-station', start);
  await page.type('#to-station', end);

  await page.evaluate((date, time) => {
    const day1 = document.querySelector('input[name="date"]');
    const day2 = document.querySelector('input[name="dateStart"]');
    const day3 = document.querySelector('input[name="dateEnd"]');
    const day4 = document.querySelector('input[name="REQ0JourneyDate"]');
    day1.value = date;
    day2.value = date;
    day3.value = date;
    day4.value = date;

    const time1 = document.querySelector('input[name="time"]');
    const time2 = document.querySelector('input[name="REQ0JourneyTime"]');
    time1.value = time;
    time2.value = time;
  }, date, time);

  await page.click('#singlebutton');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  const trips = await page.evaluate(() => Array.from(document.querySelector('tbody').querySelectorAll('tr'), (e) => ({
    from: e.children[1].children[0].innerText,
    to: e.children[1].children[1].innerText,
    data: e.children[2].innerText.slice(0, 8),
    timeStart: e.children[3].children[0].children[0].children[2].innerText,
    timeEnd: e.children[3].children[1].children[0].children[2].innerText,
    totalTime: e.children[4].innerText,
    interchanges: e.children[5].innerText,
  })));

  console.log(trips);

  await browser.close();

  res.json(trips);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
