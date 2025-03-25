import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI("AIzaSyC59TDceV-5GBV7KjE_7cOZqzdZMlGx3I0");

export async function POST(request) {
  try {
    
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    // Set responseModalities to include "Image" so the model can generate an image
    const model = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-002",
    });

    // Generate the image
    const response = await model.generateContent(prompt);
    
    let imageData = null;
    let mimeType = "image/png";
    let textResponse = null;

    // Process the response to extract image and text
    if (response.response && 
        response.response.candidates && 
        response.response.candidates.length > 0 &&
        response.response.candidates[0].content &&
        response.response.candidates[0].content.parts) {
      
      const parts = response.response.candidates[0].content.parts;
      
      for (const part of parts) {
        if (part.inlineData) {
          // Get the image data
          imageData = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
        } else if (part.text) {
          // Store the text
          textResponse = part.text;
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Failed to generate image: Invalid response format from Gemini API' },
        { status: 500 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image was generated. Try a different prompt.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imageData: `data:${mimeType};base64,${imageData}`,
      text: textResponse || "Image generated successfully."
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', message: error.message },
      { status: 500 }
    );
  }
} 