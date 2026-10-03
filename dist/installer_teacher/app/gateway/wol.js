const dgram = require('dgram');

/**
 * Tạo Wake-on-LAN Magic Packet chuẩn IEEE 802.3
 * 6 byte 0xFF + 16 lần lặp MAC address (tổng cộng 102 bytes)
 */
function createMagicPacket(macAddress) {
  const cleanMac = macAddress.replace(/[^0-9A-Fa-f]/g, '');
  if (cleanMac.length !== 12) {
    throw new Error(`Địa chỉ MAC không hợp lệ: ${macAddress}`);
  }

  const macBytes = Buffer.from(cleanMac, 'hex');
  const packet = Buffer.alloc(102);

  // 6 byte 0xFF
  for (let i = 0; i < 6; i++) {
    packet[i] = 0xFF;
  }

  // 16 lần lặp MAC
  for (let i = 0; i < 16; i++) {
    macBytes.copy(packet, 6 + i * 6);
  }

  return packet;
}

/**
 * Gửi Wake-on-LAN Magic Packet qua UDP Broadcast
 */
function sendWakeOnLan(macAddress, broadcastIp = '255.255.255.255', port = 9) {
  return new Promise((resolve, reject) => {
    try {
      const packet = createMagicPacket(macAddress);
      const socket = dgram.createSocket('udp4');

      socket.once('error', (err) => {
        socket.close();
        reject(err);
      });

      socket.bind(() => {
        socket.setBroadcast(true);
        socket.send(packet, 0, packet.length, port, broadcastIp, (err) => {
          socket.close();
          if (err) {
            reject(err);
          } else {
            resolve({ success: true, mac: macAddress, broadcastIp, port });
          }
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { createMagicPacket, sendWakeOnLan };
