# Reduce Image Tool


## Purpose

Reduce Image Tool optimizes image files at the expense of resolution and quality. The goal is to produce
images barely tolerable for mobile web browsing.


## Usage

```bash
reduce-image --source-path PATH --dest-path PATH [--max-width WIDTH] [--max-height HEIGHT] \
    [--min-size-reduction 0-100] [--quality 0-100] [--flexible-format] \
    [--force-direct-color-output-format gif|jpg|png|webp] \
    [--force-indexed-color-output-format gif|jpg|png|webp] \
    [--direct-color-bit-depth 1|2|4|8|15|16|18|24] [--indexed-color-bit-depth 1-8] \
    [--jpeg-blur 0.1-100] [--force-png-to-indexed] [--force-png-to-jpg] \
    [--recursive] [--verbose]
```


## Options

Option                                        | Description 
:---------------------------------------------|:-------------
`--dest-path PATH`                            | Save processed images to `PATH`
`--direct-color-bit-depth DEPTH`              | Reduce/quantize colors of direct color images to `DEPTH` bits (1, 2, 4, 8, 15, 16, 18, 24)
`--flexibleFormat`                            | If specified, allow output file to be saved in different format if it produces a smaller file
`--force-direct-color-output-format FORMAT`   | Save all direct color images in `FORMAT` format (gif, jpg, png, webp)
`--force-indexed-color-output-format FORMAT`  | Save all indexed color images in `FORMAT` format (gif, jpg, png, webp)
`--force-png-to-indexed`                      | If specified, convert all PNG files into indexed color depth
`--force-png-to-jpg`                          | If specified, convert all *direct color* PNG files to JPGs
`--indexed-color-bit-depth DEPTH`             | Reduce/quantize indexed color images to `DEPTH` bits (1-8)
`--jpeg-blur BLUR`                            | Blur jpeg images before compression for better compression ratio (0.1-100)
`--max-height HEIGHT`                         | Limit image height to `HEIGHT` pixels; resize implied
`--max-width WIDTH`                           | Limit image width to `WIDTH` pixels; resize implied
`--min-size-reduction PERCENT`                | Always reduce image size at least `PERCENT` percent (0-100), even for images which size is within `maxWidth` and `maxHeight` boundaries
`--quality QUALITY`                           | Set default compression quality to `QUALITY` (0-100; 0 - worst, 100 - best)
`--source-path PATH`                          | Read images from `PATH`
`--recursive`                                 | Scan `source-path` recursively
`--verbose`                                   | Output more


## How It Works

Reduce Image Tool iterates recursively through the files and subdirectories in `sourcePath`, resizing and recompressing
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
