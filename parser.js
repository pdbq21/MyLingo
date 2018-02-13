const fs = require('fs');
const request = require('request');

let stopCounter = 0;
const load = (season, episode) => {
  let url = `http://fenglish.ru/subs/friends/FriendsS${(season.toLocaleString().length === 1) ?
    '0' + season : season}E${(episode.toLocaleString().length === 1) ?
    '0' + episode : episode}.en.vtt`;

  let path = './subs';
  if(!fs.existsSync(path)) fs.mkdirSync(path);
  request(url, (error, response, body) => {
      if ((response && response.statusCode) === 404) {
        stopCounter++;
        console.log(404);
        if (stopCounter > 3) return;

        (stopCounter === 3) ? load(++season, 1) : load(season, ++episode);
      } else {
        stopCounter = 0;
        path = `${path}/season_${season}`;
        if(!fs.existsSync(path)) fs.mkdirSync(path);

        let fileName = `${path}/sub_s${season}_e${episode}.txt`;
        fs.writeFile(fileName, body, 'utf8', function (err) {
          (err) ? console.error("error writing") : console.log(`add sub_s${season}_e${episode}.txt`);
        });

        load(season, ++episode);
      }
    });
};


const read = () => {
  let subtitles = {};
// => [season_1, ...]
  const folders = fs.readdirSync('./subs/');

  folders.forEach((folder) => {
    const files = fs.readdirSync(`./subs/${folder}/`);
    files.forEach((file) => {
      let text = fs.readFileSync(`./subs/${folder}/${file}`, 'utf8');

      const reg = /[a-zA-Z]+('|")[a-zA-Z]+|[a-zA-Z]+-[a-zA-Z]+|[a-zA-Z]+/g;
      let wordsCount = {};
      text.match(reg).forEach((word) => {
        word = word.toLowerCase();
        (wordsCount.hasOwnProperty(word)) ?
          wordsCount[word] += 1 :
          wordsCount[word] = 1;
      });

      let sortable = [];
      for (let word in wordsCount) {
        sortable.push({ 'word': word, 'count': wordsCount[word] });
      }
      sortable.sort((a, b) => b.count - a.count);

      subtitles[folder] = { [file]: sortable };
    })
  });

  fs.writeFileSync('subtitles.json', JSON.stringify(subtitles));
  console.log('create file done');
};

// first step: parse subs and save in files
// => default season and episode
//load(1, 1);
// second step: concat all subs and sort words
//read();
