#! /bin/bash

# copy over the distribution files
echo "Deploying built resources..."
cp dist/index.html django/templates/index.html
cp -r dist/static/* django/static/
