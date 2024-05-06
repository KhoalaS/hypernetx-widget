#!/bin/bash
sed -e 's/demo\.\([^\.]\)*/demo/g' demo/dist/index.html > $1/cmd/server/index.html
rm $1/cmd/server/demo.* 
cp demo/dist/demo.*.js $1/cmd/server/demo.js
cp demo/dist/demo.*.css $1/cmd/server/demo.css
