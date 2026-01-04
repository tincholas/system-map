import { config, fields, collection } from '@keystatic/core';

export default config({
    storage: {
        kind: 'local',
    },
    collections: {
        nodes: collection({
            label: 'System Map Nodes',
            slugField: 'title',
            path: 'src/content/nodes/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                type: fields.select({
                    label: 'Node Type',
                    description: 'Structural role of this node',
                    options: [
                        { label: 'Category (Folder)', value: 'category' },
                        { label: 'Project', value: 'project' },
                        { label: 'Experiment', value: 'experiment' },
                        { label: 'Experiment Preview (Virtual)', value: 'experiment-preview' },
                        { label: 'Article (Thought)', value: 'article' },
                    ],
                    defaultValue: 'project',
                }),
                status: fields.select({
                    label: 'Status',
                    options: [
                        { label: 'Concept', value: 'concept' },
                        { label: 'Prototype', value: 'prototype' },
                        { label: 'Production', value: 'production' },
                    ],
                    defaultValue: 'concept',
                }),
                parent: fields.relationship({
                    label: 'Parent Node',
                    description: 'The category or project this belongs to (Leave empty for Root)',
                    collection: 'nodes',
                }),
                description: fields.text({
                    label: 'Description',
                    description: 'Short summary visible on the card',
                    multiline: true
                }),
                gallery: fields.array(
                    fields.url({ label: 'Image URL' }),
                    {
                        label: 'Gallery Images',
                        itemLabel: props => props.value || 'Image URL'
                    }
                ),
                experimentUrl: fields.url({
                    label: 'Experiment / Embed URL',
                    description: 'For experiments or previews only'
                }),
                content: fields.document({
                    label: 'Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                    images: {
                        directory: 'public/images/nodes',
                        publicPath: '/images/nodes/',
                    },
                }),
            },
        }),
    },
});
