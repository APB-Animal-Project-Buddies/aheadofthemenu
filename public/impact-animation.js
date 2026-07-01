// Number rollup animation for impact metrics
function animateNumber(element, target, duration = 1000) {
    // Start from 90% of target for a smooth count-up
    const startValue = Math.floor(target * 0.9);
    const increment = (target - startValue) / (duration / 16);
    let current = startValue;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Intersection Observer for impact numbers animation
const observerOptions = {
    threshold: 0.7,
    rootMargin: '0px 0px -50px 0px'
};

const impactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const impactNumbers = entry.target.querySelectorAll('.impact-number');
            impactNumbers.forEach(numberEl => {
                const target = parseInt(numberEl.getAttribute('data-target'));
                animateNumber(numberEl, target);
            });
            impactObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Fetch impact metrics and update targets, then start observing
document.addEventListener('DOMContentLoaded', async () => {
    const impactSection = document.querySelector('.impact');
    if (!impactSection) return;

    // Fetch dynamic metrics from API
    try {
        const response = await fetch('/api/impact');
        const data = await response.json();

        // Update data-target attributes with fetched values
        const impactNumbers = impactSection.querySelectorAll('.impact-number');
        impactNumbers.forEach(el => {
            const label = el.nextElementSibling?.textContent?.toLowerCase() || '';
            if (label.includes('dollars') && data.metrics?.dollarsRaised) {
                el.setAttribute('data-target', data.metrics.dollarsRaised);
            } else if (label.includes('people') && data.metrics?.peopleReached) {
                el.setAttribute('data-target', data.metrics.peopleReached);
            }
        });
    } catch (err) {
        console.warn('Failed to fetch impact metrics, using defaults:', err);
    }

    impactObserver.observe(impactSection);
});
