import { DynamicColor, DynamicScheme, MaterialDynamicColors, hexFromArgb } from "@material/material-color-utilities";
import { getPalette, Palette } from "./colorthief";

const validImageExtensions = {
    "png": true,
    "jpg": true,
    "jpeg": true
}

// theme generation helper functions
export const getCustomThemeStylesheet = (
    scheme: DynamicScheme
) => {

    const lines = []

    for (const key in MaterialDynamicColors) {
        const dynamicColor = MaterialDynamicColors[key as keyof typeof MaterialDynamicColors]
        if (dynamicColor instanceof DynamicColor) {
            lines.push(`--md-sys-color-${key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}: ${hexFromArgb(dynamicColor.getArgb(scheme))} !important;`)
        }
    }

    return lines
}

function rgbToHsv([r, g, b]: Palette): Palette {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, v];
}

export const getMostVibrantColor = (
    colors: Palette[]
): Palette => {
    let mostVibrantColor: Palette = [0, 0, 0];
    let maxSaturation = 0;
    let maxValue = 0;

    for (const color of colors) {
        const [h, s, v] = rgbToHsv(color);

        // Check if the current color has higher saturation and value than the current most vibrant color
        if (s > maxSaturation || (s === maxSaturation && v > maxValue)) {
            maxSaturation = s;
            maxValue = v;
            mostVibrantColor = color;
        }
    }

    return mostVibrantColor;
}

const getImageUrlType = (
    imageUrl: string
): string | null => {
    const imageFileName = imageUrl.split("/").pop() ?? "";
    const withoutQuery = imageFileName.split("?")[0] ?? "";
    const imageExtension = withoutQuery.split(".").pop();
    
    return imageExtension !== undefined && validImageExtensions[imageExtension as keyof typeof validImageExtensions] 
        ? `image/${imageExtension}` 
        : null
}

export const getImageMostVibrantColor = (
    imageUrl: string
): Promise<Palette> => {
    
    return new Promise<Palette>((resolve, reject) => {
        const imageUrlType = getImageUrlType(imageUrl)
        if (imageUrlType === null) {
            return reject(`image extension is invalid (${imageUrl}). Must be one of [ ${Object.keys(validImageExtensions).join(", ")} ]`)
        }

        // load image
        fetch(imageUrl)
            .then(response => response.arrayBuffer())
            .then(arrayBuf => Buffer.from(arrayBuf))
            .then(imageBuf => getPalette(imageBuf))
            .then(palette => {
                resolve(getMostVibrantColor(palette ?? []))
            })
            .catch(error => reject(error));
    })
}