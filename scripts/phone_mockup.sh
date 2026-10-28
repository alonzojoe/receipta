#!/usr/bin/env bash
#
# Wraps a phone screenshot in a phone-shaped frame: rounded screen, dark bezel, soft shadow,
# transparent background.
#
#   scripts/phone_mockup.sh raw-shot.png docs/screenshots/mobile-builder.png
#
# Local and offline, on purpose. A mockup website would be quicker and would also mean
# uploading screenshots of a receipt to somebody else's server, which is a strange thing to
# do for a project whose claim is that nothing leaves your device.
#
# Needs ImageMagick: brew install imagemagick

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "usage: $0 <screenshot.png> <output.png> [width]" >&2
  exit 1
fi

input=$1
output=$2
# The screen's width in the finished image. The README shows these at a third of its width,
# so 900 is sharp on a Retina display without the file becoming large.
screen_width=${3:-900}

if [ ! -f "$input" ]; then
  echo "no such file: $input" >&2
  exit 1
fi

magick -version >/dev/null 2>&1 || { echo "ImageMagick is not installed: brew install imagemagick" >&2; exit 1; }

# Proportional to the width, so any screenshot size gives the same-looking phone.
bezel=$(( screen_width * 3 / 100 ))          # the black border around the screen
screen_radius=$(( screen_width * 9 / 100 ))  # the screen's own rounded corners
outer_radius=$(( screen_radius + bezel ))

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# 1. The screen: resized, with its corners rounded by a mask rather than drawn over, so the
#    corners are transparent and the bezel shows through cleanly.
magick "$input" -resize "${screen_width}x" "$work/screen.png"
# Two reads rather than one `read w h`: identify prints no trailing newline, so read returns
# non-zero and `set -e` would end the script here with no message at all.
w=$(magick identify -format "%w" "$work/screen.png")
h=$(magick identify -format "%h" "$work/screen.png")

# CopyOpacity reads the mask's BRIGHTNESS, so it must be white where the screen shows and
# black where it does not. Drawing the default black fill on a transparent canvas makes the
# whole screen transparent instead - the phone comes out as a solid dark slab.
magick -size "${w}x${h}" xc:black \
  -fill white \
  -draw "roundrectangle 0,0 $((w - 1)),$((h - 1)) $screen_radius,$screen_radius" \
  "$work/mask.png"
magick "$work/screen.png" "$work/mask.png" -alpha off -compose CopyOpacity -composite "$work/rounded.png"

# 2. The body: a rounded black rectangle a bezel wider in each direction.
body_w=$(( w + bezel * 2 ))
body_h=$(( h + bezel * 2 ))
magick -size "${body_w}x${body_h}" xc:none \
  -fill '#0f172a' \
  -draw "roundrectangle 0,0 $((body_w - 1)),$((body_h - 1)) $outer_radius,$outer_radius" \
  "$work/body.png"

# 3. Screen into body, then a soft shadow under the whole thing.
magick "$work/body.png" "$work/rounded.png" -geometry "+${bezel}+${bezel}" -composite "$work/phone.png"

magick "$work/phone.png" \
  \( +clone -background black -shadow 35x24+0+12 \) \
  +swap -background none -layers merge +repage \
  "$output"

printf 'wrote %s (%s)\n' "$output" "$(magick identify -format '%wx%h' "$output")"
