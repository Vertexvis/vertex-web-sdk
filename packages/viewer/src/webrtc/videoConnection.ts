export class VideoWebRtcConnection {
  private peerConnection?: RTCPeerConnection;
  private mediaStream?: MediaStream;
  private jsonDataChannel?: RTCDataChannel;
  private metadataChannel?: RTCDataChannel;
  private metadataMap: Record<number, any>;
  private latestMetadata: any;
  private video?: HTMLVideoElement;

  constructor(
    private canvasElement?: HTMLCanvasElement,
    private videoElement?: HTMLVideoElement
  ) {
    this.metadataMap = {};

    this.handleJsonMessage = this.handleJsonMessage.bind(this);
  }

  public isConnected(): boolean {
    return this.peerConnection != null && this.jsonDataChannel != null;
  }

  public getMediaStream(): MediaStream | undefined {
    return this.mediaStream;
  }

  public getLatestMetadata(): any {
    return this.latestMetadata;
  }
  public getMetadata(frameNumber: number): any {
    return this.metadataMap[frameNumber];
  }

  public async connect(url: string): Promise<RTCPeerConnection> {
    const response = await fetch(`${url}/connection/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneStateId: 'sceneStateId',
        credentials: {},
      }),
    });

    const connection = await response.json();

    console.log(connection);
    console.log(connection.localDescription.sdp);

    const config = {
      // iceServers: [{ urls: 'stun:stun2.l.google.com:19302' }],
      iceServers: [
        {
          urls: 'turn:192.168.1.6',
          username: 'username',
          credential: 'password',
        },
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
      ],
    };
    console.log(config);
    this.peerConnection = new RTCPeerConnection(config);

    let answerPromiseResolve;
    const answerPromise = new Promise(
      resolve => (answerPromiseResolve = resolve)
    );

    this.peerConnection.addEventListener(
      'icecandidate',
      async candidateEvent => {
        if (candidateEvent.candidate != null) {
          // if (candidateEvent.candidate?.candidate.includes('typ relay')) {
          // if (candidateEvent.candidate?.candidate.includes('69.5.130.233')) {
          await answerPromise;

          try {
            this.peerConnection
              .addIceCandidate(candidateEvent.candidate)
              .then(async () => {
                // console.log(candidateEvent.candidate);
                // console.log(this.peerConnection.localDescription.sdp)
                // console.log(this.peerConnection.remoteDescription.sdp)
                // console.log(this.peerConnection)
                console.log(
                  '------------------- successfully added ice candidate -------------------'
                );
                this.peerConnection.setRemoteDescription(
                  this.peerConnection.remoteDescription
                );
              })
              .catch(e => {
                console.log(
                  '------------------- failed to add ice candidate -------------------'
                );
                console.log(candidateEvent.candidate);
                // ignore
              });
          } catch (e) {
            console.log(e);
          }
        }
      }
    );

    // this.peerConnection?.addEventListener(
    //   'iceconnectionstatechange',
    //   stateChangeEvent => {
    //     console.log(stateChangeEvent);
    //   }
    // );

    // this.peerConnection?.addEventListener('icecandidate', async candidate => {
    //   console.log(candidate)
    //   this.peerConnection?.addIceCandidate(candidate.candidate)
    //   await this.peerConnection?.setLocalDescription(await this.peerConnection?.createAnswer())
    // })

    // this.peerConnection?.addEventListener('icecandidateerror', candidateError => {
    //   console.log(candidateError)
    // })

    await this.peerConnection.setRemoteDescription(connection.localDescription);

    this.video = document.createElement('video');
    const remoteStream = new MediaStream(
      this.peerConnection.getReceivers().map(receiver => receiver.track)
    );
    this.mediaStream = remoteStream;

    if (this.videoElement != null) {
      this.videoElement.srcObject = remoteStream;
    }
    this.video.srcObject = remoteStream;

    if (this.canvasElement != null) {
      const updateCanvas = () => {
        const context = this.canvasElement.getContext('2d');

        if (context != null) {
          context.drawImage(this.videoElement!, 0, 0);

          // const rgbaFrame = context.getImageData(0, 0, 300, 300);

          // const code = jsQr(rgbaFrame.data, rgbaFrame.width, rgbaFrame.height, {
          //   inversionAttempts: 'dontInvert'
          // });

          // if (code != null) {
          //   window.dispatchEvent(new CustomEvent("metadata", { detail: JSON.parse(code.data) }));
          // }
        }

        window.requestAnimationFrame(updateCanvas);
      };

      window.requestAnimationFrame(updateCanvas);
    }

    const commandChannelPromise = new Promise((resolve, reject) => {
      this.peerConnection!.addEventListener('datachannel', channelEvent => {
        console.log(channelEvent);
        if (channelEvent.channel.label === 'metadata') {
          this.metadataChannel = channelEvent.channel;
          this.metadataChannel.addEventListener(
            'message',
            this.handleJsonMessage
          );
        } else {
          this.jsonDataChannel = channelEvent.channel;
          const resolveChannelPromise = () => {
            this.jsonDataChannel!.removeEventListener(
              'open',
              resolveChannelPromise
            );
            resolve();
          };
          this.jsonDataChannel.addEventListener('open', resolveChannelPromise);
        }
      });

      setTimeout(reject, 10000);
    });

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    answerPromiseResolve();

    console.log(this.peerConnection.localDescription.sdp);

    await new Promise(resolve => this.peerConnection.addEventListener('icegatheringstatechange', (event: any) => event.target.iceGatheringState === 'complete' && resolve()))

    await fetch(`${url}/connection/${connection.id}`, {
      method: 'POST',
      body: JSON.stringify(this.peerConnection.localDescription),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(this.peerConnection);
    await commandChannelPromise;

    return this.peerConnection;
  }

  public async close(): Promise<void> {
    this.send({ type: 'stop-video' });
    this.peerConnection?.close();
  }

  public async send(message: Record<string, any>): Promise<void> {
    console.log(message);
    this.jsonDataChannel?.send(JSON.stringify(message));
  }

  private handleJsonMessage(event: MessageEvent) {
    const parsed = JSON.parse(event.data);

    if (parsed.type === 'metadata') {
      // this.metadataMap[parsed.frameNumber] = parsed;
      this.latestMetadata = parsed;

      window.dispatchEvent(new CustomEvent('metadata', { detail: parsed }));
    }
  }
}
