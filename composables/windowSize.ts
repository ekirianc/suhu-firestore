
export function windowSize()  {
    const { width } = useWindowSize()

    const SMALL_SCREEN = 480
    const XL_SCREEN = 1280

    const isSmallScreen = ref(width.value < SMALL_SCREEN)
    const isLargeScreen = ref(width.value < XL_SCREEN)

    watch(width, (width) => {
        // to keep it responsive on window resize
        // specialized for option menu
        isSmallScreen.value = width < SMALL_SCREEN
        isLargeScreen.value = width < XL_SCREEN
    })

    return { width, isSmallScreen, isLargeScreen, SMALL_SCREEN, XL_SCREEN }
}