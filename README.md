# Reduce Image Tool


## Purpose

Reduce Image Tool optimizes image files at the expense of resolution and quality. The goal is to produce
images barely tolerable for mobile web browsing.

This tool is not suitable for optimizing UI images. Think of it more as something intended
for compressing blog photos, for example.


## Prerequisites

Requires either [GraphicsMagic](http://www.graphicsmagick.org/) or [ImageMagick](http://www.imagemagick.org/).
 
Both libraries can generally be found from default package repositories and can be installed with 
`yum install GraphicsMagick`, `apt install graphicsmagick`, or  `brew install graphicsmagick`,
depending on your operating system.

If ImageMagick is used, `--imagick` parameter must be included to instruct the tool to use ImageMagick. 


## Installation

```bash
npm install -g reduce-image
```

## Usage

```bash
reduce-image --source-path PATH --dest-path PATH [--max-width WIDTH] [--max-height HEIGHT] \
    [--min-size-reduction 0-100] [--quality 0-100] [--flexible-format] \
    [--force-direct-color-output-format gif|jpg|png|webp] \
    [--force-indexed-color-output-format gif|jpg|png|webp] \
    [--direct-color-bit-depth 1|2|3|4|5|6|7|8|12|16] [--indexed-color-bit-depth 1-8] \
    [--jpeg-blur 0.1-100] [--force-png-to-indexed] [--force-png-to-jpg] \
    [--gzip-svg] [--force-svg-to-png] [--imagick] \
    [--full-optimization] [--recursive] [--verbose]
```

## Examples

```bash
reduce-image --source-path /source/path --dest-path /target/path --full-optimization --gzip-svg

reduce-image --source-path /source/path --dest-path /target/path --max-width 420 \
        --max-height 600 --min-size-reduction 30 --quality 20 --direct-color-bit-depth 8 \
        --indexed-color-bit-depth 5 --force-png-to-indexed --jpeg-blur 2 --verbose
```


## Options

Option                                        | Description 
:---------------------------------------------|:-------------
`--dest-path PATH`                            | Save processed images to `PATH`
`--direct-color-bit-depth DEPTH`              | Reduce/quantize colors of direct color images to `DEPTH` bits per channel (1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16)
`--flexibleFormat`                            | If specified, allow output file to be saved in different format if it produces a smaller file (poorly supported)
`--force-direct-color-output-format FORMAT`   | Save all direct color images in `FORMAT` format (gif, jpg, png, webp)
`--force-indexed-color-output-format FORMAT`  | Save all indexed color images in `FORMAT` format (gif, jpg, png, webp)
`--force-png-to-indexed`                      | If specified, convert all PNG files into indexed color depth
`--force-png-to-jpg`                          | If specified, convert all *direct color* PNG files to JPGs
`--force-svg-to-png`                          | If specified, convert all SVG files to PNG files
`--full-optimization`                         | Implies `--max-width 420 --max-height 600 --min-size-reduction 30 --quality 20 --direct-color-bit-depth 8 --indexed-color-bit-depth 5 --force-png-to-indexed --jpeg-blur 2 --recursive`
`--gzip-svg`                                  | If specified, all SVG files are gzipped
`--imagick`                                   | Use ImageMagick instead of GraphicsMagick
`--indexed-color-bit-depth DEPTH`             | Reduce/quantize indexed color images to `DEPTH` bits (1-8)
`--jpeg-blur BLUR`                            | Blur jpeg images before compression for better compression ratio (0.1-100)
`--max-height HEIGHT`                         | Limit image height to `HEIGHT` pixels; resize implied
`--max-width WIDTH`                           | Limit image width to `WIDTH` pixels; resize implied
`--min-size-reduction PERCENT`                | Always reduce image size at least `PERCENT` percent (0-100), even images which size is within `maxWidth` and `maxHeight` boundaries
`--quality QUALITY`                           | Set default compression quality to `QUALITY` (0-100; 0 - worst, 100 - best)
`--source-path PATH`                          | Read images from `PATH`
`--recursive`                                 | Scan `source-path` recursively
`--verbose`                                   | Output more
`--help`, `-h`                                | Print help and exit
`--version`, `-v`                             | Print version and exit


## How It Works

Reduce Image Tool iterates (recursively or not) through the files and subdirectories in `sourcePath`, resizing and recompressing
any image it can find, and saving the resulting images to `destPath`.


## Supported Formats

* PNG
* GIF
* JPG
* WEBP
* SVG


## Exit Codes

On successful run, exit code 0 is returned. Otherwise, exit code 1 is used.


## License

[BSD 3-clause License](https://spdx.org/licenses/BSD-3-Clause)
