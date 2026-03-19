/**
 * File Conversion Skill - Convert images and files between formats
 *
 * Supports image conversion (PNG, JPG, WebP, GIF, BMP, TIFF)
 * Uses Sharp library for image processing.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

import type { Skill, SkillContext, SkillResult } from "./types";

const SUPPORTED_IMAGE_FORMATS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "tiff",
  "avif",
] as const;

type ImageFormat = (typeof SUPPORTED_IMAGE_FORMATS)[number];

function resolveOutputPath(
  inputPath: string,
  targetFormat: string,
  outputDir?: string,
): string {
  const dir = outputDir || path.dirname(inputPath);
  const basename = path.basename(inputPath, path.extname(inputPath));
  return path.join(dir, `${basename}.${targetFormat}`);
}

function getSharpFormat(format: ImageFormat): keyof sharp.FormatEnum {
  const formatMap: Record<ImageFormat, keyof sharp.FormatEnum> = {
    png: "png",
    jpg: "jpeg",
    jpeg: "jpeg",
    webp: "webp",
    gif: "gif",
    bmp: "png", // BMP not directly supported, fallback to PNG
    tiff: "tiff",
    avif: "avif",
  };
  return formatMap[format] || "png";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createFileConversionSkill(): Skill {
  return {
    meta: {
      id: "file-conversion",
      name: "File Conversion",
      version: "1.0.0",
      description:
        "Convert images between formats (PNG, JPG, WebP, GIF, etc.). Also supports image resizing.",
      author: "Clippy",
      categories: ["utilities", "media"],
      keywords: ["convert", "image", "resize", "format", "png", "jpg", "webp"],
      enabledByDefault: true,
    },

    actions: {
      convert_image: {
        meta: {
          name: "convert_image",
          description:
            'Convert an image file to a different format. Example: "convert photo.png to jpg", "change image to webp"',
          parameters: {
            type: "object",
            properties: {
              input_path: {
                type: "string",
                description: "Path to the input image file",
              },
              output_format: {
                type: "string",
                description:
                  "Target format: png, jpg, jpeg, webp, gif, tiff, avif",
              },
              quality: {
                type: "number",
                description:
                  "Output quality 1-100 (default: 85, only for lossy formats)",
              },
              output_dir: {
                type: "string",
                description:
                  "Output directory (optional, defaults to same as input)",
              },
            },
            required: ["input_path", "output_format"],
          },
          riskLevel: "low",
        },
        execute: async (
          args: Record<string, unknown>,
          context: SkillContext,
        ): Promise<SkillResult> => {
          const inputPath = String(args.input_path || "").trim();
          const outputFormat = String(args.output_format || "")
            .trim()
            .toLowerCase() as ImageFormat;
          const quality = Math.min(100, Math.max(1, Number(args.quality) || 85));
          const outputDir = args.output_dir
            ? String(args.output_dir)
            : undefined;

          if (!inputPath) {
            return { success: false, error: "Please provide an input file path" };
          }

          if (!SUPPORTED_IMAGE_FORMATS.includes(outputFormat)) {
            return {
              success: false,
              error: `Unsupported format: "${outputFormat}". Supported: ${SUPPORTED_IMAGE_FORMATS.join(", ")}`,
            };
          }

          try {
            // Resolve input path
            let resolvedInput = inputPath;
            if (!path.isAbsolute(resolvedInput)) {
              resolvedInput = path.resolve(context.homePath, resolvedInput);
            }

            if (!fs.existsSync(resolvedInput)) {
              return {
                success: false,
                error: `Input file not found: ${inputPath}`,
              };
            }

            const stats = fs.statSync(resolvedInput);
            if (stats.size > 50 * 1024 * 1024) {
              return {
                success: false,
                error: "File too large (max 50MB)",
              };
            }

            // Process with Sharp
            const outputPath = resolveOutputPath(
              resolvedInput,
              outputFormat,
              outputDir,
            );
            const format = getSharpFormat(outputFormat);

            let pipeline = sharp(resolvedInput);

            if (format === "jpeg" || format === "webp" || format === "avif") {
              pipeline = pipeline.jpeg
                ? pipeline.toFormat(format, { quality })
                : pipeline.toFormat(format, { quality });
            } else {
              pipeline = pipeline.toFormat(format);
            }

            await pipeline.toFile(outputPath);

            const outputStats = fs.statSync(outputPath);

            return {
              success: true,
              output: [
                `✅ Image converted successfully!`,
                ``,
                `📄 Input: ${path.basename(resolvedInput)} (${formatFileSize(stats.size)})`,
                `📄 Output: ${path.basename(outputPath)} (${formatFileSize(outputStats.size)})`,
                `🔄 Format: ${path.extname(resolvedInput)} → .${outputFormat}`,
                `📁 Saved to: ${outputPath}`,
              ].join("\n"),
              data: {
                inputPath: resolvedInput,
                outputPath,
                format: outputFormat,
                originalSize: stats.size,
                newSize: outputStats.size,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: `Conversion failed: ${error}`,
            };
          }
        },
      },

      resize_image: {
        meta: {
          name: "resize_image",
          description:
            'Resize an image to specified dimensions. Example: "resize photo.png to 800x600", "make thumbnail 200x200"',
          parameters: {
            type: "object",
            properties: {
              input_path: {
                type: "string",
                description: "Path to the input image file",
              },
              width: {
                type: "number",
                description: "Target width in pixels",
              },
              height: {
                type: "number",
                description: "Target height in pixels (optional, maintains aspect ratio if omitted)",
              },
              fit: {
                type: "string",
                description:
                  "Resize mode: cover, contain, fill, inside, outside (default: cover)",
              },
              output_path: {
                type: "string",
                description: "Output file path (optional)",
              },
            },
            required: ["input_path", "width"],
          },
          riskLevel: "low",
        },
        execute: async (
          args: Record<string, unknown>,
          context: SkillContext,
        ): Promise<SkillResult> => {
          const inputPath = String(args.input_path || "").trim();
          const width = Number(args.width) || 0;
          const height = args.height ? Number(args.height) : undefined;
          const fit = String(args.fit || "cover") as keyof sharp.FitEnum;
          const outputPath = args.output_path
            ? String(args.output_path)
            : undefined;

          if (!inputPath) {
            return { success: false, error: "Please provide an input file path" };
          }

          if (width <= 0 || width > 10000) {
            return {
              success: false,
              error: "Width must be between 1 and 10000 pixels",
            };
          }

          try {
            let resolvedInput = inputPath;
            if (!path.isAbsolute(resolvedInput)) {
              resolvedInput = path.resolve(context.homePath, resolvedInput);
            }

            if (!fs.existsSync(resolvedInput)) {
              return {
                success: false,
                error: `Input file not found: ${inputPath}`,
              };
            }

            const stats = fs.statSync(resolvedInput);
            const ext = path.extname(resolvedInput);
            const finalOutput =
              outputPath ||
              path.join(
                path.dirname(resolvedInput),
                `${path.basename(resolvedInput, ext)}_resized${ext}`,
              );

            await sharp(resolvedInput)
              .resize(width, height, { fit })
              .toFile(finalOutput);

            const outputStats = fs.statSync(finalOutput);
            const metadata = await sharp(finalOutput).metadata();

            return {
              success: true,
              output: [
                `✅ Image resized successfully!`,
                ``,
                `📄 Input: ${path.basename(resolvedInput)}`,
                `📄 Output: ${path.basename(finalOutput)}`,
                `📐 Size: ${metadata.width}x${metadata.height}px`,
                `📁 Saved to: ${finalOutput}`,
              ].join("\n"),
              data: {
                inputPath: resolvedInput,
                outputPath: finalOutput,
                width: metadata.width,
                height: metadata.height,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: `Resize failed: ${error}`,
            };
          }
        },
      },

      get_image_info: {
        meta: {
          name: "get_image_info",
          description:
            'Get information about an image file (dimensions, format, size). Example: "info about photo.png"',
          parameters: {
            type: "object",
            properties: {
              input_path: {
                type: "string",
                description: "Path to the image file",
              },
            },
            required: ["input_path"],
          },
          riskLevel: "low",
        },
        execute: async (
          args: Record<string, unknown>,
          context: SkillContext,
        ): Promise<SkillResult> => {
          const inputPath = String(args.input_path || "").trim();

          if (!inputPath) {
            return { success: false, error: "Please provide a file path" };
          }

          try {
            let resolvedInput = inputPath;
            if (!path.isAbsolute(resolvedInput)) {
              resolvedInput = path.resolve(context.homePath, resolvedInput);
            }

            if (!fs.existsSync(resolvedInput)) {
              return {
                success: false,
                error: `File not found: ${inputPath}`,
              };
            }

            const stats = fs.statSync(resolvedInput);
            const metadata = await sharp(resolvedInput).metadata();

            return {
              success: true,
              output: [
                `🖼️ Image Information`,
                ``,
                `📄 File: ${path.basename(resolvedInput)}`,
                `📐 Dimensions: ${metadata.width}x${metadata.height}px`,
                `🎨 Format: ${metadata.format?.toUpperCase()}`,
                `💾 Size: ${formatFileSize(stats.size)}`,
                `🌈 Channels: ${metadata.channels}`,
                metadata.density ? `📏 DPI: ${metadata.density}` : "",
              ]
                .filter(Boolean)
                .join("\n"),
              data: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: stats.size,
                channels: metadata.channels,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: `Failed to read image info: ${error}`,
            };
          }
        },
      },
    },

    async init(_context: SkillContext) {
      console.log("[File Conversion Skill] Initialized");
    },
  };
}