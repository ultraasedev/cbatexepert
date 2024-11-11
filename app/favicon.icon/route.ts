// app/favicon.ico/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Retourner une icône par défaut ou rediriger vers une icône existante
  return new NextResponse(null, { status: 204 });
}