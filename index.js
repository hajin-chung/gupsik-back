const app = require('express')();
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');
require('dotenv').config();

let cache = {};

app.use(cors());

app.get('/meal', async (req, res) => {
  let now = new Date();
  let nowMonth = `${now.getMonth()+1}`;
  let nowDay = `${now.getDate()}`;
  let { month=nowMonth, day=nowDay } = req.query;
  console.log({month, day});

  if(month && day) {
    let searchQuery = `https://www.dimigo.hs.kr/index.php?mid=school_cafeteria&search_target=title`
      +`&search_keyword=${month}%EC%9B%94%20${day}%EC%9D%BC&page=1`;

    if(cache.hasOwnProperty(`${month}-${day}`)) {
      res.status(200).json(cache[`${month}-${day}`]);
    } else {
      try {
        let listRes = await fetch(searchQuery);
        listRes = await listRes.text();

        let $ = cheerio.load(listRes);
        let mealUrl = $('#dimigo_post_cell_2 > tr:nth-child(1) > td.title > div > a').attr('href');
        mealUrl = encodeURI(mealUrl);
        console.log({ searchQuery, mealUrl });
        
        let mealRes = await fetch(mealUrl);
        mealRes = await mealRes.text();

        $ = cheerio.load(mealRes);
        let meal = {};

        $('#siDoc > ul:nth-child(5) > li > div.scConDoc.clearBar > div > p')
          .each((i, p) => {
            let inner = $(p).text();
            if(inner && inner != undefined && inner.length > 10) {
              let name = inner.split(' : ')[0];
              let content = inner.split(' : ')[1].split('/');
              meal[name] = content;
            }
          });
        
        cache[`${month}-${day}`] = meal;
        
        res.status(200).json(meal);
      } catch(e) {
        console.error(e);
        res.status(500).send({status: 'fail', messsage: e});
      }
    }
  } else {
    res.status(500).send({status: 'fail', message: 'parameter empty'});
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Listening to ${process.env.PORT}`)
})