import { NextResponse } from 'next/server';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, ImageRun, BorderStyle, TabStopType, TabStopPosition } from 'docx';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Path to your logo
    const logoPath = path.join(process.cwd(), 'public', 'Picture1.png');
    let logoImage;
    
    // Try to read the logo file if it exists
    try {
      logoImage = fs.readFileSync(logoPath);
    } catch (err) {
      console.warn("Logo file not found, proceeding without logo");
    }
    
    // Process text to handle markdown and formatting
    const processText = (text) => {
      if (!text || text === 'null') return 'N/A';
      return text.replace(/\r?\n/g, '\r\n');
    };
    
    // Create paragraphs from text with proper formatting
    const createFormattedParagraphs = (text) => {
      if (!text || text === 'null') return [new Paragraph({ text: "N/A" })];
      
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      const paragraphs = [];
      
      for (const line of lines) {
        // Check if line is a list item (starts with ● or *)
        const listMatch = line.match(/^(\s*)(●|\*)\s+(.+)/);
        
        if (listMatch) {
          // This is a list item
          const content = listMatch[3].trim();
          
          // Process for bold text (markdown style)
          const textRuns = [];
          const boldRegex = /\*\*(.*?)\*\*/g;
          let lastIndex = 0;
          let match;
          
          while ((match = boldRegex.exec(content)) !== null) {
            // Add text before the bold part
            if (match.index > lastIndex) {
              textRuns.push(
                new TextRun({
                  text: content.substring(lastIndex, match.index),
                })
              );
            }
            
            // Add the bold text
            textRuns.push(
              new TextRun({
                text: match[1], // The text between ** and **
                bold: true,
              })
            );
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add any remaining text
          if (lastIndex < content.length) {
            textRuns.push(
              new TextRun({
                text: content.substring(lastIndex),
              })
            );
          }
          
          paragraphs.push(
            new Paragraph({
              children: textRuns.length > 0 ? textRuns : [new TextRun(content)],
              bullet: { level: 0 },
              spacing: { after: 120 },
              indent: { left: 360 }, // Add indentation for bullet points
            })
          );
        } else {
          // Regular paragraph - check for bold text
          const textRuns = [];
          const boldRegex = /\*\*(.*?)\*\*/g;
          let lastIndex = 0;
          let match;
          
          while ((match = boldRegex.exec(line)) !== null) {
            // Add text before the bold part
            if (match.index > lastIndex) {
              textRuns.push(
                new TextRun({
                  text: line.substring(lastIndex, match.index),
                })
              );
            }
            
            // Add the bold text
            textRuns.push(
              new TextRun({
                text: match[1], // The text between ** and **
                bold: true,
              })
            );
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add any remaining text
          if (lastIndex < line.length) {
            textRuns.push(
              new TextRun({
                text: line.substring(lastIndex),
              })
            );
          }
          
          paragraphs.push(
            new Paragraph({
              children: textRuns.length > 0 ? textRuns : [new TextRun(line)],
              spacing: { after: 120 },
            })
          );
        }
      }
      
      return paragraphs;
    };
    
    // Create document children array
    const children = [];
    
    // Add logo and company name on the exact same line using tabs for positioning
    if (logoImage) {
      children.push(
        new Paragraph({
          children: [
            // Logo on the left
            new ImageRun({
              data: logoImage,
              transformation: {
                width: 75,
                height: 100,
              },
            }),
            // Tab to center position
            new TextRun({ text: "\t" }),
            // Company name in light blue
            new TextRun({
              text: "Bodyclone Innovations Pvt Ltd",
              bold: true,
              size: 32,
              color: "4F81BD", // Light blue color
            }),
          ],
          tabStops: [
            {
              type: TabStopType.CENTER,
              position: TabStopPosition.CENTER, // Center of the page
            },
          ],
          spacing: { after: 400 }, // Extra space after the header
        })
      );
    } else {
      // If no logo, just add the company name
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Bodyclone Innovations Pvt Ltd",
              bold: true,
              size: 32,
              color: "4F81BD", // Light blue color
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }, // Extra space after the header
        })
      );
    }
    
    // Add Grade
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Grade: ",
            bold: true,
          }),
          new TextRun(processText(data.grade)),
        ],
        spacing: { after: 120 },
      })
    );
    
    // Add Chapter Name
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Chapter Name: ",
            bold: true,
          }),
          new TextRun(processText(data.chapterName)),
        ],
        spacing: { after: 200 },
      })
    );
    
    // Add Introduction heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Introduction to the chapter: (2 or 3 lines) :",
            bold: true,
          }),
        ],
        spacing: { after: 120 },
      })
    );
    
    // Add introduction paragraphs
    children.push(...createFormattedParagraphs(data.introduction));
    
    // Add Assets heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Assets required: ",
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 120 },
      })
    );
    
    // Add assets paragraphs
    children.push(...createFormattedParagraphs(data.assets));
    
    // Add Methodology heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Methodology: (Mention latest way): ",
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 120 },
      })
    );
    
    // Add methodology paragraphs
    children.push(...createFormattedParagraphs(data.methodology));

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Lab Experiments: ",
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 120 },
      })
    );
    
    // Add lab experiments paragraphs
    children.push(...createFormattedParagraphs(data.labExperiments));
    
    // Add lab experiment image if available
    if (data.imageData) {
      try {
        // Extract base64 data from the data URL
        const base64Regex = /^data:image\/\w+;base64,(.+)$/;
        const matches = data.imageData.match(base64Regex);
        
        if (matches && matches.length > 1) {
          const imageBuffer = Buffer.from(matches[1], 'base64');
          
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Lab Experiment Visualization:",
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 120 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 550,
                    height: 300,
                  },
                }),
              ],
              spacing: { after: 200 },
            })
          );
          
          // Add image prompt if available
          if (data.imagePrompt) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Image Description: ",
                    bold: true,
                  }),
                  new TextRun(data.imagePrompt),
                ],
                spacing: { after: 200 },
              })
            );
          }
        }
      } catch (imageError) {
        console.warn('Error adding image to document:', imageError);
      }
    }
    
    // Add footer note
    children.push(
      new Paragraph({
        text: "Refer to a picture (if available) to make the chapters as visually compelling as possible. Alternatively, generate a suitable image using ChatGPT or DeepSeek.",
        spacing: { before: 200, after: 200 },
      })
    );
    
    // Create the document with standard margins
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 1440, // 1 inch
                bottom: 1440, // 1 inch
                left: 1440, // 1 inch
              },
            },
          },
          children: children,
        },
      ],
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 32,
              bold: true,
            },
            paragraph: {
              spacing: {
                after: 240,
              },
            },
          },
        ],
      },
    });

    // Generate the DOCX file
    const buffer = await Packer.toBuffer(doc);
    
    // Return the document
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${data.chapterName || 'chapter'}_template.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX file', details: error.message },
      { status: 500 }
    );
  }
} 