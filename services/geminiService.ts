
import { GoogleGenAI, Part } from "@google/genai";
import { EventFormData } from "../types";

// Helper to convert File to Part
export const fileToPart = async (file: File): Promise<Part> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Check if result is string
      if (typeof reader.result === 'string') {
        // Fallback to jpeg if file.type is empty (common with some file objects)
        const mimeType = file.type || 'image/jpeg';
        const base64String = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: mimeType,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const base64ToPart = (base64: string, mimeType: string = 'image/png'): Part => {
    // Ensure we strip any Data URL prefix correctly.
    // Handles data:image/png;base64, and similar patterns.
    const data = base64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    return {
        inlineData: {
            data,
            mimeType
        }
    };
};

// Helper to fetch default MISA Logo if none provided
const getDefaultMisaLogoPart = async (): Promise<Part | null> => {
    try {
        const response = await fetch('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/MISA_logo.svg/2560px-MISA_logo.svg.png');
        if (!response.ok) return null;
        
        const blob = await response.blob();
        return new Promise((resolve) => {
             const reader = new FileReader();
             reader.onloadend = () => {
                 if (typeof reader.result === 'string') {
                    const base64 = reader.result.split(',')[1];
                    resolve({ inlineData: { data: base64, mimeType: 'image/png' } });
                 } else {
                     resolve(null);
                 }
             };
             reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to fetch default MISA logo", e);
        return null;
    }
}

/**
 * Extracts event information from a document or image using Gemini 2.5 Flash.
 */
export const extractEventInfo = async (file: File): Promise<Partial<EventFormData>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const filePart = await fileToPart(file);

  // Vietnamese Prompt for better local context extraction
  const prompt = `
    Bạn là một trợ lý AI chuyên trích xuất thông tin sự kiện từ các tài liệu hoặc hình ảnh thư mời.
    Hãy phân tích file đính kèm và trích xuất các thông tin sau dưới dạng JSON:

    - eventName: Tên sự kiện (Tiêu đề chính).
    - date: Ngày diễn ra (Định dạng DD/MM/YYYY).
    - time: Giờ diễn ra (Ví dụ: 08:00 - 11:30).
    - targetAudience: Đối tượng khách mời tham gia.
    - isOnline: true nếu là Zoom/Google Meet/Online, false nếu là Offline.
    - locationOrPlatform: Địa điểm tổ chức hoặc link Zoom/ID Zoom.
    - contactName: Tên người liên hệ.
    - contactPhone: Số điện thoại liên hệ.
    - contactEmail: Email liên hệ.
    
    Nếu không tìm thấy thông tin nào, hãy để chuỗi rỗng "". 
    Đừng tự bịa thông tin.
    Trả về định dạng JSON thuần túy, không markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [filePart, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    
    return {
      eventName: data.eventName || '',
      date: data.date || '',
      time: data.time || '',
      targetAudience: data.targetAudience || '',
      isOnline: typeof data.isOnline === 'boolean' ? data.isOnline : false,
      locationOrPlatform: data.locationOrPlatform || '',
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      contactEmail: data.contactEmail || '',
    };
  } catch (error) {
    console.error("Extraction failed", error);
    throw new Error("Failed to extract information from file.");
  }
};

/**
 * Generates a clean background from an uploaded image (removes text/logos).
 */
export const cleanBackground = async (imageFile: File): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = await fileToPart(imageFile);

    const prompt = `
        I provide an event poster or design.
        Please recreate the **BACKGROUND ONLY** of this image.
        1. Keep the abstract shapes, colors, gradients, and layout style exactly as they are.
        2. REMOVE ALL TEXT, LOGOS, PEOPLE, and FOREGROUND OBJECTS.
        3. The output should be a clean, high-quality background texture ready for new text to be overlaid.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Using Flash Image for fast editing/recreation
            contents: { parts: [imagePart, { text: prompt }] }
        });

         // Extract the image from the response
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated.");
    } catch (error) {
        console.error("Clean background failed", error);
        throw new Error("Không thể xử lý nền ảnh. Vui lòng thử lại.");
    }
}

/**
 * Generates the event poster using Gemini 3 Pro Image Preview (Nano Banana Pro).
 */
