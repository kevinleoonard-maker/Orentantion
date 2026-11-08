import test from 'node:test';
import assert from 'node:assert/strict';
import { fragmentMessage, verifyPacket, assembleMessage } from './networkSim';

test('fragmentMessage splits text into verified TCP packets', () => {
  const msg = 'Vallauri';
  const packets = fragmentMessage(msg);
  assert.equal(packets.length, 8);
  assert.equal(packets[0].char, 'V');
  assert.equal(verifyPacket(packets[0]), true);

  const assembled = assembleMessage(packets, 8);
  assert.equal(assembled, 'Vallauri');
});
