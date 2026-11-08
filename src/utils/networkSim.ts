/**
 * Network packet routing and TCP retransmission simulation logic
 */

export interface Packet {
  seq: number;
  total: number;
  char: string;
  checksum: number;
  status: 'transit' | 'delivered' | 'dropped';
  attempts: number;
}

export function fragmentMessage(message: string): Packet[] {
  const chars = message.split('');
  const total = chars.length;
  return chars.map((char, seq) => {
    const code = char.charCodeAt(0);
    // Simple checksum
    const checksum = (code * 31 + seq) % 256;
    return {
      seq,
      total,
      char,
      checksum,
      status: 'transit',
      attempts: 1,
    };
  });
}

export function verifyPacket(packet: Packet): boolean {
  const code = packet.char.charCodeAt(0);
  const expected = (code * 31 + packet.seq) % 256;
  return expected === packet.checksum;
}

export function assembleMessage(deliveredPackets: Packet[], totalCount: number): string {
  const sorted = [...deliveredPackets].sort((a, b) => a.seq - b.seq);
  let res = '';
  for (let i = 0; i < totalCount; i++) {
    const p = sorted.find(p => p.seq === i);
    res += p ? p.char : '_';
  }
  return res;
}