export const generatePoster = async (formData: EventFormData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: Part[] = [];

  // Determine effective topics (mix)
  const topics = formData.themeTopics.includes('Tùy chỉnh') 
    ? formData.customTopicPrompt 
    : formData.themeTopics.join(' combined with ');

  // 1. Construct the System/Layout Prompt
  let prompt = `Create a high-quality, professional event invitation poster for MISA (Vietnam).
  
  **Format & Size:**
  - Aspect Ratio: ${formData.aspectRatio === '16:9' ? 'Landscape (16:9)' : 'Portrait (3:4)'}.
  - Output Resolution: High Quality.
  
  **Design Style & Theme:**
  - **Color Palette:** ${formData.themeTone} ${formData.customThemePrompt ? `(${formData.customThemePrompt})` : ''}.
  - **Topic/Theme:** ${topics}.
  - **Vibe:** Professional, Modern, Corporate, Reliable.
  `;

  // Handle User Selected Background / Template
  if (formData.useUploadedBackground && formData.selectedBackground) {
      // Validate that the background is actually an image string
      if (formData.selectedBackground.startsWith('data:image')) {
          parts.push(base64ToPart(formData.selectedBackground));
          prompt += `\n\n**BACKGROUND INSTRUCTION:**
          - Use the provided image (Image ${parts.length}) as the **STRICT BACKGROUND REFERENCE**.
          - Keep the background patterns, colors, and layout structure of this reference image.
          - Place the new text and content on top of this background style.
          `;
      }
  }

  prompt += `
  **Content to Render (Must be legible and accurate):**

  - **Event Type:** "${formData.eventType}".
    - **Placement:** Positioned DIRECTLY ABOVE the Event Title, and BELOW the top Logo.
    - **Alignment:** Centered.
    - **Style:** Normal font weight, standard size, elegant (NOT bold, NOT highlighted).
  
  - **Event Title:** "${formData.eventName}".
    - **Visual Importance:** This must be the **MOST PROMINENT** element on the poster.
    - **Typography:** Use **massive, bold, 3D or creative display fonts**.
    - **Effects:** Apply professional text effects appropriate for the theme (e.g., Metallic Gold, Neon Glow, Drop Shadows, Gradient Fill).
    - **Instruction:** Make the title visually "pop" off the background.
  
  - **Time & Date:** ${formData.time} | ${formData.date}.
  - **Format:** ${formData.isOnline ? 'TRỰC TUYẾN (ZOOM ONLINE)' : 'OFFLINE'}.
  `;

  // Location Logic: Only show if offline
  if (!formData.isOnline) {
      prompt += `\n- **Location:** ${formData.locationOrPlatform}.`;
  }

  // --- AGENDA SECTION (New) ---
  if (formData.agenda && formData.agenda.length > 0) {
      prompt += `\n\n**PROGRAM AGENDA (Section Title: "CHƯƠNG TRÌNH"):**
      - Render a section titled "CHƯƠNG TRÌNH" (or "AGENDA").
      - Layout: Use a 2-column list layout.
        - **Left Column:** Time slots (Align: Left).
        - **Right Column:** Activities (Align: Left, starts immediately after time).
        - **Text Alignment:** The text content for activities should be **JUSTIFIED** (aligned to both left and right edges if multi-line).
      - Content to render (Note: Make the Activity content **BOLD**):
      `;
      formData.agenda.forEach(item => {
          prompt += `  - ${item.time} : **${item.activity}**\n`;
      });
  }

  prompt += `
  - **Đối tượng tham gia:** ${formData.targetAudience}.
  - **Contact Section:** Bottom area. "Liên hệ: ${formData.contactName} - ${formData.contactPhone} - ${formData.contactEmail}".
    - **Style:** LARGE, BOLD, highly readable text.
    - If contact details are empty, leave a Wide, Spacious area with large placeholder lines.

  **Logos & Branding Placement Instructions:**
  `;

  // --- BRANDING LOGIC ---
  if (formData.useBrandLogo) {
      // User opted to provide their own logos
      const hasUploadedLogos = formData.organizerLogo || formData.productLogo || formData.coOrganizerLogo;
      
      if (hasUploadedLogos) {
          prompt += `I have provided logo images. You must strictly follow these rules:
          1. **CRITICAL:** Do NOT redesign, recolor, or alter the text inside the provided logos. Use them exactly as provided.
          2. If a logo is **negative/white**: Place it DIRECTLY on the poster background.
          3. If a logo is **positive/colored**: Place it on a clean **WHITE RECTANGULAR BLOCK**.
          `;
          
          if (formData.organizerLogo) {
            parts.push(await fileToPart(formData.organizerLogo));
            prompt += `\n- **Organizer Logo**: See Image ${parts.length}. Add the small text "Đơn vị tổ chức" ABOVE this logo.`;
          }
          if (formData.productLogo) {
            parts.push(await fileToPart(formData.productLogo));
            prompt += `\n- **Partner Product Logo**: See Image ${parts.length}. Add the small text "Sản phẩm đồng hành" ABOVE this logo.`;
          }
          if (formData.coOrganizerLogo) {
            parts.push(await fileToPart(formData.coOrganizerLogo));
            prompt += `\n- **Co-Organizer Logo**: See Image ${parts.length}. Add the small text "Đơn vị phối hợp" ABOVE this logo.`;
          }
      } else {
          prompt += `\n\n**BRANDING:**
          - Place any provided text logos at the top.
          `;
      }
  } else {
      // DEFAULT MISA LOGO LOGIC (User opted out of custom logos)
      const defaultMisaLogo = await getDefaultMisaLogoPart();
      if (defaultMisaLogo) {
          parts.push(defaultMisaLogo);
          prompt += `\n\n**DEFAULT BRANDING:**
          - No custom logos provided. Use the MISA Logo (See Image ${parts.length}).
          - Place this logo at the **TOP CENTER** of the design.
          - Place it on a clean **WHITE RECTANGULAR BLOCK** to ensure visibility against any background color.
          `;
      } else {
          prompt += `\n\n**DEFAULT BRANDING:**
          - Place the "MISA" logo at the top center.
          - Text: "MISA" (Bold, Black) with Slogan "Tin cậy - Tiện ích - Tận tình".
          - Place on a white block.
          `;
      }
  }

  // QR Code Logic
  if (formData.includeQrCode) {
      if (formData.qrCodeImage) {
          parts.push(await fileToPart(formData.qrCodeImage));
          prompt += `\n\n**QR Code:**\n- See Image ${parts.length}. Place this QR code clearly at the bottom or corner. Include the text "Đăng ký ngay" immediately below the QR code.`;
      } else {
          prompt += `\n\n**QR Code:**\n- Create a clean white square placeholder box for a QR Code. Include the text "Đăng ký ngay" immediately below this placeholder.`;
      }
  } else {
      prompt += `\n\n**QR Code:**\n- Do NOT include any QR code or QR code placeholder.`;
  }

  prompt += `\n\n**Speakers:**
  Include the following speakers. High-quality integration.
  `;

  // 2. Handle Speakers (Images + Prompts)
  for (let i = 0; i < formData.speakers.length; i++) {
    const speaker = formData.speakers[i];
    prompt += `\n- Speaker ${i + 1}: Name "${speaker.name}", Title "${speaker.title}"`;
    if (speaker.company) {
        prompt += `, Company "${speaker.company}".`;
    } else {
        prompt += `.`;
    }
    
    if (speaker.image) {
      const imgPart = await fileToPart(speaker.image);
      parts.push(imgPart);
      prompt += ` [See Image ${parts.length} for Speaker ${i + 1} reference].`;
      
      // Editing instructions
      if (speaker.editPrompt) {
        prompt += ` EDIT INSTRUCTION: Strictly preserve face/identity. Modify attire/pose to: ${speaker.editPrompt}.`;
      } else {
        prompt += ` Preserve the face and identity of this speaker exactly.`;
      }
      
      if (speaker.removeBackground) {
        prompt += ` Remove background, integrate seamlessly.`;
      }
    } else {
      prompt += ` (No reference image provided, generate a generic professional avatar).`;
    }
  }

  // Add the text prompt as the last part
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
            aspectRatio: formData.aspectRatio,
            imageSize: '2K' // Requesting high quality
        }
      }
    });

    // Extract the image from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Poster Generation Failed", error);
    // Propagate a clearer message
    const msg = (error as any).message || "Unknown Error";
    throw new Error(`Poster Generation Failed: ${msg}`);
  }
};
