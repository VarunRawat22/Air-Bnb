(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

// Navbar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Category scrolling functionality
    const categoryList = document.querySelector('.category-list');
    const scrollLeftBtn = document.querySelector('.scroll-left');
    const scrollRightBtn = document.querySelector('.scroll-right');
    
    if (categoryList && scrollLeftBtn && scrollRightBtn) {
        // Show/hide scroll buttons based on scroll position
        function updateScrollButtons() {
            const isAtStart = categoryList.scrollLeft === 0;
            const isAtEnd = categoryList.scrollLeft + categoryList.clientWidth >= categoryList.scrollWidth;
            
            scrollLeftBtn.style.display = isAtStart ? 'none' : 'flex';
            scrollRightBtn.style.display = isAtEnd ? 'none' : 'flex';
        }
        
        // Scroll left
        scrollLeftBtn.addEventListener('click', () => {
            categoryList.scrollBy({
                left: -200,
                behavior: 'smooth'
            });
        });
        
        // Scroll right
        scrollRightBtn.addEventListener('click', () => {
            categoryList.scrollBy({
                left: 200,
                behavior: 'smooth'
            });
        });
        
        // Update buttons on scroll
        categoryList.addEventListener('scroll', updateScrollButtons);
        
        // Initial button state
        updateScrollButtons();
    }
    
    // Category item click functionality
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            categoryItems.forEach(cat => cat.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Here you can add filtering logic based on category
            const category = this.querySelector('span').textContent;
            console.log('Selected category:', category);
            
            // Redirect to search page with category filter
            window.location.href = `/listings/search?category=${encodeURIComponent(category)}`;
        });
    });
    
    // Search form functionality
    const searchForm = document.querySelector('.search-bar');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            // Form will submit automatically to /listings/search
            console.log('Search form submitted');
        });
    }
    
    // Search input focus effects and date handling
    const searchInputs = document.querySelectorAll('.search-input');
    const checkinInput = document.querySelector('input[name="checkin"]');
    const checkoutInput = document.querySelector('input[name="checkout"]');
    
    // Set default dates (check-in: tomorrow, check-out: day after tomorrow)
    if (checkinInput && checkoutInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        checkinInput.value = tomorrow.toISOString().split('T')[0];
        checkoutInput.value = dayAfterTomorrow.toISOString().split('T')[0];
        
        // Ensure checkout is after checkin
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            const minCheckout = new Date(checkinDate);
            minCheckout.setDate(minCheckout.getDate() + 1);
            
            if (checkoutInput.value && new Date(checkoutInput.value) <= checkinDate) {
                checkoutInput.value = minCheckout.toISOString().split('T')[0];
            }
            checkoutInput.min = minCheckout.toISOString().split('T')[0];
        });
    }
    
    searchInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.search-segment').style.backgroundColor = '#f7f7f7';
        });
        
        input.addEventListener('blur', function() {
            this.closest('.search-segment').style.backgroundColor = 'transparent';
        });
    });
    
    // Filter button functionality
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            console.log('Filter button clicked - opening filters');
            // Here you can add logic to open a filter modal or sidebar
        });
    }
    
    // Toggle switch functionality
    const taxToggle = document.getElementById('tax-toggle');
    if (taxToggle) {
        taxToggle.addEventListener('change', function() {
            console.log('Tax toggle changed:', this.checked);
            // Here you can add logic to update pricing display
        });
    }
    
    // Responsive navbar functionality
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                if (navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            }
        });
    }
    
    // Add smooth scrolling for category list on touch devices
    if (categoryList) {
        let isScrolling = false;
        let startX = 0;
        let scrollLeft = 0;
        
        categoryList.addEventListener('touchstart', function(e) {
            isScrolling = true;
            startX = e.touches[0].pageX - categoryList.offsetLeft;
            scrollLeft = categoryList.scrollLeft;
        });
        
        categoryList.addEventListener('touchmove', function(e) {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - categoryList.offsetLeft;
            const walk = (x - startX) * 2;
            categoryList.scrollLeft = scrollLeft - walk;
        });
        
        categoryList.addEventListener('touchend', function() {
            isScrolling = false;
        });
    }
    
    // Map View Functionality
    const listViewBtn = document.getElementById('list-view-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const listView = document.getElementById('list-view');
    const mapView = document.getElementById('map-view');
    const mapContainer = document.getElementById('map');
    
    if (listViewBtn && mapViewBtn && listView && mapView) {
        let map = null;
        
        // List View Button
        listViewBtn.addEventListener('click', function() {
            listViewBtn.classList.add('active');
            mapViewBtn.classList.remove('active');
            listView.style.display = 'block';
            mapView.style.display = 'none';
        });
        
        // Map View Button
        mapViewBtn.addEventListener('click', function() {
            mapViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            listView.style.display = 'none';
            mapView.style.display = 'block';
            
            // Initialize map if not already done
            if (!map) {
                initializeMap();
            }
        });
        
        function initializeMap() {
            // Get listings data from the page
            const listings = [];
            const listingCards = document.querySelectorAll('.listing-card');
            
            listingCards.forEach(card => {
                const link = card.closest('.listing-link');
                const id = link.href.split('/').pop();
                const title = card.querySelector('.card-text b').textContent;
                const price = card.querySelector('.card-text').textContent.match(/₹\s*([\d,]+)/)?.[1] || '';
                const image = card.querySelector('.card-img-top').src;
                const lat = card.dataset.lat;
                const lng = card.dataset.lng;
                
                listings.push({ id, title, price, image, lat, lng });
            });
            
            // Initialize Leaflet map with center of India as fallback
            const defaultCenter = [20.5937, 78.9629]; // Center of India
            map = L.map('map').setView(defaultCenter, 5);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Add markers for each listing using actual coordinates
            const markers = [];
            listings.forEach((listing, index) => {
                // Use actual coordinates if available, otherwise skip
                if (!listing.lat || !listing.lng) return;
                
                const lat = parseFloat(listing.lat);
                const lng = parseFloat(listing.lng);
                
                // Skip invalid coordinates
                if (isNaN(lat) || isNaN(lng)) return;
                
                const marker = L.marker([lat, lng]).addTo(map);
                markers.push(marker);
                
                const popupContent = `
                    <div style="width: 200px;">
                        <img src="${listing.image}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
                        <h6 style="margin: 0 0 4px 0;">${listing.title}</h6>
                        <p style="margin: 0 0 8px 0; color: #666;">₹${listing.price}</p>
                        <a href="/listings/${listing.id}" class="btn btn-sm btn-primary">View Details</a>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
            });
            
            // If we have markers, create a bounds object and fit the map to it
            if (markers.length > 0) {
                const bounds = L.featureGroup(markers).getBounds();
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }
});

// Existing functionality (if any) can be added here