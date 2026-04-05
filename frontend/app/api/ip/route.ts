import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  // Prioritize 192.168.x.x addresses as they are the most common for home Wi-Fi
  const prioritized = addresses.sort((a, b) => {
    if (a.startsWith('192.168.')) return -1;
    if (b.startsWith('192.168.')) return 1;
    return 0;
  });

  const localIp = prioritized[0] || 'localhost';
  
  return NextResponse.json({ ip: localIp });
}
