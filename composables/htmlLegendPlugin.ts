
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

export const htmlLegendPlugin = {
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
            li.style.paddingLeft = '5px';
            li.style.paddingRight = '5px';
            li.style.borderRadius = '10px';

            // Add hover styles
            li.style.transition = 'background-color 0.1s';
            li.addEventListener('mouseover', () => {
                li.style.backgroundColor = 'rgba(117,117,117,0.22)';
            });
            li.addEventListener('mouseout', () => {
                li.style.backgroundColor = ''; // Reset the background color on mouseout
            });

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
            boxSpan.style.background = item.strokeStyle;
            boxSpan.style.borderColor = item.strokeStyle;
            boxSpan.style.borderWidth = item.lineWidth + 'px';
            boxSpan.style.borderRadius = '10px';
            boxSpan.style.display = 'flex';
            boxSpan.style.justifyContent = 'center';
            boxSpan.style.alignItems = 'center';
            boxSpan.style.flexShrink = '0';
            boxSpan.style.height = '2px';
            boxSpan.style.marginRight = '10px';
            boxSpan.style.width = '20px';

            // Circle in the middle
            const circleSpan = document.createElement('span') as HTMLSpanElement;
            circleSpan.style.borderRadius = '50%';
            circleSpan.style.background = item.strokeStyle;
            circleSpan.style.display = 'inline-block';
            circleSpan.style.height = '10px';
            circleSpan.style.width = '10px';

            boxSpan.appendChild(circleSpan);

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
