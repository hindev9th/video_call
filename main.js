const socket = io('http://192.168.96.19:3333'); // Kết nối đến signaling server
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');

let localStream;
let peerConnection;
const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUN server cho NAT traversal
};

// Truy cập camera/microphone
async function startLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    console.log('Local stream started');
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
}

// Tạo Peer Connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  // Thêm track từ local stream
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Gửi ICE Candidate qua signaling server
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate });
    }
  };

  // Nhận track từ remote peer
  peerConnection.ontrack = (event) => {
    console.log('Remote track received');
    remoteVideo.srcObject = event.streams[0];
  };

  console.log('Peer connection created');
}

// Lắng nghe sự kiện từ signaling server
socket.on('offer', async (data) => {
  console.log('Offer received:', data);
  createPeerConnection();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { answer });
  console.log('Answer sent');
});

socket.on('answer', async (data) => {
  console.log('Answer received:', data);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('candidate', async (data) => {
  console.log('ICE Candidate received:', data);
  await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Bắt đầu gọi video
async function startCall() {
  createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { offer });
  console.log('Offer sent');
}

// Gắn sự kiện cho nút Start Call
startCallButton.addEventListener('click', startCall);

// Khởi chạy local video stream
startLocalStream();
