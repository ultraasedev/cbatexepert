import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../lib/mongodb';
import Expertise from '../../../models/expertise';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const authenticateToken = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { email: string; role: string };
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  await dbConnect();
  
  const user = authenticateToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const expertises = await Expertise.find({});
    return NextResponse.json(expertises);
  } catch (error) {
    console.error('Failed to fetch expertises:', error);
    return NextResponse.json({ error: 'Failed to fetch expertises' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  
  const user = authenticateToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newExpertise = new Expertise(body);
    const savedExpertise = await newExpertise.save();
    return NextResponse.json(savedExpertise, { status: 201 });
  } catch (error) {
    console.error('Failed to create expertise:', error);
    return NextResponse.json({ error: 'Failed to create expertise' }, { status: 500 });
  }
}