document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.sparkle-container');
    const bigStar = document.getElementById('big-star');
    const smallStars = document.querySelectorAll('.small-star');

    window.starAnimation = {
        smallStars: Array.from(smallStars),
        bigStarPos: null
    };

    let bigStarPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let angle = 0;
    let time = 0;

    smallStars.forEach((star, index) => {
        star.style.fontSize = `${Math.random() * 0.4 + 0.4}em`;
        star.dataset.speed = Math.random() * 0.01 + 0.01;
        star.dataset.offset = Math.random() * 2 * Math.PI;
        star.dataset.radiusX = Math.random() * 30 + 40;
        star.dataset.radiusY = Math.random() * 20 + 25;
    });


    function animate() {
        time += 0.01;

        // Move the big star in a Lissajous curve pattern
        bigStarPos.x = (window.innerWidth / 2) + (window.innerWidth / 2 - 50) * Math.sin(time * 0.3);
        bigStarPos.y = (window.innerHeight / 2) + (window.innerHeight / 2 - 50) * Math.cos(time * 0.2);

        window.starAnimation.bigStarPos = bigStarPos;

        const pulse = 1 + 0.1 * Math.sin(time * 2);
        bigStar.style.transform = `translate(${bigStarPos.x}px, ${bigStarPos.y}px) scale(${pulse}) rotate(${time * 50}deg)`;

        if (Math.random() > 0.5) {
            createSparkle(bigStarPos.x, bigStarPos.y);
        }

        // Move the small stars around the big star
        angle += 0.05;
        smallStars.forEach((star, index) => {
            if (star.dataset.animating) return;

            const speed = parseFloat(star.dataset.speed);
            const offset = parseFloat(star.dataset.offset);
            const radiusX = parseFloat(star.dataset.radiusX);
            const radiusY = parseFloat(star.dataset.radiusY);
            const smallStarAngle = offset + angle * speed * 100 + (index * (2 * Math.PI / smallStars.length));
            const x = bigStarPos.x + radiusX * Math.cos(smallStarAngle);
            const y = bigStarPos.y + radiusY * Math.sin(smallStarAngle);
            star.style.transform = `translate(${x}px, ${y}px) rotate(${angle * 200}deg)`;
            if (Math.random() > 0.7) {
                createSparkle(x, y);
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
});