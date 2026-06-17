export class SerialManager {
  private port: any | null = null;
  private writer: any | null = null;
  private reader: any | null = null;
  private isConnecting = false;
  private keepReading = true;
  private readPromise: Promise<void> | null = null;

  async connect(): Promise<boolean> {
    if (this.isConnecting) return false;
    this.isConnecting = true;

    try {
      // @ts-ignore
      if (!navigator.serial) {
        window.showToast('Web Serial is not supported in this browser. Please use Chrome, Edge, or Opera.', 'error');
        this.isConnecting = false;
        return false;
      }

      // @ts-ignore
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 921600 });
      
      this.writer = this.port.writable.getWriter();
      
      this.keepReading = true;
      // Start reading in background (non-blocking) and capture the promise
      this.readPromise = this.listen();

      // Send initial handshake
      await this.write('HELLO\n');
      this.isConnecting = false;
      return true;
    } catch (err) {
      console.error('Serial connection failed:', err);
      this.isConnecting = false;
      return false;
    }
  }

  async disconnect() {
    this.keepReading = false;
    try {
      if (this.writer) {
        try {
          await this.writer.abort();
        } catch (e) {
          console.warn('Writer abort failed:', e);
        }
        try {
          this.writer.releaseLock();
        } catch (e) {
          console.warn('Writer lock release failed:', e);
        }
        this.writer = null;
      }
      if (this.reader) {
        try {
          await this.reader.cancel();
        } catch (e) {
          console.warn('Reader cancel failed:', e);
        }
        this.reader = null;
      }
      if (this.readPromise) {
        try {
          await this.readPromise;
        } catch (e) {
          console.warn('Waiting for read loop failed:', e);
        }
        this.readPromise = null;
      }
      if (this.port) {
        try {
          await this.port.close();
        } catch (e) {
          console.warn('Port close failed:', e);
        }
        this.port = null;
      }
    } catch (err) {
      console.error('Error disconnecting serial:', err);
    }
  }

  async write(data: string | Uint8Array) {
    if (!this.writer) return;
    try {
      if (typeof data === 'string') {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);
        await this.writer.write(encoded);
      } else {
        await this.writer.write(data);
      }
    } catch (err) {
      console.error('Failed to write to serial:', err);
    }
  }

  private async listen() {
    if (!this.port) return;
    try {
      const decoder = new TextDecoder();
      while (this.port.readable && this.keepReading) {
        const activeReader = this.port.readable.getReader();
        this.reader = activeReader;
        try {
          while (this.keepReading) {
            const { value, done } = await activeReader.read();
            if (done) break;
            const text = decoder.decode(value);
            console.log('[Serial RX]:', text.trim());
          }
        } catch (err) {
          console.error('Serial reading loop crashed:', err);
        } finally {
          try {
            activeReader.releaseLock();
          } catch (e) {
            console.warn('Reader lock release failed in finally:', e);
          }
          this.reader = null;
        }
      }
    } catch (err) {
      console.error('Failed to listen to serial port:', err);
    }
  }

  isConnected(): boolean {
    return this.port !== null;
  }
}
export const serial = new SerialManager();
