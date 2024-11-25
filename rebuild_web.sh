#! /bin/bash

# copy over the distribution files
echo "Deploying built resources..."
cp dist/index.html omero_crm_landing_page/templates/index.html
cp -r dist/static/* omero_crm_landing_page/static/
