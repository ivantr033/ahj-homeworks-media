export default class MediaManager {
    constructor(updateTimerCallback) {
        this.stream = null;
        this.recorder = null;
        this.chunks = [];
        this.timerId = null;
        this.secondsElapsed = 0;
        this.updateTimerCallback = updateTimerCallback;
    }

    async startRecording(mode = 'audio') {
        this.chunks = [];
        this.secondsElapsed = 0;

        const constraints = {
            audio: true,
            video: mode === 'video'
        };

        // Request direct access to the PC's microphone/camera hardware.
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);

        this.recorder = new MediaRecorder(this.stream);

        this.recorder.addEventListener('dataavailable', (e) => {
            if (e.data && e.data.size > 0) {
                this.chunks.push(e.data);
            }
        });

        this.recorder.start();
        this.startTimer();

        return this.stream; // Returns the stream in case the live-preview video requires it
    }

    startTimer() {
        this.timerId = setInterval(() => {
            this.secondsElapsed += 1;
            const mins = String(Math.floor(this.secondsElapsed / 60)).padStart(2, '0');
            const secs = String(this.secondsElapsed % 60).padStart(2, '0');
            this.updateTimerCallback(`${mins}:${secs}`);
        }, 1000);
    }

    stopRecording(save = true) {
        return new Promise((resolve) => {
            clearInterval(this.timerId);

            if (!this.recorder || this.recorder.state === 'inactive') {
                this.cleanup();
                resolve(null);
                return;
            }

            this.recorder.addEventListener('stop', () => {
                let blob = null;
                if (save && this.chunks.length > 0) {
                    blob = new Blob(this.chunks, { type: this.recorder.mimeType });
                }
                this.cleanup();
                resolve(blob);
            });

            this.recorder.stop();
        });
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop()); // Turn off the hardware
        }
        this.stream = null;
        this.recorder = null;
        clearInterval(this.timerId);
    }
}
