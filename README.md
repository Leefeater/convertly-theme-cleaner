# Class to clean up pages and themes for convertly

This is simply a class that converts colors and fonts to global values for the Convertly app, no NPM needed.

There is also a reporting function that will inform you of useful data like if you are using colors that aren't part of the global presets.

Paste theme into theme.js, and page or theme into page.js (note its expecting an array).  Run index.js in the command line, and it will
send the results to new.json.

old.json is just a static file you can paste the original json into it to compare with new json if you'd like.
