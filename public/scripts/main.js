import { Socket } from "./socket.js";

window.addEventListener("DOMContentLoaded", (event) => {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const startCallButton = document.getElementById('startCall');
  const joinZoomButton = document.getElementById('joinZoom');
  const cancelCallButton = document.getElementById('cancelCall');
  const toggleMicButton = document.getElementById('toggleMic');
  const toggleCamButton = document.getElementById('toggleCam');
  const inputZoomName = document.getElementById('room-name');
  const inputUsername = document.getElementById('username');
  const actionCalling = document.querySelector('.action-calling');
  const actionZoom = document.querySelector('.action-zoom');

  let localStream;
  let isMicMuted = false;
  let isCamOff = false;
  const socket = new Socket();


  // Truy cập camera/microphone
  async function startLocalStream() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      socket.localStream = localStream;
      socket.localVideo = localStream;
      localVideo.srcObject = localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }

  // Bắt đầu gọi video
  async function startCall() {
    try {
      const username = inputUsername.value;
      socket.emit('create-group', { username });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }

  joinZoomButton.addEventListener('click', () => {
    const username = inputUsername.value;
    window.groupId = inputZoomName.value;
    socket.emit('join-group', { id: inputZoomName.value, username });
  });

  // Gắn sự kiện cho nút Start Call
  startCallButton.addEventListener('click', startCall);

  cancelCallButton.addEventListener('click', () => {
    if (socket.peerConnection) {
      socket.peerConnection.close();
      socket.peerConnection = null;
      socket.emit('cancel-call');
      localVideo.classList.remove('calling');
      actionCalling.style.display = 'none';
      remoteVideo.srcObject = null;
      remoteVideo.classList.remove('joined');
    }

  });

  toggleMicButton.addEventListener('click', () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        isMicMuted = !isMicMuted;
        audioTrack.enabled = !isMicMuted;
        toggleMicButton.textContent = isMicMuted ? 'Unmute Microphone' : 'Mute Microphone';
      }
    }
  });

  toggleCamButton.addEventListener('click', () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        isCamOff = !isCamOff;
        videoTrack.enabled = !isCamOff;
        toggleCamButton.textContent = isCamOff ? 'Turn On Camera' : 'Turn Off Camera';
      }
    }
  });
  startLocalStream();

});
