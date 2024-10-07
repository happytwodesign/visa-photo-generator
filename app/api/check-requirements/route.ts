import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Requirement {
  name: string;
  status: 'Pass' | 'Fail' | 'Semi Pass';
  message?: string;
}

const requirementNames = [
  "Head height between 70% and 80% of photo height",
  "Neutral facial expression",
  "Eyes open and clearly visible",
  "Face centered and looking straight at the camera",
  "Mouth closed",
  "No shadows on face or background",
  "No hair across eyes and the face",
  "No head covering (unless for religious reasons)",
  "No glare on glasses, or preferably, no glasses",
  "Plain light-colored background"
];

function parseOpenAIResponse(response: string): Requirement[] {
  const lines = response.split('\n');
  const requirements: Requirement[] = [];
  let currentRequirement: Partial<Requirement> = {};

  for (const line of lines) {
    const matchRequirement = requirementNames.find(name => line.toLowerCase().includes(name.toLowerCase()));
    if (matchRequirement) {
      if (Object.keys(currentRequirement).length > 0) {
        requirements.push(currentRequirement as Requirement);
      }
      currentRequirement = {
        name: matchRequirement,
        status: line.toLowerCase().includes('pass') ? 'Pass' : 
                line.toLowerCase().includes('semi pass') ? 'Semi Pass' : 'Fail'
      };
    } else if (currentRequirement.name && line.trim() !== '' && currentRequirement.status !== 'Pass') {
      currentRequirement.message = (currentRequirement.message || '') + ' ' + line.trim();
    }
  }

  if (Object.keys(currentRequirement).length > 0) {
    requirements.push(currentRequirement as Requirement);
  }

  return requirements.map(req => ({
    ...req,
    message: req.status === 'Pass' ? undefined : req.message?.trim()
  }));
}

export async function POST(request: Request) {
  try {
    const { photoUrl } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an assistant that analyzes photos for compliance with Schengen Visa submission requirements.
For each criterion, indicate if it's Pass, Semi Pass, or Fail. Provide an explanation only if the criterion is not fully met (Semi Pass or Fail).
Use the exact criterion names provided and analyze them in the given order:

${requirementNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Use the following guidelines:

1. Head height between 70% and 80% of photo height:
   - Pass: 60-80% of photo height
   - Semi Pass: 50-60% of photo height
   - Fail: <50% or >80% of photo height

2. Mouth closed:
   - Pass: Fully closed or slightly open
   - Fail: Visibly open

3. No shadows on face:
   - Pass: Minor shadows 
   - Semi Pass: Minor shadows, but might be causing issues on the printed version
   - Fail: Significant shadows

For other criteria, use your judgment to determine Pass, Semi Pass, or Fail.

Format your response as follows:
Criterion Name: Pass/Semi Pass/Fail
Details (only if Semi Pass or Fail, without any prefix)
`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this photo and check if it meets the Schengen visa photo requirements." 
            },
            {
              type: "image_url",
              image_url: {
                url: photoUrl,
                detail: "high"
              }
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const requirementsCheck = response.choices[0].message.content;
    if (requirementsCheck === null) {
      throw new Error('No content in ChatGPT response');
    }
    const parsedRequirements = parseOpenAIResponse(requirementsCheck);

    return NextResponse.json({ requirementsCheck: parsedRequirements });
  } catch (error) {
    console.error('Error checking requirements with ChatGPT:', error);
    
    // Return a specific error code for rate limit errors
    if (error.status === 429) {
      return NextResponse.json({ error: 'API rate limit exceeded', code: 'RATE_LIMIT' }, { status: 429 });
    }
    
    return NextResponse.json({ error: 'Failed to check requirements' }, { status: 500 });
  }
}