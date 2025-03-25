import { NextResponse } from 'next/server';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, NumberingLevel, LevelFormat, AlignmentType, ImageRun } from 'docx';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Function to process text into paragraphs
    const processParagraphs = (text) => {
      if (!text) return [new Paragraph({ text: "N/A" })];
      
      // Split by line breaks
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      const paragraphs = [];
      
      for (const line of lines) {
        // Check if line is a list item
        const listMatch = line.match(/^(\s*)([●•\-*]|\d+\.)\s+(.+)/);
        
        if (listMatch) {
          // This is a list item
          const indentLevel = Math.floor(listMatch[1].length / 2);
          let content = listMatch[3].trim();
          
          // Process markdown-style bold text (**text**)
          const textRuns = [];
          let remainingText = content;
          let boldMatch;
          
          // Regular expression to match **text** pattern
          const boldRegex = /\*\*(.*?)\*\*/g;
          let lastIndex = 0;
          
          while ((boldMatch = boldRegex.exec(content)) !== null) {
            // Add text before the bold part
            if (boldMatch.index > lastIndex) {
              textRuns.push(
                new TextRun({
                  text: content.substring(lastIndex, boldMatch.index),
                })
              );
            }
            
            // Add the bold text
            textRuns.push(
              new TextRun({
                text: boldMatch[1], // The text between ** and **
                bold: true,
              })
            );
            
            lastIndex = boldMatch.index + boldMatch[0].length;
          }
          
          // Add any remaining text after the last bold part
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
              bullet: {
                level: indentLevel
              },
              spacing: {
                after: 120
              }
            })
          );
        } else if (line.trim().match(/^[A-Z0-9].*:$/)) {
          // This is a heading/subheading (ends with colon)
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.trim(),
                  bold: true,
                }),
              ],
              spacing: {
                before: 200,
                after: 120
              }
            })
          );
        } else {
          // Regular paragraph - process for markdown bold
          let content = line.trim();
          const textRuns = [];
          let boldMatch;
          
          // Regular expression to match **text** pattern
          const boldRegex = /\*\*(.*?)\*\*/g;
          let lastIndex = 0;
          
          while ((boldMatch = boldRegex.exec(content)) !== null) {
            // Add text before the bold part
            if (boldMatch.index > lastIndex) {
              textRuns.push(
                new TextRun({
                  text: content.substring(lastIndex, boldMatch.index),
                })
              );
            }
            
            // Add the bold text
            textRuns.push(
              new TextRun({
                text: boldMatch[1], // The text between ** and **
                bold: true,
              })
            );
            
            lastIndex = boldMatch.index + boldMatch[0].length;
          }
          
          // Add any remaining text after the last bold part
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
              spacing: {
                after: 120
              }
            })
          );
        }
      }
      
      return paragraphs;
    };
    
    // Create document children array
    const children = [
      new Paragraph({
        text: "VR Learning Template",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 300,
        },
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Grade: ",
            bold: true,
          }),
          new TextRun(data.grade || "N/A"),
        ],
        spacing: {
          after: 200,
        },
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Chapter Name: ",
            bold: true,
          }),
          new TextRun(data.chapterName || "N/A"),
        ],
        spacing: {
          after: 200,
        },
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Introduction to the chapter: ",
            bold: true,
          }),
        ],
        spacing: {
          after: 120,
        },
      }),
      
      ...processParagraphs(data.introduction),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Assets required: ",
            bold: true,
          }),
        ],
        spacing: {
          before: 200,
          after: 120,
        },
      }),
      
      ...processParagraphs(data.assets),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Methodology: ",
            bold: true,
          }),
        ],
        spacing: {
          before: 200,
          after: 120,
        },
      }),
      
      ...processParagraphs(data.methodology),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Lab Experiments: ",
            bold: true,
          }),
        ],
        spacing: {
          before: 200,
          after: 120,
        },
      }),
      
      ...processParagraphs(data.labExperiments),
      
      // Add lab experiment image if available
      ...(data.imageData ? (function() {
        try {
          // Extract base64 data from the data URL
          const base64Regex = /^data:image\/\w+;base64,(.+)$/;
          const matches = data.imageData.match(base64Regex);
          
          if (matches && matches.length > 1) {
            const imageBuffer = Buffer.from(matches[1], 'base64');
            
            const imageElements = [
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
            ];
            
            // Add image prompt if available
            if (data.imagePrompt) {
              imageElements.push(
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
            
            return imageElements;
          }
          return [];
        } catch (imageError) {
          console.warn('Error adding image to document:', imageError);
          return [];
        }
      })() : []),
    ];
    
    // Create a new document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    // Generate the DOCX file
    const buffer = await Packer.toBuffer(doc);
    
    // Return the buffer as a base64 string
    return NextResponse.json({
      docxBase64: Buffer.from(buffer).toString('base64'),
      filename: `${data.chapterName || 'chapter'}_template.docx`
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX file' },
      { status: 500 }
    );
  }
} 