import { Node } from '../types/types';

const LOREM_IPSUM = "Description pending.";

export const contentTree: Node = {
    id: 'root',
    type: 'category',
    title: 'Martin Nanni',
    description: `Portfolio & Mind Map`,
    children: [
        {
            id: 'games',
            type: 'category',
            title: 'Games',
            description: 'Interactive Play',
            children: [
                {
                    id: 'board-games',
                    type: 'category',
                    title: 'Board Games',
                    children: [
                        {
                            id: 'dungeon-tavern',
                            type: 'project',
                            title: 'Dungeon Tavern',
                            description: 'A co-op management game.',
                            content: `
**Dungeon Tavern** is a cooperative resource management game where players run a tavern for adventurers effectively.

### Key Features
- **Co-op Gameplay**: Work together to serve customers.
- **Resource Management**: Balance food, drink, and seating.
- **Upgrades**: Improve your tavern over time.

### Tech Stack
* Built with Unity
* C# scripting
                            `,
                            gallery: [
                                'https://placehold.co/800x400/111827/06b6d4?text=Gameplay+Screenshot+1',
                                'https://placehold.co/800x400/0f172a/06b6d4?text=Gameplay+Screenshot+2',
                                'https://placehold.co/800x400/312e81/06b6d4?text=Menu+UI'
                            ]
                        },
                        { id: 'blade-master', type: 'project', title: 'Blade Master', description: LOREM_IPSUM },
                        { id: 'conspiracy-theory', type: 'project', title: 'Conspiracy Theory', description: LOREM_IPSUM },
                        { id: 'voc', type: 'project', title: 'VOC', description: LOREM_IPSUM },
                        { id: 'aqueduct', type: 'project', title: 'Aqueduct', description: LOREM_IPSUM },
                        { id: 'mapitos', type: 'project', title: 'Mapitos', description: LOREM_IPSUM },
                        { id: 'orc-dice', type: 'project', title: 'Orc Dice', description: LOREM_IPSUM },
                        { id: 'dungeon-explorer', type: 'project', title: 'Dungeon Explorer', description: LOREM_IPSUM },
                        { id: 'space-cowboy', type: 'project', title: 'Space Cowboy', description: LOREM_IPSUM },
                    ]
                },
                {
                    id: 'video-games',
                    type: 'category',
                    title: 'Video Games',
                    children: [
                        { id: 'spin', type: 'project', title: 'Spin', description: LOREM_IPSUM },
                        { id: 'jurassic', type: 'project', title: 'Jurassic', description: LOREM_IPSUM },
                        { id: 'wurds', type: 'project', title: 'Wurds', description: LOREM_IPSUM },
                        { id: 'alchemy', type: 'project', title: 'Alchemy', description: LOREM_IPSUM },
                        { id: 'tavernator', type: 'project', title: 'Tavernator', description: LOREM_IPSUM },
                    ]
                }

            ]
        },
        {
            id: 'experiments',
            type: 'category',
            title: 'Experiments',
            children: [
                { id: 'city-scape', type: 'experiment', title: 'City Scape', description: LOREM_IPSUM, experimentUrl: 'https://stonecallstudio.com/JSTests/City_Scape/index.html' },
                { id: 'microbial-growth', type: 'experiment', title: 'Microbial Growth', description: LOREM_IPSUM, experimentUrl: 'https://stonecallstudio.com/JSTests/Microbial_Growth/index.html' },
                { id: 'music-visualizer', type: 'experiment', title: 'Music Visualizer', description: LOREM_IPSUM },
                { id: 'net', type: 'experiment', title: 'Net', description: LOREM_IPSUM },
                { id: 'touch-dots', type: 'experiment', title: 'Touch Dots', description: LOREM_IPSUM },
                { id: 'constellations', type: 'experiment', title: 'Constellations', description: LOREM_IPSUM },
                { id: 'cube', type: 'experiment', title: 'Cube', description: LOREM_IPSUM },
                { id: 'not-webgl', type: 'category', title: 'Not WebGL' },
                { id: 'still-not-webgl', type: 'experiment', title: 'Still Not WebGL', description: LOREM_IPSUM },
                { id: 'sketch', type: 'experiment', title: 'Sketch', description: LOREM_IPSUM },
                { id: 'color-particles', type: 'experiment', title: 'Color Particles', description: LOREM_IPSUM },
                { id: 'mandelbrot', type: 'experiment', title: 'Mandelbrot', description: LOREM_IPSUM },
                { id: 'metaballs', type: 'experiment', title: 'Metaballs', description: LOREM_IPSUM },
                { id: 'screensaver', type: 'experiment', title: 'Screensaver', description: LOREM_IPSUM },
                { id: 'shadows', type: 'experiment', title: 'Shadows', description: LOREM_IPSUM },
            ]
        },
        {
            id: 'thoughts',
            type: 'category',
            title: 'Thoughts',
            description: 'Essays & Musings',
            children: [{
                id: 'design-philosophy',
                type: 'category',
                title: 'Design Philosophy',
                children: [
                    { id: 'system-theme', type: 'project', title: 'System>Theme', description: LOREM_IPSUM },
                    { id: 'incentives', type: 'project', title: 'Incentives Create Behaviors', description: LOREM_IPSUM },
                    { id: 'resource-balancing', type: 'project', title: 'Resource and Balancing', description: LOREM_IPSUM },


                    { id: 'skill-vs-luck', type: 'project', title: 'Skill vs Luck', description: LOREM_IPSUM },
                    { id: 'favor-laggard', type: 'project', title: 'Favor the laggard', description: LOREM_IPSUM },
                    { id: 'choice-variety', type: 'project', title: 'Choice variety creates depth', description: LOREM_IPSUM },


                ]
            }]
        },
        {
            id: 'about',
            type: 'category',
            title: 'About',
            description: 'Background & Contact',
            children: []
        }
    ],
};
