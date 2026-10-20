#!/usr/bin/env bash
# Captures desktop (1440x900) and mobile (390x844) screenshots of the built prototype into design/polished-mockups/.
set -e
cd "$(dirname "$0")"
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
SRC="file:///$(cygpath -m "$PWD/dist/index.html" | sed 's/ /%20/g')"
mkdir -p ../design/polished-mockups
OUT="$(cygpath -w "$(cd ../design/polished-mockups && pwd)")"
shot() { # name query width height
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=$3,$4 --virtual-time-budget=6000 \
    --screenshot="$OUT/$1.png" "$SRC?$2" >/dev/null 2>&1 && echo "  $1.png"
}
for s in "desktop-01-dashboard|screen=dashboard" "desktop-02-projects|screen=projects" "desktop-03-project-details|screen=project&id=CRM-2026-0142" \
         "desktop-04-create-project|screen=new" "desktop-05-timeline|screen=timeline" "desktop-06-calendar|screen=calendar" \
         "desktop-07-notifications|screen=notifications" "desktop-08-reports|screen=reports"; do
  shot "${s%%|*}" "device=desktop&bar=0&${s#*|}" 1440 900
done
for s in "mobile-01-dashboard|screen=dashboard" "mobile-02-projects|screen=projects" "mobile-03-project-details|screen=project&id=CRM-2026-0142" \
         "mobile-04-create-project|screen=new" "mobile-05-timeline|screen=timeline" "mobile-06-notifications|screen=notifications&user=u-e1"; do
  shot "${s%%|*}" "device=mobile&bar=0&${s#*|}" 450 912
done
