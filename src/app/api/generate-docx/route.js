import { NextResponse } from 'next/server';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, NumberingLevel, LevelFormat, AlignmentType } from 'docx';

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
    
    // Create a new document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
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
          ],
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