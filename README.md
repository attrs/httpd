# httpd-spa

## Install
```sh
$ npm i httpd-spa
```

## Usage
```sh
$ npx httpd-spa serve docs
$ npx httpd-spa serve docs -a '0.0.0.0' -p 9000 -i index.html -d spa.html -n notfound.html -c --cors -s -f dev -v 
```

## Options
```
-a, --address <address>       bind address (defaults to 0.0.0.0)
-p, --port <portnumber>       port (defaults to 8080)
-v, --verborse                verbose output
-s, --pseudopages [pattern]   pseudo page glob patterns for single page application (default is a file without an extension)
-d, --defaultpage <pagename>  default page for pseudo page
-c, --capture [pattern]       turn on live page capture (server-side rendering with PhantomJS), pattern=bot,bot/oldie,regexp(user-agent)
-i, --indexpage <pagename>    Index Page
-n, --notfound <pagename>     not found page
-f, --logformat <format>      log format, dev(default),combind,common,tiny,short (see https://www.npmjs.com/package/morgan)
--cors [origin]               access control allow origin(CORS)
-o, --open                    open browser automatically
-S, --tls, --ssl              enable TLS/SSL(https)
-K, --key                     key file (key.pem)
-C, --cert                    cert file (cert.pem)
```
