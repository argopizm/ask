import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'slides.json');

// Yardımcı fonksiyon: Veriyi oku
const getSlides = () => {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    try {
        return JSON.parse(fileContents);
    } catch (error) {
        return [];
    }
};

// Yardımcı fonksiyon: Veriyi yaz
const saveSlides = (slides: any[]) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(slides, null, 2), 'utf8');
};

export async function GET() {
    const slides = getSlides();
    return NextResponse.json(slides);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Basit validasyon yapılabilir
        saveSlides(body);
        return NextResponse.json({ success: true, message: 'Slides saved successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to save slides' }, { status: 500 });
    }
}
