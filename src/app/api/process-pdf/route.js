import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyBrGaeEeEeEr2KEpDFVp0FE4ZmatPwhVlw');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse PDF to extract text
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;
    
    // Truncate text if too long (Gemini has token limits)
    const truncatedText = pdfText.slice(0, 20000); // Adjust limit as needed

    // Define the prompt for Gemini
    const prompt = `
    You are tasked with analyzing the following textbook chapter and extracting specific information to create a VR learning template.
    
    Please extract the following information from the textbook content:
    1. Grade level (if identifiable)
    2. Chapter name/title
    3. A brief introduction to the chapter (2-3 lines)
    4. Assets that would be required to create a VR experience for this content (be specific)
    5. Methodology for teaching this in VR (mention latest approaches)
    
    Format your response in JSON with the following keys:
    {
      "grade": "",
      "chapterName": "",
      "introduction": "",
      "assets": "",
      "methodology": ""
    }
    
    Here is the textbook content:
    ${truncatedText}
    `;

    // Call the Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsedResult;
    
    if (jsonMatch) {
      try {
        parsedResult = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // If JSON parsing fails, try to extract the data differently
        parsedResult = {
          grade: extractField(text, "grade"),
          chapterName: extractField(text, "chapterName"),
          introduction: extractField(text, "introduction"),
          assets: extractField(text, "assets"),
          methodology: extractField(text, "methodology")
        };
      }
    } else {
      // Fallback extraction if JSON format wasn't returned
      parsedResult = {
        grade: extractField(text, "grade"),
        chapterName: extractField(text, "chapterName"),
        introduction: extractField(text, "introduction"),
        assets: extractField(text, "assets"),
        methodology: extractField(text, "methodology")
      };
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process the PDF' },
      { status: 500 }
    );
  }
}

// Helper function to extract fields if JSON parsing fails
function extractField(text, fieldName) {
  const regex = new RegExp(`"?${fieldName}"?\\s*:?\\s*"?([^",}]+)"?`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
} 