import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Parse the form and get the file
  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  // Prepare file storage
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
  await mkdir(uploadsDir, { recursive: true }); // Ensure folder exists

  // Sanitize and create unique filename
  const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  await writeFile(path.join(uploadsDir, safeFilename), buffer);

  return NextResponse.json({ url: `/uploads/resumes/${safeFilename}` });
}
