
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
    const data = base64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
    return {
        inlineData: {
            data,
            mimeType
        }
    };
};

// --- MISA LOGO HANDLING ---
const getMisaLogoBase64 = (): string => {
    // Official MISA Logo Construction - SVG
    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="200" viewBox="0 0 500 200">
      <defs>
        <style>
          .text { font-family: 'Arial', 'Helvetica', sans-serif; font-weight: 900; }
          .slogan { font-family: 'Arial', 'Helvetica', sans-serif; font-weight: 700; }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="white"/>
      <text x="50%" y="100" text-anchor="middle" class="text" font-size="110" letter-spacing="-4">
        <tspan fill="#000000">MI</tspan><tspan fill="#EE1C25" font-style="italic" dx="2">S</tspan><tspan fill="#000000" dx="2">A</tspan>
      </text>
      <text x="430" y="60" font-family="Arial" font-weight="bold" font-size="18" fill="#000000">®</text>
      <line x1="60" y1="125" x2="440" y2="125" stroke="#000000" stroke-width="5" />
      <text x="50%" y="160" text-anchor="middle" class="slogan" font-size="24" fill="#000000" letter-spacing="0.5">TIN CẬY - TIỆN ÍCH - TẬN TÌNH</text>
    </svg>
    `.trim();
    return btoa(unescape(encodeURIComponent(svgString)));
};

const getDefaultMisaLogoPart = async (): Promise<Part | null> => {
    try {
        const base64 = getMisaLogoBase64();
        return new Promise((resolve) => {
            const img = new Image();
            img.src = `data:image/svg+xml;base64,${base64}`;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 500;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const pngData = canvas.toDataURL('image/png');
                    resolve({
                        inlineData: {
                            data: pngData.split(',')[1],
                            mimeType: 'image/png'
                        }
                    });
                } else {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
        });

    } catch (e) {
        console.error("Failed to generate default logo", e);
        return null;
    }
}

// Extraction Logic via secure server endpoint
export const extractEventInfo = async (file: File): Promise<Partial<EventFormData>> => {
  try {
    const filePart = await fileToPart(file);
    const fileBase64 = filePart.inlineData?.data;
    const mimeType = filePart.inlineData?.mimeType;

    const response = await fetch("/api/gemini/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileBase64, mimeType }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server error: ${errText}`);
    }

    const data = await response.json();
    
    let format = data.eventFormat || 'online';
    if (!data.eventFormat) {
        if (data.offlineAddress && data.onlinePlatform) format = 'hybrid';
        else if (data.offlineAddress) format = 'offline';
        else format = 'online';
    }

    return {
      eventType: data.eventType || '',
      eventName: data.eventName || '',
      date: data.date || '',
      time: data.time || '',
      targetAudience: data.targetAudience || '',
      eventFormat: format,
      onlinePlatform: data.onlinePlatform || 'Zoom Meeting',
      offlineAddress: data.offlineAddress || '',
      dressCode: data.dressCode || '',
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      contactEmail: data.contactEmail || '',
    };
  } catch (error) {
    console.error("Extraction failed", error);
    throw new Error("Failed to extract information.");
  }
};

export const cleanBackground = async (imageFile: File): Promise<string> => {
  try {
    const imagePart = await fileToPart(imageFile);
    const imageBase64 = imagePart.inlineData?.data;
    const mimeType = imagePart.inlineData?.mimeType;

    const response = await fetch("/api/gemini/clean-background", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server error: ${errText}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Background clean failed", error);
    throw new Error("Background clean failed.");
  }
};

/**
 * MAIN POSTER GENERATION LOGIC - Calls server endpoint
 */
export const generatePoster = async (formData: EventFormData): Promise<string> => {
  try {
    // 1. Convert optional background
    let backgroundPart: Part | null = null;
    if (formData.useUploadedBackground && formData.selectedBackground) {
      if (formData.selectedBackground.startsWith("data:image")) {
        backgroundPart = base64ToPart(formData.selectedBackground);
      }
    }

    // 2. Convert custom brand logos when enabled
    const logoParts: Part[] = [];
    if (formData.useBrandLogo) {
      if (formData.organizerLogo) {
        logoParts.push(await fileToPart(formData.organizerLogo));
      }
      if (formData.productLogo) {
        logoParts.push(await fileToPart(formData.productLogo));
      }
    }

    // 3. Assemble speaker portrait images
    const speakerParts: (Part | null)[] = [];
    const validSpeakers = formData.speakers.filter((s) => s.name.trim() !== "");
    for (const s of validSpeakers) {
      if (s.image) {
        speakerParts.push(await fileToPart(s.image));
      } else {
        speakerParts.push(null);
      }
    }

    // 4. Convert QR Code image
    let qrCodePart: Part | null = null;
    if (formData.includeQrCode && formData.qrCodeImage) {
      qrCodePart = await fileToPart(formData.qrCodeImage);
    }

    // 5. Convert standard default MISA logo SVG
    const defaultLogoPart = await getDefaultMisaLogoPart();

    // 6. Perform server POST with all collected assets & parameters wrapped
    const response = await fetch("/api/gemini/generate-poster", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formData,
        backgroundPart,
        logoParts,
        speakerParts,
        qrCodePart,
        defaultLogoPart,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Lỗi server: ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error || errMsg;
      } catch (parseErr) {
        errMsg = errText || errMsg;
      }
      throw new Error(errMsg);
    }

    const result = await response.json();
    return result.imageUrl;
  } catch (error) {
    console.error("Poster Generation Failed", error);
    const msg = (error as any).message || "Unknown Error";
    throw new Error(`Poster Generation Failed: ${msg}`);
  }
};
