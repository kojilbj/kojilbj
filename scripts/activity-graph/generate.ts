import * as fs from 'fs';
import * as path from 'path';
import { Fetcher } from './fetcher';
import { Utilities } from './utils';

async function main() {
    const username = process.env.GH_USERNAME || 'kojilbj';

    const utils = new Utilities({
        username,
        theme: 'github-dark-dimmed',
        custom_title: "Koji's Activity Graph",
        hide_border: true,
    });

    const queryOptions = utils.queryOptions();
    const fetcher = new Fetcher(utils.username);
    const calendarData = await fetcher.fetchContributions(
        queryOptions.days,
        queryOptions.from,
        queryOptions.to,
    );

    if (typeof calendarData === 'string') {
        throw new Error(`Failed to fetch contributions: ${calendarData}`);
    }

    const { finalGraph } = await utils.buildGraph(calendarData);

    const outPath = path.join(__dirname, '..', '..', 'assets', 'activity-graph.svg');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, finalGraph.trim() + '\n');
    console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
