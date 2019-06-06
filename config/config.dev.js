module.exports = {
  debug: true,
  limit: 10,
  peerIdLength: 6, // length of the peer id segment of the url. Should be set according to peering-server setting
  fileIdLength: 4, // length of the file id segment of the url. Should be set according to peering-server setting
  chunkSize: 15000, // big files get chunked into chunkSize
  chunksPerBlock: 64, // size of chunks in a block
  peerConfig: {
    host: 'localhost', // peering server address
    path: '/', // endpoint path
    port: 9000,
    key: 'peerjs', // client key when using multiple clients on the same peering server
    config: {
      iceServers: [
        { url: 'stun:stun.l.google.com:19302' },
        { url: 'stun:stun1.l.google.com:19302' }
        // configure additional ICE/STUN servers here
      ]
    }
  }
}
