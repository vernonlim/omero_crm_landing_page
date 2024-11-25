#!/usr/bin/env bash

# copy over the distribution files
echo "Making folders..."
mkdir -p ./omero_crm_landing_page/static
mkdir -p ./omero_crm_landing_page/templates

echo "Cleaning folders..."
rm -r ./omero_crm_landing_page/static/*
rm -r ./omero_crm_landing_page/templates/*

echo "Deploying built resources..."
cp ./dist/index.html ./omero_crm_landing_page/templates/index.html
cp -r ./dist/assets/* ./omero_crm_landing_page/static/
