#!/bin/bash

npm run build
cd dist && php -S localhost:8011
