export class WebRtcConnection {
  private peerConnection?: RTCPeerConnection;
  private dataChannels: RTCDataChannel[];
  private commandChannel?: RTCDataChannel;

  constructor() {
    this.dataChannels = [];

    this.setupCommandChannel = this.setupCommandChannel.bind(this);
    this.setupDataChannel = this.setupDataChannel.bind(this);
  }

  public isConnected(): boolean {
    return this.peerConnection != null && this.dataChannels.length != 0;
  }

  public async connect(
    sceneStateId?: string,
    token?: object
  ): Promise<RTCPeerConnection> {
    const response = await fetch(`http://localhost:3100/connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sceneStateId,
        credentials: token,
      }),
    });

    const connection = await response.json();

    console.log(connection);
    console.log(connection.localDescription.sdp);

    this.peerConnection = new RTCPeerConnection();

    await this.peerConnection.setRemoteDescription(connection.localDescription);

    const commandChannelPromise = new Promise((resolve, reject) => {
      this.peerConnection!.addEventListener("datachannel", (channelEvent) => {
        if (channelEvent.channel.label === "commands") {
          this.setupCommandChannel(channelEvent.channel);
          const resolveChannelPromise = () => {
            this.commandChannel?.removeEventListener('open', resolveChannelPromise);
            resolve();
          }
          this.commandChannel!.addEventListener('open', resolveChannelPromise);
        } else {
          this.setupDataChannel(channelEvent.channel);
        }
      });

      setTimeout(() => {
        reject()
      }, 10000);
    });

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await fetch(`http://localhost:3100/connection/${connection.id}`, {
      method: "POST",
      body: JSON.stringify(this.peerConnection.localDescription),
      headers: {
        "Content-Type": "application/json",
      },
    });

    await commandChannelPromise;

    return this.peerConnection;
  }

  public close(): void {
    this.send({ type: 'end-stream' });
    this.peerConnection?.close();
  }

  public send(message: object): void {
    this.commandChannel?.send(JSON.stringify(message));
  }

  private setupCommandChannel(channel: RTCDataChannel) {
    this.commandChannel = channel;
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannels.push(channel);

    channel.addEventListener("message", (message) => {
      const buffer: ArrayBuffer = message.data;

      const metadataSizeBuffer = buffer.slice(0, 1);
      const metadataSize = new DataView(metadataSizeBuffer).getUint8(0);
      const metadataBuffer = buffer.slice(1, metadataSize + 1);
      const metadata = JSON.parse(
        String.fromCharCode.apply(
          null,
          Array.from(new Uint8Array(metadataBuffer))
        )
      );

      window.dispatchEvent(
        new CustomEvent("partialframe", {
          detail: {
            metadata,
            buffer: buffer.slice(metadataSize + 1, buffer.byteLength),
          },
        })
      );
    });
  }
}
