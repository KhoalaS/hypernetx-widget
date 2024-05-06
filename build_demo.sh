#!/bin/bash
sed -e 's/demo\.\([^\.]\)*/demo/g' demo/dist/index.html > ../src/cmd/server/index.html
rm ../src/cmd/server/demo.* 
cp demo/dist/demo.*.js ../src/cmd/server/demo.js
cp demo/dist/demo.*.css ../src/cmd/server/demo.css