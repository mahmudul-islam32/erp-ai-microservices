/**
 * ERP System Documentation - Interactive Features
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active state in sidebar
                updateActiveNav(targetId);
            }
        });
    });

    // Update active navigation item
    function updateActiveNav(targetId) {
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === targetId) {
                link.classList.add('active');
            }
        });
    }

    // Highlight current section on scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.section');
        const scrollPosition = window.scrollY + 150;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = '#' + section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                updateActiveNav(sectionId);
            }
        });
    });

    // Mobile sidebar toggle (if needed)
    const createMobileToggle = () => {
        if (window.innerWidth <= 768) {
            let toggleBtn = document.querySelector('.mobile-toggle');
            if (!toggleBtn) {
                toggleBtn = document.createElement('button');
                toggleBtn.className = 'mobile-toggle';
                toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                toggleBtn.style.cssText = 'position: fixed; top: 15px; left: 15px; z-index: 1001; background: var(--primary-color); color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;';
                document.body.appendChild(toggleBtn);

                toggleBtn.addEventListener('click', function() {
                    const sidebar = document.querySelector('.sidebar');
                    sidebar.classList.toggle('active');
                });
            }
        }
    };

    createMobileToggle();
    window.addEventListener('resize', createMobileToggle);

    // Copy code to clipboard
    const codeBlocks = document.querySelectorAll('.code-block');
    codeBlocks.forEach(block => {
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.className = 'copy-btn';
        copyBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.1); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;';
        
        block.style.position = 'relative';
        block.appendChild(copyBtn);

        copyBtn.addEventListener('click', function() {
            const code = block.querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 2000);
            });
        });
    });

    // Back to top button
    const backToTop = document.createElement('button');
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.className = 'back-to-top';
    backToTop.style.cssText = 'position: fixed; bottom: 30px; right: 30px; background: var(--primary-color); color: white; border: none; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; display: none; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s;';
    document.body.appendChild(backToTop);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });

    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Search functionality (if search input exists)
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const sections = document.querySelectorAll('.section');

            sections.forEach(section => {
                const text = section.textContent.toLowerCase();
                if (text.includes(searchTerm) || searchTerm === '') {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    }

    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Print documentation
    const createPrintButton = () => {
        const printBtn = document.createElement('button');
        printBtn.innerHTML = '<i class="fas fa-print"></i> Print';
        printBtn.className = 'print-btn';
        printBtn.style.cssText = 'position: fixed; bottom: 90px; right: 30px; background: white; color: var(--primary-color); border: 2px solid var(--primary-color); padding: 10px 20px; border-radius: 6px; cursor: pointer; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.3s;';
        document.body.appendChild(printBtn);

        printBtn.addEventListener('click', function() {
            window.print();
        });
    };

    createPrintButton();

    // Collapsible sections (if needed)
    const collapsibleHeaders = document.querySelectorAll('[data-collapsible]');
    collapsible Headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            if (content.style.display === 'none') {
                content.style.display = 'block';
                this.querySelector('i').classList.replace('fa-plus', 'fa-minus');
            } else {
                content.style.display = 'none';
                this.querySelector('i').classList.replace('fa-minus', 'fa-plus');
            }
        });
    });

    // Initialize tooltips (if needed)
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = element.dataset.tooltip;
        tooltip.style.cssText = 'position: absolute; background: var(--dark-color); color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; white-space: nowrap; z-index: 1001; display: none;';
        document.body.appendChild(tooltip);

        element.addEventListener('mouseenter', function(e) {
            const rect = element.getBoundingClientRect();
            tooltip.style.top = (rect.top - 40) + 'px';
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.display = 'block';
        });

        element.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
        });
    });

    console.log('ERP Documentation - Interactive features loaded');
});

