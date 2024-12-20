import { ICE_SERVERS, SOCKET_URL } from './constants.js';

export class Socket {
  constructor() {
    this.socket = io(SOCKET_URL);
    this.peerConnection = undefined;
    this.localStream = undefined;

    // Bind methods to the class instance
    this.onCreateGroup = this.onCreateGroup.bind(this);
    this.onMemberJoin = this.onMemberJoin.bind(this);
    this.onJoinGroup = this.onJoinGroup.bind(this);
    this.onOffer = this.onOffer.bind(this);
    this.onAnswer = this.onAnswer.bind(this);
    this.onCandidate = this.onCandidate.bind(this);

    this.on('create-group', this.onCreateGroup);
    this.on('member-join', this.onMemberJoin);
    this.on('join-group', this.onJoinGroup);
    this.on('offer-group', this.onOffer);
    this.on('answer-group', this.onAnswer);
    this.on('candidate-group', this.onCandidate);
  }

  on(eventName, callback) {
    this.socket.on(eventName, callback);
  }

  emit(eventName, data) {
    this.socket.emit(eventName, data);
  }

  async onCreateGroup(data) {
    if (data.status === 201) {
      this.remoteVideo = document.getElementById('remoteVideo');
      this.titleGroupId = document.getElementById('group-id');
      this.actionCalling = document.querySelector('.action-calling');
      this.localVideo = document.getElementById('localVideo');

      this.titleGroupId.innerHTML = `Group ID: ${data.message}`;
      window.groupId = data.message;
      this.localVideo.classList.add('calling');
      this.actionCalling.style.display = 'flex';
      await this.createPeerConnection();

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      window.offerVideo = offer;
    }
  }

  onMemberJoin(data) {
    this.emit('offer-group', { id: window.groupId, data: offerVideo });
  }

  onJoinGroup(data) {
    if (data.status === 200) {
      this.remoteVideo = document.getElementById('remoteVideo');
      this.titleGroupId = document.getElementById('group-id');
      this.actionCalling = document.querySelector('.action-calling');
      this.localVideo = document.getElementById('localVideo');

      this.localVideo.classList.add('calling');
      this.actionCalling.style.display = 'flex';
    }
  }

  async onOffer(data) {
    if (this.peerConnection && this.peerConnection.signalingState !== 'stable') {
      console.warn('PeerConnection is not stable, skipping offer');
      return;
    }
    try {
      await this.createPeerConnection();
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.emit('answer-group', { id: groupId, data: answer });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async onAnswer(data) {
    if (!this.peerConnection || this.peerConnection.signalingState !== 'have-local-offer') {
      console.warn('Invalid signaling state for setting answer:', peerConnection?.signalingState);
      return;
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  }

  async onCandidate(data) {
    if (!this.peerConnection) {
      console.warn('PeerConnection not ready to handle candidate');
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  async createPeerConnection() {
    // const server = await getXirsysIceServers();
    // peerConnection = new RTCPeerConnection({ iceServers: server });
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    const tracks = this.localStream.getTracks();
    // Thêm track từ local stream
    tracks.forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', this.peerConnection.iceConnectionState);
      if (this.peerConnection.iceConnectionState === 'disconnected') {
        this.localVideo.classList.remove('joined');
        this.remoteVideo.classList.remove('joined');
      }
      if (this.peerConnection.iceConnectionState === 'failed') {
        alert("ICE connection failed. Trying to reconnect...");
        this.peerConnection.restartIce();
      }
    };

    // Gửi ICE Candidate qua signaling server
    this.peerConnection.onicecandidate = (event) => {
      console.log('ICE Candidate:', window.groupId);

      if (event.candidate) {
        this.emit('candidate-group', { id: groupId, data: event.candidate });
      }
    };

    // Nhận track từ remote peer
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.localVideo.classList.add('joined');
        this.remoteVideo.classList.add('joined');
      }
      this.remoteVideo.srcObject = event.streams[0];
    };
  }
}