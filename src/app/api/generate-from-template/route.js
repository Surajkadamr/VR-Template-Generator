import { NextResponse } from 'next/server';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, ImageRun, BorderStyle, TabStopType, Table, TableRow, TableCell, WidthType, VerticalAlign } from 'docx';
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
    
    // Create header with logo and company name on the same level
    const headerChildren = [];
    
    // Create a table for the header with two cells
    const headerTable = new Table({
      rows: [
        new TableRow({
          children: [
            // Left cell for logo
            new TableCell({
              width: {
                size: 10,
                type: WidthType.PERCENTAGE,
              },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: logoImage,
                      transformation: {
                        width: 75,
                        height: 100,
                      },
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
            // Right cell for company name
            new TableCell({
              width: {
                size: 90,
                type: WidthType.PERCENTAGE,
              },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  text: "Bodyclone Innovations Pvt Ltd",
                  alignment: AlignmentType.CENTER,
                  heading: HeadingLevel.HEADING_1,
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          ],
        }),
      ],
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });
    
    headerChildren.push(headerTable);
    
    // Add spacing after the header
    headerChildren.push(
      new Paragraph({
        text: "",
        spacing: { after: 200 },
      })
    );
    
    // Add content sections
    const contentChildren = [
      new Paragraph({
        children: [
          new TextRun({
            text: "Grade: ",
            bold: true,
          }),
          new TextRun(processText(data.grade)),
        ],
        spacing: { after: 120 },
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Chapter Name: ",
            bold: true,
          }),
          new TextRun(processText(data.chapterName)),
        ],
        spacing: { after: 200 },
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: "Introduction to the chapter: (2 or 3 lines) :",
            bold: true,
          }),
        ],
        spacing: { after: 120 },
      }),
    ];
    
    // Add introduction paragraphs
    contentChildren.push(...createFormattedParagraphs(data.introduction));
    
    // Add assets section
    contentChildren.push(
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
    contentChildren.push(...createFormattedParagraphs(data.assets));
    
    // Add methodology section
    contentChildren.push(
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
    contentChildren.push(...createFormattedParagraphs(data.methodology));
    
    // Add footer note
    contentChildren.push(
      new Paragraph({
        text: "Refer to a picture (if available) to make the chapters as visually compelling as possible. Alternatively, generate a suitable image using ChatGPT or DeepSeek.",
        spacing: { before: 200, after: 200 },
      })
    );
    
    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [...headerChildren, ...contentChildren],
        },
      ],
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