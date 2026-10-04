import TimelineApp from './TimelineApp';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('timeline-root-wrapper');
    if (root) {
        const appInstance = new TimelineApp(root);
        appInstance.init();
    }
});
