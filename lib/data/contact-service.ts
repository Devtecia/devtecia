import fs from 'fs/promises';
import path from 'path';

// Definir el tipo para los mensajes de contacto
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

// Ruta al archivo JSON donde se almacenarán los mensajes
const dataFilePath = path.join(process.cwd(), 'lib/data/contact-messages.json');

// Función para inicializar el archivo si no existe
export async function ensureDataFileExists() {
  try {
    await fs.access(dataFilePath);
  } catch (error) {
    // Si el archivo no existe, lo creamos con un array vacío
    await fs.writeFile(dataFilePath, JSON.stringify([]));
  }
}

// Función para obtener todos los mensajes
export async function getAllMessages(): Promise<ContactMessage[]> {
  await ensureDataFileExists();
  const data = await fs.readFile(dataFilePath, 'utf-8');
  return JSON.parse(data);
}

// Función para guardar un nuevo mensaje
export async function saveMessage(messageData: Omit<ContactMessage, 'id' | 'createdAt'>): Promise<ContactMessage> {
  const messages = await getAllMessages();
  
  // Crear un nuevo mensaje con ID único y fecha de creación
  const newMessage: ContactMessage = {
    ...messageData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  
  // Añadir el nuevo mensaje al principio de la lista
  messages.unshift(newMessage);
  
  // Guardar la lista actualizada
  await fs.writeFile(dataFilePath, JSON.stringify(messages, null, 2));
  
  return newMessage;
}

// Función auxiliar para generar un ID único
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
} 