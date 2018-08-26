const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const connect = require('connect');
const morgan = require('morgan');
const untildify = require('untildify');
const servestatic = require('serve-static');
const staticfile = require('connect-static-file');
const compression = require('compression');
const minimatch = require('minimatch');
const isbot = require('isbot');
const Renderer = require('./renderer');
const emptyfn = (req, res, next) => next();

module.exports = (options) => {
  const cwd = untildify(options.cwd || process.cwd());

  const host = options.host || options.address || '0.0.0.0';
  const port = +options.port || 8080;
  const tls = options.tls;
  const scheme = tls ? 'https' : 'http';
  const connecturl = `${scheme}://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
  const xff = options.xff === false ? false : true;

  const docbase = path.resolve(cwd, untildify(options.docbase || '.'));
  const indexpage = options.indexpage || 'index.html';
  const indexpages = indexpage.split(',');
  const notfoundpage = options.notfound && path.join(docbase, options.notfound);
  const notfoundhtml = (notfoundpage && fs.readFileSync(notfoundpage) || '404 Not Found');

  const logfile = options.logfile && path.resolve(cwd, untildify(options.logfile));
  const logstream = logfile && fs.createWriteStream(logfile, {flags: 'a'});
  const logformat = options.logformat || 'dev';
  const accesslog = morgan(logformat, logstream && {stream: logstream});

  const capture = options.capture;
  const capturedir = path.resolve(cwd, untildify(options.capturedir || '.cache'));

  const cors = options.cors;

  const defaultpage = options.defaultpage || indexpage;
  const defaultpagehtml = fs.readFileSync(path.join(docbase, defaultpage));
  let pseudopages = options.pseudopages;
  if( typeof pseudopages === 'boolean' ) pseudopages = ['/**/*([^.])'];
  else if( typeof pseudopages === 'string' ) pseudopages = pseudopages.split(',');

  const evaluatepseudopage = (pathname) => {
    if( !pseudopages ) return false;
    return !!pseudopages.find(pattern => minimatch(pathname, pattern));
  };

  let renderer;

  const app = connect()
    .use((req, res, next) => {
      if( cors ) {
        res.setHeader('Access-Control-Allow-Origin', cors);
        if( cors !== '*' ) res.setHeader('Vary', 'Origin');
      }

      if( xff ) req.ip = (req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '').split(',')[0].trim();
      next();
    })
    .use(accesslog || emptyfn)
    .use(compression())
    .use((req, res, next) => {
      if( !capture ) return next();

      const pathname = req._parsedUrl.pathname;
      // if( fs.existsSync(path.join(docbase, pathname)) ) return next();
      if( !evaluatepseudopage(pathname) ) return next();

      const ua = req.headers['user-agent'];
      if( ua && ~ua.toLowerCase().indexOf('phantomjs') ) return next();

      res.setHeader('Content-Type', 'text/html; charset=UTF-8');

      let confirm = false;
      if( isbot(ua) ) confirm = true;
      if( ~req.url.indexOf('$$bot') ) confirm = true;

      const url = req.url.split('$$bot').join('');
      const cachefile = renderer && renderer.cachefile(url);
      if( confirm && cachefile ) return staticfile(cachefile)(req, res, next);

      confirm && (async () => {
        if( !renderer ) {
          renderer = await Renderer({
            baseurl: connecturl,
            capturedir
          });
        }

        try {
          await renderer.capture(url);
        } catch(err) {
          console.error('capture fail', url, err);
        }
      })();

      next();
    })
    .use(servestatic(docbase, {
      index: indexpages
    }))
    .use((req, res) => {
      const ispseudopage = evaluatepseudopage(req._parsedUrl.pathname);
      res.statusCode = ispseudopage ? 200 : 404;
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.write(ispseudopage ? defaultpagehtml : notfoundhtml);
      res.end();
    });

  let httpd;

  return {
    connecturl,
    listen() {
      httpd = tls ? https.createServer({
        key: tls.key || (tls.keyfile && fs.readFileSync(tls.keyfile)),
        cert: tls.cert || (tls.certfile && fs.readFileSync(tls.certfile))
      }, app) : http.createServer(app);

      return new Promise((resolve, reject) => {
        httpd
          .on('error', (err) => {
            reject(err);
          })
          .listen({
            host,
            port
          }, () => {
            resolve(httpd);
          });
      });
    },
    async close() {
      httpd && await httpd.close();
      httpd = null;
    }
  };
};
