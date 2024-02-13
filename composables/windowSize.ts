
export function windowSize()  {
    const { width } = useWindowSize()

    const SMALL_SCREEN = 480
    const MD_SCREEN = 768
    const XL_SCREEN = 1280

    const isSmallScreen = ref(width.value < SMALL_SCREEN)
    const isMediumScreen = ref(width.value < MD_SCREEN)
    const isLargeScreen = ref(width.value < XL_SCREEN)

    watch(width, (width) => {
        // to keep it responsive on window resize
        // specialized for option menu
        isSmallScreen.value = width < SMALL_SCREEN
        isMediumScreen.value = width < MD_SCREEN
        isLargeScreen.value = width < XL_SCREEN
    })

    return { width, isSmallScreen, isMediumScreen, isLargeScreen, SMALL_SCREEN, MD_SCREEN,XL_SCREEN }
}