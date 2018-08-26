#!/usr/bin/env node

const chalk = require('chalk');
const opener = require('opener');
const commander = require('commander');

const pkg = require('../package.json');
const lib = require('../');
const bin = pkg.bin[0] || pkg.name;

const error = (err) => {
  var message;
  if( process.env.NODE_ENV == 'development' ) message = err.stack || err;
  else message = err.message || err;
  console.error(chalk.red(message));
};

process.title = pkg.name;

commander.version(pkg.version);

commander
  .command('serve [docbase]')
  .alias('up')
  .description('Start Server')
  .option('-a, --address <address>', 'bind address')
  .option('-p, --port <portnumber>', 'port', parseInt)
  .option('-v, --verborse', 'verbose output')
  .option('-s, --pseudopages [pattern]', 'pseudo page glob patterns for single page application (default is a file without an extension)')
  .option('-d, --defaultpage <pagename>', 'default page for pseudo page')
  .option('-c, --capture [pattern]', 'turn on live page capture (server-side rendering with phantomjs), pattern=bot,bot/oldie,regexp(user-agent)')
  .option('-i, --indexpage <pagename>', 'index page')
  .option('-n, --notfound <filename>', 'not found page')
  .option('-f, --logformat <format>', 'log format, dev(default),combind,common,tiny,short (see https://www.npmjs.com/package/morgan)')
  .option('--cors [origin]', 'access control allow origin(CORS)')
  .option('-o, --open', 'open browser automatically')
  .option('-S, --tls, --ssl', 'enable TLS/SSL(https)')
  .option('-K, --key', 'key file (key.pem)')
  .option('-C, --cert', 'cert file (cert.pem)')
  .action((docbase, options) => {
    const o = {
      docbase,
      address: options.address,
      port: options.port,
      pseudopages: options.pseudopages,
      defaultpage: options.defaultpage,
      capture: options.capture,
      verborse: options.verborse,
      indexpage: options.indexpage,
      notfound: options.notfound,
      logformat: options.logformat,
      tls: options.tls && {
        key: options.key,
        cert: options.cert
      },
      cors: options.cors === true ? '*' : options.cors
    };

    //console.log(o);

    if( options.verbose ) console.log(chalk.blue(o));

    (async () => {
      try {
        const server = lib(o);
        const httpd = await server.listen();
        const address = httpd.address();

        console.log(chalk.blue(`${pkg.name} listening on`), chalk.white.bold(`${address.address}:${address.port}`));
        if( options.open ) opener(server.connecturl);
      } catch(err) {
        error(err);
      }
    })();
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log(`  $ ${bin} serve`);
    console.log(`  $ ${bin} serve docbase`);
    console.log(`  $ ${bin} serve docbase -p 9000`);
    console.log(`  $ ${bin} serve docbase -cors`);
    console.log();
  });


commander
  .action(action => {
    console.log('Unknown Command \'%s\'', action || '');
    commander.outputHelp();
  })
  .parse(process.argv);

if( !process.argv.slice(2).length ) commander.outputHelp();
