export default class Timer {
    constructor(deltaTime = 1/60) {
        let totalTime = 0;
        let lastTime = 0;

        this.updateProxy = (time) => {
            totalTime += Math.min((time - lastTime) / 1000, 0.1);

            while (totalTime > deltaTime) {
                this.update(deltaTime);
                totalTime -= deltaTime;
            }

            lastTime = time;

            this.kickoffLoop();
        }
    }

    kickoffLoop() {
        requestAnimationFrame(this.updateProxy);
    }

    start() {
        this.kickoffLoop();
    }
}
