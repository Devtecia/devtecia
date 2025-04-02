import { NextResponse } from 'next/server';
import { saveMessage } from '@/lib/data/contact-service';

export async function POST(request: Request) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json();
    const { name, email, message } = body;

    // Validación básica en el servidor
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'El email no es válido' },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'El mensaje debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    // Guardar el mensaje en nuestro sistema
    const savedMessage = await saveMessage({
      name: name.trim(),
      email: email.trim(),
      message: message.trim()
    });
    
    console.log('Mensaje guardado con ID:', savedMessage.id);

    // Devolver una respuesta exitosa
    return NextResponse.json({ 
      success: true,
      message: 'Mensaje recibido con éxito. Nos pondremos en contacto pronto.',
      data: {
        id: savedMessage.id,
        createdAt: savedMessage.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error al procesar la solicitud de contacto:', error);
    return NextResponse.json(
      { error: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.' },
      { status: 500 }
    );
  }
} 