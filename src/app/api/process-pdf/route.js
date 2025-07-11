import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';

// Initialize Google Generative AI with your API key from environment variables
const genAI = new GoogleGenerativeAI("AIzaSyChPNLGqiMKC7-GVsrrgiWL8Sdx7IGNA-A");
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userGrade = formData.get('grade'); // Get the grade from form data
    
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
    6. Lab Experiments :-(The Experiment should be based on the content of the chapter) Imagine an interactive lab station where the user stands inside a circular table with an open entryway. The table is filled with various experiment-related items, each corresponding to specific chapters of study. The user can reach out, grab objects, and interact with them to conduct hands-on experiments. The setup should support multiple experiments covering the key intents of the chapters, ensuring an immersive and educational experience. If a circular table is not feasible, AI can suggest an alternative rectangular table with an open entry design that maintains accessibility and engagement.Suggest what type of models and experiments we need here so that students will do the VR based experiment related to the chapters. If experiments are not required suggest any alternative way to teach them in VR scene.

    
    Format your response in JSON with the following keys:
    {
      "grade": "",
      "chapterName": "",
      "introduction": "",
      "assets": "",
      "methodology": "",
      "labExperiments": ""
    }
    
    Here is the textbook content:
    ${truncatedText}
    `;

    // Call the Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsedResult;
    
    if (jsonMatch) {
      try {
        parsedResult = JSON.parse(jsonMatch[0]);
        // Override the AI-generated grade with user input
        parsedResult.grade = userGrade;
      } catch (e) {
        // If JSON parsing fails, try to extract the data differently
        parsedResult = {
          grade: userGrade, // Use user input grade
          chapterName: extractField(text, "chapterName"),
          introduction: extractField(text, "introduction"),
          assets: extractField(text, "assets"),
          methodology: extractField(text, "methodology"),
          labExperiments: extractField(text, "labExperiments")
        };
      }
    } else {
      // Fallback extraction if JSON format wasn't returned
      parsedResult = {
        grade: userGrade, // Use user input grade
        chapterName: extractField(text, "chapterName"),
        introduction: extractField(text, "introduction"),
        assets: extractField(text, "assets"),
        methodology: extractField(text, "methodology"),
        labExperiments: extractField(text, "labExperiments")
      };
    }

    // Generate lab image directly here instead of calling another endpoint
    try {
      // Only proceed if we have lab experiments content
      if (parsedResult.labExperiments) {
        // Generate a prompt for the lab experiment
        const promptResponse = await fetch('https://swift-temple-458004-k9.el.r.appspot.com/api/generate-image-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ experimentDetails: parsedResult.labExperiments }),
        });
        
        if (!promptResponse.ok) {
          const errorData = await promptResponse.json();
          throw new Error(`Failed to generate prompt: ${errorData.error || promptResponse.statusText}`);
        }
        
        const promptData = await promptResponse.json();
        
        if (!promptData.success || !promptData.prompt) {
          throw new Error('Failed to generate a valid prompt');
        }
        
        // Use the generated prompt to create an image
        const imageResponse = await fetch('https://swift-temple-458004-k9.el.r.appspot.com/api/generate-image', {
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
        
        // Add image data to the result
        parsedResult.imagePrompt = promptData.prompt;
        parsedResult.imageData = imageData.imageData;
        parsedResult.imageDescription = imageData.text;
      }
    } catch (labImageError) {
      console.error('Error generating lab image:', labImageError);
      parsedResult.imageError = 'Failed to generate image: ' + labImageError.message;
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
