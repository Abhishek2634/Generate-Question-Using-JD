import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = '';

    if (file.type === 'application/pdf') {
      try {
        // Dynamic import to avoid build-time issues
        const pdfParse = await import('pdf-parse');
        const pdf = pdfParse.default;
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        // Fallback: return mock data for PDF files
        extractedText = 'PDF file uploaded - manual extraction required';
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX files, you might want to use a library like mammoth
      // For now, returning mock data
      extractedText = 'DOCX file uploaded - manual extraction required';
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Simple extraction logic (you can enhance this with regex or AI)
    const emailMatch = extractedText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = extractedText.match(/[\+]?[1-9][\d\s\-\(\)]{8,15}/);
    
    // Extract name (this is basic - you might want to use NLP)
    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    const possibleName = lines[0]?.trim() || '';

    const result = {
      name: possibleName.length > 50 ? '' : possibleName, // If too long, probably not a name
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0].replace(/[\s\-\(\)]/g, '') : '',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
