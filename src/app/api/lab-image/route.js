import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.labExperiment) {
      return NextResponse.json(
        { error: 'Lab experiment details are required' },
        { status: 400 }
      );
    }
    
    // First, generate a prompt for the lab experiment
    const promptResponse = await fetch(`${ 'https://vr-lab-backend.onrender.com'}/api/generate-image-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ experimentDetails: data.labExperiment }),
    });
    
    if (!promptResponse.ok) {
      const errorData = await promptResponse.json();
      throw new Error(`Failed to generate prompt: ${errorData.error || promptResponse.statusText}`);
    }
    
    const promptData = await promptResponse.json();
    
    if (!promptData.success || !promptData.prompt) {
      throw new Error('Failed to generate a valid prompt');
    }
    
    // Now, use the generated prompt to create an image
    const imageResponse = await fetch(`${ 'https://vr-lab-backend.onrender.com'}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: promptData.prompt }),
    });
    
    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      throw new Error(`Failed to generate image: ${errorData.error || imageResponse.statusText}`);
    }
    
    const imageData = await imageResponse.json();
    
    // Return both the prompt and the generated image
    return NextResponse.json({
      success: true,
      prompt: promptData.prompt,
      imageData: imageData.imageData,
      fallbackText: imageData.text
    });
    
  } catch (error) {
    console.error('Error generating lab image:', error);
    return NextResponse.json(
      { error: 'Failed to generate lab image', message: error.message },
      { status: 500 }
    );
  }
} 