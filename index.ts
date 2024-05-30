// index.ts

import dotenv from 'dotenv';
dotenv.config();
import { fetchFromNotion } from './notion';
import { createWebflowCollectionItem } from './webflow';

interface PageContent {
    title: string;
    body: string;
    metaDescription?: string;
    shortDescription?: string;
    featuredSentence?: string;
}

// Main function to orchestrate the workflow
async function main() {
    try {
        const notionData: PageContent[] = await fetchFromNotion();
        console.log('Fetched data from Notion:', notionData);

        for (let page of notionData) {
            console.log('Processing Page Data:', page);

            const updatedData = {
                title: page.title,
                body: page.body,
                metaDescription: page.metaDescription,
                shortDescription: page.shortDescription,
                featuredSentence: page.featuredSentence,
            };

            const response = await createWebflowCollectionItem(updatedData);
            if (response && response._id) {
                console.log(`Successfully created Webflow item with ID: ${response._id}`);
            } else {
                console.log('Failed to create Webflow item:', response);
            }
        }
    } catch (error) {
        console.error('Error running the automation:', error);
    }
}

main();
