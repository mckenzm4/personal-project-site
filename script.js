document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(5, 5, 5, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0, 243, 255, 0.1)';
        } else {
            header.style.background = 'rgba(5, 5, 5, 0.9)';
            header.style.boxShadow = 'none';
        }
    });

    // Simplified entrance effect for Hero
    document.querySelectorAll('.glitch').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        setTimeout(() => {
            el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 + (index * 200));
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.project-card, .skill-item, .mission-card').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.setProperty('--i', index);
        // transition is now handled in CSS for stagger to work cleanly with overrides
        observer.observe(el);
    });

    // Scroll-Linked Neural Network Logic
    const scrollNet = document.getElementById('scroll-net');
    if (scrollNet) {
        const layers = [3, 5, 5, 3]; // Nodes per layer
        const layerSpacing = 100 / (layers.length - 1);
        const nodeRadius = 4;
        const netHeight = 800;
        const netWidth = 100;

        const nodes = [];

        // Generate Nodes and Connections
        layers.forEach((count, lIndex) => {
            const x = (lIndex / (layers.length - 1)) * netWidth;
            const yOffset = (netHeight / (count + 1));

            for (let i = 1; i <= count; i++) {
                const y = i * yOffset;
                const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                node.setAttribute("cx", x);
                node.setAttribute("cy", y);
                node.setAttribute("r", nodeRadius);
                node.classList.add("node");
                scrollNet.appendChild(node);
                nodes.push({ element: node, x, y, layer: lIndex });

                // Connect to previous layer
                if (lIndex > 0) {
                    const prevLayerNodes = nodes.filter(n => n.layer === lIndex - 1);
                    prevLayerNodes.forEach(prevNode => {
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute("x1", prevNode.x);
                        line.setAttribute("y1", prevNode.y);
                        line.setAttribute("x2", x);
                        line.setAttribute("y2", y);
                        line.classList.add("connection");
                        // Insert connections behind nodes
                        scrollNet.insertBefore(line, scrollNet.firstElementChild);
                    });
                }
            }
        });

        function updateScrollNet() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercentage = scrollTop / scrollHeight;

            // Highlight nodes based on vertical position corresponding to scroll
            const connections = scrollNet.querySelectorAll('.connection');

            nodes.forEach(node => {
                const nodeRelativeY = node.y / netHeight;
                // Activate node if its vertical position roughly matches scroll
                const isActive = Math.abs(nodeRelativeY - scrollPercentage) < 0.15;
                node.element.classList.toggle('active', isActive);
            });

            connections.forEach(conn => {
                const y1 = parseFloat(conn.getAttribute('y1')) / netHeight;
                const y2 = parseFloat(conn.getAttribute('y2')) / netHeight;
                const midY = (y1 + y2) / 2;
                const isActive = Math.abs(midY - scrollPercentage) < 0.1;
                conn.classList.toggle('active', isActive);
            });
        }

        // Initial call and listener
        updateScrollNet();

        // Click to navigate logic
        scrollNet.parentElement.addEventListener('click', (e) => {
            const rect = scrollNet.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const clickProgress = clickY / rect.height;

            const targetScroll = clickProgress * (document.documentElement.scrollHeight - document.documentElement.clientHeight);

            window.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        });

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateScrollNet();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // --- AI DATA ASSISTANT LOGIC ---

    // 1. Portfolio Context (The "Brain" for the LLM)
    const portfolioContext = {
        owner: "Michael McKenzie[Your Name]",
        role: "Business Intelligence Developer",
        skills: ["Snowflake", "Power BI", "Data Modeling", "SQL", "Python", "ETL"],
        experience: [
            {
                title: "The Strategist",
                desc: "Migrated legacy Hyperion reporting to Power BI, resulting in 40% performance boost and $20k cost savings."
            },
            {
                title: "The Engineer",
                desc: "Optimized Snowflake data pipelines and warehouse architecture for SpartanNash."
            }
        ],
        projects: [
            {
                title: "The Visualizer",
                desc: "Real-time Solana crypto dashboard using custom API integrations."
            }
        ],
        contact: "See RESUME_DOWNLOAD for contact details."
    };

    const aiInput = document.getElementById('ai-input');
    const aiModal = document.getElementById('ai-response-modal');
    const aiOutput = document.getElementById('ai-output');
    const closeAiBtn = document.querySelector('.close-ai');

    if (aiInput && aiModal && aiOutput) {
        aiInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = aiInput.value.trim();
                if (!query) return;

                // Show modal and thinking state
                aiModal.classList.add('show');
                aiOutput.innerHTML = '<span class="blink">Processing Query...</span>';
                aiInput.value = '';
                aiInput.blur();

                try {
                    // Simple relative path: works both via server.js and on Vercel
                    const API_URL = '/api/chat';

                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message: query })
                    });

                    if (response.status === 429) {
                        // Quota exceeded — show the witty branded message
                        const data = await response.json();
                        typeWriter(data.reply, aiOutput);
                    } else if (!response.ok) {
                        aiOutput.textContent = "The AI assistant encountered an error. Please try again in a moment.";
                    } else {
                        const data = await response.json();
                        // Typewriter effect for AI reply
                        typeWriter(data.reply, aiOutput);
                    }

                } catch (error) {
                    aiOutput.textContent = "Unable to reach the AI assistant. Please try again in a moment.";
                }
            }
        });

        // Close Modal Logic
        closeAiBtn.addEventListener('click', () => {
            aiModal.classList.remove('show');
        });

        // Mock Logic removed - now handled by backend 👆

        function typeWriter(text, element) {
            element.innerHTML = '';
            let i = 0;
            const speed = 20; // typing speed

            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            }
            type();
        }
    }

    // Resume Download Mock interaction
    const resumeBtn = document.querySelector('.btn-resume');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Downloading Michael McKenzie\'s Resume...');
        });
    }

});
