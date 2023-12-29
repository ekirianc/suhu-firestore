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
    // Colors
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation';

interface LegendItem {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    hidden: boolean;
    text: string;
    fontColor: string;
    index: number;
    datasetIndex: number;
}

const getOrCreateLegendList = (chart: any, id: string): HTMLUListElement => {
    const legendContainer = document.getElementById(id) as HTMLDivElement;
    let listContainer = legendContainer.querySelector('ul') as HTMLUListElement;

    if (!listContainer) {
        listContainer = document.createElement('ul');
        listContainer.style.display = 'flex';
        listContainer.style.flexWrap = 'wrap';
        listContainer.style.justifyContent = 'center';
        listContainer.style.margin = '0';
        listContainer.style.padding = '0';

        legendContainer.appendChild(listContainer);
    }

    return listContainer;
};

const htmlLegendPlugin = {
    id: 'htmlLegend',
    afterUpdate(chart: any, args: any, options: { containerID: string }): void {
        const ul = getOrCreateLegendList(chart, options.containerID);

        // Remove old legend items
        while (ul.firstChild) {
            ul.firstChild.remove();
        }

        // Reuse the built-in legendItems generator
        const items: LegendItem[] = chart.options.plugins.legend.labels.generateLabels(chart);

        items.forEach(item => {
            const li = document.createElement('li') as HTMLLIElement;
            li.style.alignItems = 'center';
            li.style.cursor = 'pointer';
            li.style.display = 'flex';
            li.style.flexDirection = 'row';
            li.style.marginLeft = '10px';

            li.onclick = () => {
                const { type } = chart.config;
                if (type === 'pie' || type === 'doughnut') {
                    // Pie and doughnut charts only have a single dataset and visibility is per item
                    chart.toggleDataVisibility(item.index);
                } else {
                    chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
                }
                chart.update();
            };

            // Color box
            const boxSpan = document.createElement('span') as HTMLSpanElement;
            boxSpan.style.background = item.fillStyle;
            boxSpan.style.borderColor = item.strokeStyle;
            boxSpan.style.borderWidth = item.lineWidth + 'px';
            boxSpan.style.display = 'inline-block';
            boxSpan.style.flexShrink = '0';
            boxSpan.style.height = '20px';
            boxSpan.style.marginRight = '10px';
            boxSpan.style.width = '20px';

            // Text
            const textContainer = document.createElement('p') as HTMLParagraphElement;
            // textContainer.style.color = item.fontColor;
            textContainer.style.margin = '0';
            textContainer.style.padding = '0';
            textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

            const text = document.createTextNode(item.text);
            textContainer.appendChild(text);

            li.appendChild(boxSpan);
            li.appendChild(textContainer);
            ul.appendChild(li);
        });
    }
};


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
        htmlLegendPlugin,
        // Colors
    )
})