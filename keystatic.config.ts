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
                    description: 'Categories are structural. Articles contain content.',
                    options: [
                        { label: 'Category', value: 'category' },
                        { label: 'Article', value: 'article' },
                    ],
                    defaultValue: 'article',
                }),
                label: fields.text({
                    label: 'Label',
                    description: 'Displayed tag (e.g. Project, Experiment, App)',
                    defaultValue: 'Project',
                }),
                status: fields.select({
                    label: 'Status',
                    options: [
                        { label: 'None', value: '' },
                        { label: 'Concept', value: 'concept' },
                        { label: 'Prototype', value: 'prototype' },
                        { label: 'Production', value: 'production' },
                        { label: 'Archived', value: 'archived' },
                    ],
                    defaultValue: '',
                }),
                description: fields.text({
                    label: 'Short Description',
                    multiline: true,
                }),
                iframeConfig: fields.object({
                    url: fields.url({
                        label: 'Iframe URL',
                        description: 'Optional. If set, creates a sidecar preview.'
                    }),
                    orientation: fields.select({
                        label: 'Orientation',
                        options: [
                            { label: 'Desktop (800x600)', value: 'desktop' },
                            { label: 'Mobile (450x800)', value: 'mobile' },
                        ],
                        defaultValue: 'desktop',
                    }),
                }),
                parent: fields.relationship({
                    label: 'Parent Node',
                    description: 'The category or project this belongs to (Leave empty for Root)',
                    collection: 'nodes',
                }),
                gallery: fields.array(
                    fields.url({ label: 'Image URL' }),
                    {
                        label: 'Gallery Images',
                        itemLabel: props => props.value || 'Image URL'
                    }
                ),
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
