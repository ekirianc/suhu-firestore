// https://github.com/Latitude-Cartagene/luminance-js#readme
export const luminance = (color = "ffffff") => {
    let RsRGB, GsRGB, BsRGB, R, G, B

    if (color.length === 0) {
        color = "ffffff"
    }

    // Validate hex color
    color = String(color).replace(/[^0-9a-f]/gi, "")
    const valid = new RegExp(/^(?:[0-9a-f]{3}){1,2}$/i).test(color)

    if (valid) {
        if (color.length < 6) {
            color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
        }
    } else {
        throw new Error("Invalid HEX color !")
    }

    // Convert color to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)

    if (result) {
        const rgb = {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };

        RsRGB = rgb.r / 255
        GsRGB = rgb.g / 255
        BsRGB = rgb.b / 255

        R = RsRGB <= 0.03928 ? RsRGB / 12.92 : Math.pow(((RsRGB + 0.055) / 1.055), 2.4)
        G = GsRGB <= 0.03928 ? GsRGB / 12.92 : Math.pow(((GsRGB + 0.055) / 1.055), 2.4)
        B = BsRGB <= 0.03928 ? BsRGB / 12.92 : Math.pow(((BsRGB + 0.055) / 1.055), 2.4)

        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B)
    } else {
        throw new Error("Invalid HEX color !");
    }
}