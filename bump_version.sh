#!/bin/sh
# ಬಳಕೆ:  sh bump_version.sh 20261124a   -> index.html ನ ಎಲ್ಲಾ ?v= ಸಂಖ್ಯೆ ಬದಲಿಸುತ್ತದೆ
[ -z "$1" ] && echo "ಹೊಸ ಆವೃತ್ತಿ ಸಂಖ್ಯೆ ಕೊಡಿ, ಉದಾ: sh bump_version.sh 20261124a" && exit 1
sed -i "s/?v=[A-Za-z0-9_-]*\"/?v=$1\"/g" index.html && grep -c "?v=$1" index.html
