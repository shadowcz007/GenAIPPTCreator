import PptxGenJS from 'pptxgenjs';
import { SlideData } from '../types';

export const exportToPptx = async (topic: string, slides: SlideData[]) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = topic;
  pptx.author = 'GenAI PPT Creator';
  pptx.subject = topic;

  // Define colors
  const COLOR_PRIMARY = '4F46E5'; // Indigo 600
  const COLOR_TEXT = '0F172A';    // Slate 900
  const COLOR_TEXT_LIGHT = '475569'; // Slate 600
  const COLOR_BG_LIGHT = 'F8FAFC'; // Slate 50

  for (const slide of slides) {
    const pptSlide = pptx.addSlide();
    const { layout, title, content, imageUrl } = slide;
    
    // Common background
    if (layout !== 'FULL_IMAGE' && layout !== 'IMAGE_ONLY' && layout !== 'TITLE') {
        pptSlide.background = { color: 'FFFFFF' };
    }

    switch (layout) {
      case 'TITLE':
        if (imageUrl) {
          pptSlide.background = { data: imageUrl };
          // Add a semi-transparent overlay box for text legibility
          pptSlide.addShape(pptx.ShapeType.rect, { 
             x: 0, y: 0, w: '100%', h: '100%', 
             fill: { color: 'FFFFFF', transparency: 20 } 
          });
        } else {
            pptSlide.background = { color: 'EEF2FF' }; // Light Indigo
        }
        
        pptSlide.addText(title || 'Presentation Title', {
          x: 0.5, y: '40%', w: '90%', h: 1.5,
          align: 'center',
          fontSize: 54,
          bold: true,
          color: COLOR_TEXT,
          fontFace: 'Arial'
        });

        if (content && content.length > 0) {
            pptSlide.addText(content.join('\n'), {
                x: 1.5, y: '60%', w: '70%', h: 2,
                align: 'center',
                fontSize: 24,
                color: COLOR_TEXT_LIGHT,
                fontFace: 'Arial'
            });
        }
        break;

      case 'CONTENT_RIGHT':
        // Text Left
        pptSlide.addText(title || 'Untitled', {
            x: 0.5, y: 0.5, w: 4.5, h: 1,
            fontSize: 36,
            bold: true,
            color: COLOR_TEXT,
            fontFace: 'Arial'
        });
        
        if (content && content.length > 0) {
            const bulletItems = content.map(c => ({ text: c, options: { breakLine: true, bullet: true } }));
            pptSlide.addText(bulletItems, {
                x: 0.5, y: 1.6, w: 4.5, h: 4.5,
                fontSize: 18,
                color: COLOR_TEXT_LIGHT,
                valign: 'top',
                fontFace: 'Arial'
            });
        }

        // Image Right
        if (imageUrl) {
            pptSlide.addImage({ data: imageUrl, x: 5.2, y: 0, w: 4.8, h: 5.63 }); // Full height right side
        } else {
            pptSlide.addShape(pptx.ShapeType.rect, { x: 5.2, y: 0, w: 4.8, h: 5.63, fill: { color: 'E2E8F0' } });
            pptSlide.addText("No Image", { x: 6, y: 2.5, w: 3, h: 0.5, align:'center', color:'94A3B8' });
        }
        break;

      case 'CONTENT_LEFT':
         // Image Left
         if (imageUrl) {
            pptSlide.addImage({ data: imageUrl, x: 0, y: 0, w: 5.0, h: 5.63 });
        } else {
            pptSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 5.0, h: 5.63, fill: { color: 'E2E8F0' } });
            pptSlide.addText("No Image", { x: 1, y: 2.5, w: 3, h: 0.5, align:'center', color:'94A3B8' });
        }

        // Text Right
        pptSlide.addText(title || 'Untitled', {
            x: 5.3, y: 0.5, w: 4.5, h: 1,
            fontSize: 36,
            bold: true,
            color: COLOR_TEXT,
            align: 'right',
            fontFace: 'Arial'
        });
        
        if (content && content.length > 0) {
            const bulletItems = content.map(c => ({ text: c, options: { breakLine: true, bullet: true } }));
            pptSlide.addText(bulletItems, {
                x: 5.3, y: 1.6, w: 4.5, h: 4.5,
                fontSize: 18,
                color: COLOR_TEXT_LIGHT,
                valign: 'top',
                align: 'right',
                fontFace: 'Arial'
            });
        }
        break;

      case 'FULL_IMAGE':
        if (imageUrl) {
            pptSlide.background = { data: imageUrl };
            // Dark Overlay for text legibility
            pptSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 40 } });
        } else {
            pptSlide.background = { color: '1E293B' }; // Slate 800
        }

        // Content at bottom
        pptSlide.addText(title || 'Untitled', {
            x: 0.5, y: 3.5, w: 9, h: 1,
            fontSize: 44,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial',
            shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45, opacity: 0.5 }
        });

        if (content && content.length > 0) {
            pptSlide.addText(content.join('\n'), {
                x: 0.5, y: 4.5, w: 9, h: 1,
                fontSize: 24,
                color: 'E2E8F0',
                fontFace: 'Arial',
                shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45, opacity: 0.5 }
            });
        }
        break;

      case 'IMAGE_ONLY':
        if (imageUrl) {
            pptSlide.background = { data: imageUrl };
        } else {
            pptSlide.background = { color: '1E293B' };
            pptSlide.addText("No Image Generated", { x: 0, y: 0, w: '100%', h: '100%', align:'center', color:'FFFFFF' });
        }
        break;
        
      default:
        // Default to just text center if layout unknown
        pptSlide.addText(title || 'Untitled', { x: 1, y: 1, w: 8, h: 1, fontSize: 32, bold: true });
        break;
    }
  }

  // Save the Presentation
  const safeFilename = topic.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
  await pptx.writeFile({ fileName: `${safeFilename || 'presentation'}.pptx` });
};