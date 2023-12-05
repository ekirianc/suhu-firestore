import {defineNuxtPlugin} from "nuxt/app";
import {
    Chart,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale
} from 'chart.js'

export default defineNuxtPlugin(() => {
    Chart.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend,
        PointElement,
        LineElement,
        TimeScale
    )
})