---
name: file-conversion
description: Convert images between formats (PNG, JPG, WebP, GIF, etc.) and resize images using Sharp
location: ~/.clippy/skills/file-conversion
version: 1.0.0
author: Clippy
categories: utilities, media
keywords: convert, image, resize, format, png, jpg, webp
enabledByDefault: true
---

# File Conversion Skill

Convert and manipulate image files with ease.

## Usage

Use the following commands in chat:

- `/convert <file> to <format>` — Convert image format
- `/resize <file> <width>x<height>` — Resize image
- `/imginfo <file>` — Get image information

## Actions

### convert_image

Convert an image file to a different format.

```json
{
  "properties": {
    "input_path": {
      "type": "string",
      "description": "Path to the input image file"
    },
    "output_format": {
      "type": "string",
      "description": "Target format: png, jpg, jpeg, webp, gif, tiff, avif"
    },
    "quality": {
      "type": "number",
      "description": "Output quality 1-100 (default: 85)"
    }
  },
  "required": ["input_path", "output_format"]
}
```

Risk level: low

### resize_image

Resize an image to specified dimensions.

```json
{
  "properties": {
    "input_path": {
      "type": "string",
      "description": "Path to the input image file"
    },
    "width": {
      "type": "number",
      "description": "Target width in pixels"
    },
    "height": {
      "type": "number",
      "description": "Target height in pixels (optional)"
    }
  },
  "required": ["input_path", "width"]
}
```

Risk level: low

### get_image_info

Get information about an image file.

```json
{
  "properties": {
    "input_path": {
      "type": "string",
      "description": "Path to the image file"
    }
  },
  "required": ["input_path"]
}
```

Risk level: low

## Examples

```
/convert photo.png to webp
/resize image.png 800x600
/imginfo photo.jpg
```
