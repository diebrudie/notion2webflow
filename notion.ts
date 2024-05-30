// notion.ts

import axios from 'axios';

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const NOTION_BASE_URL = 'https://api.notion.com/v1';
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

interface PageContent {
    title: string;
    body: string;
    [key: string]: any; // Allow for additional properties
}

// Function to fetch data from Notion with a status filter
export async function fetchFromNotion(): Promise<PageContent[]> {
    try {
        const response = await axios.post(`${NOTION_BASE_URL}/databases/${DATABASE_ID}/query`, {
            filter: {
                property: 'Status',
                status: {
                    equals: 'Ready for Webflow'
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28'
            }
        });

        const pages = response.data.results;
        const pageContents: PageContent[] = [];

        for (let page of pages) {
            const pageId = page.id;
            const pageBody = await fetchAllBlocks(pageId);

            const titleProperty = page.properties?.Name?.title;
            const titleText = titleProperty && titleProperty[0] ? titleProperty[0].plain_text : 'Untitled';

            pageContents.push({
                title: titleText,
                body: pageBody,
            });

            console.log(`Fetched data for page ${pageId}:`, {
                title: titleText,
                body: pageBody.slice(0, 100) + '...', // Log only the first 100 characters of the body for brevity
            });
        }

        return pageContents;
    } catch (error) {
        console.error('Error fetching data from Notion:', error);
        throw error;
    }
}

// Helper function to fetch all blocks of a page
async function fetchAllBlocks(pageId: string): Promise<string> {
    let blocks: any[] = [];
    let hasMore = true;
    let startCursor: string | null = null;

    while (hasMore) {
        const response: { data: { results: any[], has_more: boolean, next_cursor: string | null } } = await axios.get(`${NOTION_BASE_URL}/blocks/${pageId}/children`, {
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28'
            },
            params: {
                start_cursor: startCursor
            }
        });

        blocks = blocks.concat(response.data.results);
        hasMore = response.data.has_more;
        startCursor = response.data.next_cursor;
    }

    return blocks.map((block: any) => {
        return extractBlockContent(block);
    }).join('\n');
}

// Helper function to extract content from a block
function extractBlockContent(block: any): string {
    let content = '';

    const richTextToString = (richTextArray: any[]) => {
        return richTextArray.map((textObj: any) => {
            if (textObj.type === 'text') {
                const textContent = textObj.text.content;
                const link = textObj.text.link;
                if (link) {
                    return `[${textContent}](${link.url})`;
                } else {
                    return textContent;
                }
            }
            return '';
        }).join('');
    };

    if (block.type === 'paragraph') {
        content = richTextToString(block.paragraph.rich_text);
    } else if (block.type === 'heading_1') {
        content = `# ${richTextToString(block.heading_1.rich_text)}`;
    } else if (block.type === 'heading_2') {
        content = `## ${richTextToString(block.heading_2.rich_text)}`;
    } else if (block.type === 'heading_3') {
        content = `### ${richTextToString(block.heading_3.rich_text)}`;
    } else if (block.type === 'bulleted_list_item') {
        content = `- ${richTextToString(block.bulleted_list_item.rich_text)}`;
    } else if (block.type === 'numbered_list_item') {
        content = `1. ${richTextToString(block.numbered_list_item.rich_text)}`;
    } else if (block.type === 'to_do') {
        content = `- [${block.to_do.checked ? 'x' : ' '}] ${richTextToString(block.to_do.rich_text)}`;
    } else if (block.type === 'code') {
        content = `\`\`\`${block.code.language}\n${richTextToString(block.code.rich_text)}\n\`\`\``;
    } else if (block.type === 'image') {
        const imageUrl = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        content = `![Image](${imageUrl})`;
    } else if (block.type === 'quote') {
        content = `> ${richTextToString(block.quote.rich_text)}`;
    } else if (block.type === 'callout') {
        content = `> ${richTextToString(block.callout.rich_text)}`;
    } else if (block.type === 'divider') {
        content = '---';
    } else if (block.type === 'table') {
        const tableRows = block.table.children.map((row: any) => {
            return row.table_row.cells.map((cell: any) => richTextToString(cell.rich_text)).join(' | ');
        }).join('\n');
        content = tableRows;
    } else if (block.type === 'bookmark') {
        content = `[Bookmark](${block.bookmark.url})`;
    } else {
        content = `Unsupported block type: ${block.type}`;
    }

    return content;
}
