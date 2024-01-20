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
    TimeScale,
    Filler
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from "chartjs-plugin-zoom";

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
        TimeScale,
        annotationPlugin,
        Filler,
        zoomPlugin
    )

})