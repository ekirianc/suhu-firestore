export const toggleColorMode = (colorMode: {preference: string}) => {
    const colorModes = ['light', 'dark'];

    // Get the current index of the current color mode
    const currentIndex = colorModes.indexOf(colorMode.preference);

    // Calculate the next index, cycling back to 0 if at the end
    const nextIndex = (currentIndex + 1) % colorModes.length;

    colorMode.preference = colorModes[nextIndex];
};
