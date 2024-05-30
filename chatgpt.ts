// chatgpt.ts
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY
});

if (!openai.apiKey) {
    throw new Error('OPENAI_API_KEY or CHATGPT_API_KEY is not set in environment variables');
}

export async function generateMetaDescription(title: string, body: string): Promise<string> {
    const prompt = `
        The GPT's role is to act as an SEO specialist copywriter.
        Generate a Meta Description within 155-200 characters.
        Title: ${title}
        Body: ${body}
    `;

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Failed to generate content');
    }

    return content.trim();
}
