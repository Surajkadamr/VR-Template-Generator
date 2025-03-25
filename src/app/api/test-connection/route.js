import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Test connection to the Python backend
    const response = await fetch(`${process.env.PYTHON_API_URL || 'http://localhost:5000'}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: `Failed to connect to Python backend: ${response.statusText}`,
        statusCode: response.status
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Python backend',
      pythonResponse: data,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: `Error connecting to Python backend: ${error.message}`,
    }, { status: 500 });
  }
} 