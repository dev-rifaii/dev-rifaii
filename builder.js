import { marked } from 'marked';
import fs from 'fs';
import * as cheerio from 'cheerio';

const articlesDir = 'src/resources/articles'
const guidesDir = 'src/guides'
const resourcesDir = 'src/resources'
const imagesDir = `${resourcesDir}/images`

const headHtml = "<!DOCTYPE html><html lang=\"en\"><head>\r\n    \r\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" \/>\r\n        <link rel=\"stylesheet\" href=\"style.css\">\r\n        <link rel=\"stylesheet\" type=\"text\/css\" href=\"https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/normalize\/8.0.1\/normalize.min.css\">\r\n        <link href=\"https:\/\/fonts.googleapis.com\/css?family=Roboto Mono\" rel=\"stylesheet\">\r\n        <link rel=\"stylesheet\" href=\"https:\/\/cdn.jsdelivr.net\/npm\/prismjs@1.27.0\/themes\/prism.min.css\">\r\n        <script src=\"https:\/\/cdn.jsdelivr.net\/npm\/prismjs@1.27.0\/prism.min.js\"><\/script>\r\n        <script src=\"https:\/\/cdn.jsdelivr.net\/npm\/prismjs@1.27.0\/components\/prism-groovy.min.js\"><\/script>\r\n        <script src=\"https:\/\/cdn.jsdelivr.net\/npm\/prismjs@1.27.0\/components\/prism-java.min.js\"><\/script>\r\n        <script src=\"https:\/\/cdn.jsdelivr.net\/npm\/prismjs@1.27.0\/components\/prism-json.min.js\"><\/script>\r\n        <link href=\"https:\/\/fonts.googleapis.com\/css?family=Montserrat\" rel=\"stylesheet\">\r\n        <title>Article<\/title>\r\n    <\/head>\r\n\r\n\r\n<body>\r\n    <div class=\"article\">"
const footHtml = "    <\/div>\r\n<\/body>\r\n\r\n<\/html>"


function compileMarkdownArticles() {
  fs.readdir('src/resources/articles', (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach(fileName => {
      fs.readFile(`${articlesDir}/${fileName}`, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        let html = headHtml + marked.parse(data, { headerIds: false, mangle: false }) + footHtml;
        const $ = cheerio.load(html);

        fs.writeFile(
          `${guidesDir}/${fileName.replace('.md', '.html')}`,
          $.root().html(),
          { encoding: 'utf8', flag: 'w' },
          (err) => console.error(err)
        )
      });
    })
    appendArticlesHrefToHomepage(files.map(fileName => fileName.replace('.md', '')));
    build();
  });
}

function appendArticlesHrefToHomepage(filesNames) {
  fs.readFile(`src/index.html`, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    const titles = getTitles();

    const $ = cheerio.load(data);

    $('div.guides').empty();
    filesNames.forEach(fileName => {
      const title = titles.find(title => title.fileName === fileName);
      $('div.guides').append(`<a href="./guides/${fileName}.html"> ${title.title} </a>`);
    })

    fs.writeFile('src/index.html',
      $.root().html(),
      { encoding: 'utf8', flag: 'w' },
      (err) => console.error(err))
  })
}

function build() {

  createBuiltDirs()

  fs.readdirSync(`${guidesDir}`)
    .forEach(file => {
      fs.copyFileSync(`${process.cwd()}/${guidesDir}/${file}`, `${process.cwd()}/built/guides/${file}`);
    })

  fs.readdirSync(`${imagesDir}`)
    .forEach(file => {
      fs.copyFileSync(`${process.cwd()}/${imagesDir}/${file}`, `${process.cwd()}/built/resources/images/${file}`);
    })

  fs.readdirSync(`src/`)
    .filter(file => file.includes('.html') || file.includes('.css'))
    .forEach(file => {
      fs.copyFileSync(`${process.cwd()}/src/${file}`, `${process.cwd()}/built/${file}`);
    })
}

function createBuiltDirs() {
  if (fs.existsSync('built')) {
    fs.rmSync('built', { recursive: true, force: true });
  }
  const builtDirs = ['built', 'built/guides', 'built/resources', 'built/resources/images']
  builtDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  })
}

function getTitles() {
  const data = fs.readFileSync(`${resourcesDir}/titles.json`, 'utf-8')
  return JSON.parse(data);
}

compileMarkdownArticles();
