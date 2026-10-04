import { parseCoordinates } from './parseCoordinates';
import MediaManager from './MediaManager';

export default class TimelineApp {
    constructor(container) {
        this.container = container;
        this.mediaManager = null;
        this.currentMode = 'text'; // text | audio | video
        this.pendingBlob = null;   // Saves the multimedia blob while the coordinates are being validated.

        // DOM Anchors
        this.postsViewport = null;
        this.coreInput = null;
        this.iconsGroup = null;
        this.recorderControls = null;
        this.timerDisplay = null;
        this.saveRecBtn = null;
        this.cancelRecBtn = null;

        //  Modal Anchors
        this.modalOverlay = null;
        this.manualCoordsInput = null;
        this.modalErrorMsg = null;
        this.submitGeoBtn = null;
        this.closeModalBtn = null;
    }

    init() {
        this.postsViewport = this.container.querySelector('#posts-history-viewport');
        this.coreInput = this.container.querySelector('#timeline-core-input');
        this.iconsGroup = this.container.querySelector('#standard-icons-group');
        this.recorderControls = this.container.querySelector('#active-recorder-controls');
        this.timerDisplay = this.container.querySelector('#live-timer-display');

        this.saveRecBtn = this.container.querySelector('#btn-save-recording');
        this.cancelRecBtn = this.container.querySelector('#btn-cancel-recording');

        this.modalOverlay = document.getElementById('geo-modal-overlay');
        this.manualCoordsInput = document.getElementById('manual-coords-input');
        this.modalErrorMsg = document.getElementById('geo-input-error-msg');
        this.submitGeoBtn = document.getElementById('btn-submit-geo-manual');
        this.closeModalBtn = document.getElementById('btn-close-geo-modal');

        // Initialize the Media Manager by passing the timer callback
        this.mediaManager = new MediaManager((timeStr) => {
            this.timerDisplay.innerText = timeStr;
        });

        this.bindEvents();
    }

    bindEvents() {
        // Listener for regular text input when pressing Enter
        this.coreInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = this.coreInput.value.trim();
                if (!text) return;
                this.currentMode = 'text';
                this.processPostCreation(text);
            }
        });

        // Turn on audio recorder
        this.container.querySelector('#btn-trigger-audio-rec').addEventListener('click', async () => {
            try {
                this.currentMode = 'audio';
                this.toggleRecorderBar(true);
                await this.mediaManager.startRecording('audio');
            } catch (err) {
                alert('Доступ к микрофону заблокирован или не поддерживается вашим браузером.');
                this.toggleRecorderBar(false);
            }
        });

        // Turn on video recorder
        this.container.querySelector('#btn-trigger-video-rec').addEventListener('click', async () => {
            try {
                this.currentMode = 'video';
                this.toggleRecorderBar(true);
                const liveStream = await this.mediaManager.startRecording('video');

                // Turn on the floating preview video element and assign the live stream to it
                const liveVideoEl = document.getElementById('video-live-preview');
                const holder = document.getElementById('video-preview-stream-holder');
                liveVideoEl.srcObject = liveStream;
                holder.style.display = 'block';
            } catch (err) {
                alert('Доступ к камере заблокирован или не поддерживается вашим браузером.');
                this.toggleRecorderBar(false);
            }
        });

        // Save Active Recording (✔)
        this.saveRecBtn.addEventListener('click', async () => {
            document.getElementById('video-preview-stream-holder').style.display = 'none';
            this.toggleRecorderBar(false);
            const blob = await this.mediaManager.stopRecording(true);
            if (blob) {
                this.pendingBlob = blob;
                this.processPostCreation(null); // Pass to geolocation validation
            }
        });

        // Cancel Active Recording (✘)
        this.cancelRecBtn.addEventListener('click', async () => {
            document.getElementById('video-preview-stream-holder').style.display = 'none';
            this.toggleRecorderBar(false);
            await this.mediaManager.stopRecording(false);
            this.pendingBlob = null;
        });

        // Clicks on the buttons of the manual coordinates modal
        this.submitGeoBtn.addEventListener('click', () => {
            const inputVal = this.manualCoordsInput.value.trim();
            try {
                const coords = parseCoordinates(inputVal);
                this.modalOverlay.style.display = 'none';
                this.modalErrorMsg.innerText = '';
                this.manualCoordsInput.value = '';

                // Finally, insert the retained card using the approved manual data
                this.insertPostIntoDOM(this.coreInput.value.trim(), this.pendingBlob, coords);
                this.coreInput.value = '';
                this.pendingBlob = null;
            } catch (err) {
                this.modalErrorMsg.innerText = err.message; // Paint the descriptive red message
            }
        });

        this.closeModalBtn.addEventListener('click', () => {
            this.modalOverlay.style.display = 'none';
            this.modalErrorMsg.innerText = '';
            this.manualCoordsInput.value = '';
            this.pendingBlob = null;
        });
    }

    toggleRecorderBar(showActive) {
        if (showActive) {
            this.coreInput.style.display = 'none';
            this.iconsGroup.style.display = 'none';
            this.recorderControls.style.display = 'flex';
            this.timerDisplay.innerText = '00:00';
        } else {
            this.coreInput.style.display = 'block';
            this.iconsGroup.style.display = 'flex';
            this.recorderControls.style.display = 'none';
        }
    }

    processPostCreation(textPayload) {
        // Try to capture native geolocation via hardware.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    this.insertPostIntoDOM(textPayload, this.pendingBlob, coords);
                    if (textPayload) this.coreInput.value = '';
                    this.pendingBlob = null;
                },
                () => {
                    // If the user denies geolocation permissions, we open the contingency modal
                    this.modalOverlay.style.display = 'flex';
                    this.manualCoordsInput.focus();
                },
                { enableHighAccuracy: true }
            );
        } else {
            this.modalOverlay.style.display = 'flex';
            this.manualCoordsInput.focus();
        }
    }

    insertPostIntoDOM(text, blob, coords) {
        const card = document.createElement('div');
        card.className = 'timeline-post-card';

        // Chronological formatter (15.03.19 08:40)
        const dateStr = new Date().toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(',', '');

        let mediaHTML = '';

        // If the post contains a multimedia blob...
        if (blob) {
            const mediaURL = URL.createObjectURL(blob);
            if (this.currentMode === 'audio') {
                mediaHTML = `<audio src="${mediaURL}" class="post-media-player" controls></audio>`;
            } else if (this.currentMode === 'video') {
                mediaHTML = `<video src="${mediaURL}" class="post-media-player" controls></video>`;
            }
        } else if (text) {
            mediaHTML = `<div class="post-body-text">${text}</div>`;
        }

        card.innerHTML = `
      <div class="post-header-date">${dateStr}</div>
      ${mediaHTML}
      <div class="post-footer-geo">
        <span>[${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}]</span> 👁️
      </div>
    `;

        //Reverse chronological insertion: the new element is placed at the top of the vertical line
        this.postsViewport.insertBefore(card, this.postsViewport.firstChild);
    }
}
