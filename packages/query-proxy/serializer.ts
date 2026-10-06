import { RPCSerializer } from '@orpc/client'
import { base64ToBytes, bytesToBase64 } from '@tamery/shared/base64'

/** Both ends of the query router must use it: the default serializer turns a driver's bytes (`varbinary`, `blob`, `bit`) into a plain object. */
export const querySerializer = new RPCSerializer({
  handlers: {
    bytes: {
      condition: (value) => value instanceof Uint8Array,
      deserialize: (serialized) => {
        if (typeof serialized !== 'string') {
          throw new TypeError('Expected base64 bytes')
        }
        return base64ToBytes(serialized)
      },
      isTerminal: true,
      serialize: bytesToBase64,
    },
  },
})
