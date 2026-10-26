// Curated collection of high-resolution, aesthetic wallpapers
const WALLPAPERS = [
  {
    id: "tokyo-night",
    name: "Tokyo Tower Night Skyline",
    category: "city",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Pawel Nolbert on Unsplash"
  },
  {
    id: "shibuya-night",
    name: "Shibuya Cyberpunk Rain",
    category: "city",
    url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Clay Banks on Unsplash"
  },
  {
    id: "nyc-manhattan",
    name: "Manhattan Blue Hour Skyline",
    category: "city",
    url: "https://images.unsplash.com/photo-1496868834840-5f4c98840aaa?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1496868834840-5f4c98840aaa?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Jonathan Riley on Unsplash"
  },
  {
    id: "fuji-dusk",
    name: "Mount Fuji at Twilight",
    category: "nature",
    url: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Manuel Cosentino on Unsplash"
  },
  {
    id: "swiss-alps",
    name: "Swiss Alpine Lake & Peaks",
    category: "nature",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Bailey Zindel on Unsplash"
  },
  {
    id: "aurora-borealis",
    name: "Lofoten Northern Lights",
    category: "nature",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Vincent Guth on Unsplash"
  },
  {
    id: "misty-forest",
    name: "Evergreen Fog Forest",
    category: "nature",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Sebastian Unrau on Unsplash"
  },
  {
    id: "kyoto-temple",
    name: "Kyoto Golden Hour",
    category: "city",
    url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Sorasak on Unsplash"
  },
  {
    id: "starry-night",
    name: "Cosmic Milky Way Galaxy",
    category: "minimal",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Lucas Pezeta on Unsplash"
  },
  {
    id: "minimal-dunes",
    name: "Sunset Desert Dunes",
    category: "minimal",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Jeremy Bishop on Unsplash"
  },
  {
    id: "cyberpunk-hongkong",
    name: "Hong Kong Neon Reflections",
    category: "city",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Simon Zhu on Unsplash"
  },
  {
    id: "dolomites-lake",
    name: "Dolomites Lago di Braies",
    category: "nature",
    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=3840&q=95",
    thumb: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=70",
    credit: "Photo by Luca Bravo on Unsplash"
  }
];

class BackgroundManager {
  constructor() {
    this.bgContainer = document.getElementById("bg-container");
    this.bgCredit = document.getElementById("bg-credit");
    this.currentIdx = 0;
    this.mode = localStorage.getItem("aura_bg_mode") || "rotate_every_tab"; // rotate_every_tab | fixed
  }

  init() {
    const customUrl = localStorage.getItem("aura_custom_bg_url");
    if (customUrl) {
      this.applyBackgroundUrl(customUrl, "Custom Wallpaper");
      return;
    }

    // Get current index and rotate to next one for every new tab
    let lastIdx = parseInt(localStorage.getItem("aura_last_bg_idx") ?? "-1", 10);
    this.currentIdx = (lastIdx + 1) % WALLPAPERS.length;
    localStorage.setItem("aura_last_bg_idx", this.currentIdx.toString());

    this.applyWallpaper(WALLPAPERS[this.currentIdx]);
  }

  nextWallpaper() {
    this.currentIdx = (this.currentIdx + 1) % WALLPAPERS.length;
    localStorage.setItem("aura_last_bg_idx", this.currentIdx.toString());
    this.applyWallpaper(WALLPAPERS[this.currentIdx]);
  }

  prevWallpaper() {
    this.currentIdx = (this.currentIdx - 1 + WALLPAPERS.length) % WALLPAPERS.length;
    localStorage.setItem("aura_last_bg_idx", this.currentIdx.toString());
    this.applyWallpaper(WALLPAPERS[this.currentIdx]);
  }

  applyWallpaper(wallpaper) {
    if (!wallpaper) return;
    this.applyBackgroundUrl(wallpaper.url, wallpaper.name, wallpaper.credit);
  }

  applyBackgroundUrl(url, name, credit = "") {
    if (!this.bgContainer) return;

    // Create image preload for smooth crossfade
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.bgContainer.style.backgroundImage = `url("${url}")`;
      this.bgContainer.classList.add("loaded");
      if (this.bgCredit) {
        this.bgCredit.textContent = credit || name || "";
      }
    };
    img.onerror = () => {
      // Fallback in case network fails
      this.bgContainer.style.backgroundImage = `linear-gradient(135deg, #090e17 0%, #17243c 50%, #0d131f 100%)`;
      this.bgContainer.classList.add("loaded");
      if (this.bgCredit) {
        this.bgCredit.textContent = "Offline Gradient Mode";
      }
    };
  }
}

window.bgManager = new BackgroundManager();
