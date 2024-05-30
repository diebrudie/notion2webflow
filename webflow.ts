// webflow.ts
import fetch from 'node-fetch';
import showdown from 'showdown';

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN!;
const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID!;
const WEBFLOW_BASE_URL = 'https://api.webflow.com';

interface WebflowItem {
    title: string;
    body: string;
    metaDescription?: string;
    shortDescription?: string;
    featuredSentence?: string;
}


export async function createWebflowCollectionItem(data: WebflowItem) {
    const converter = new showdown.Converter();
    const htmlBody = converter.makeHtml(data.body);

    const url = `${WEBFLOW_BASE_URL}/v2/collections/${WEBFLOW_COLLECTION_ID}/items`;
    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${WEBFLOW_API_TOKEN}`
        },
        body: JSON.stringify({
            isArchived: false,
            isDraft: true,
            fieldData: {
                name: data.title,                
                'blog-content-rich-text': htmlBody
            }
        })
    };

    try {
        const response = await fetch(url, options);
        const json = await response.json();
        if (!response.ok) {
            throw new Error(`Error creating Webflow collection item: ${json.msg || 'Unknown error'}`);
        }
        return json;
    } catch (err) {
        if (err instanceof Error) {
            console.error('Error:', err.message);
        } else {
            console.error('Unknown error:', err);
        }
        throw err;
    }
}