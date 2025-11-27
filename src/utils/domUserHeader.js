/**
 * DOM-based User Header
 * Creates a persistent header using HTML/CSS that stays on top of the game canvas
 */

// Create and inject header styles
const headerStyles = `
  #user-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    background: linear-gradient(180deg, rgba(10, 15, 30, 0.95) 0%, rgba(10, 15, 30, 0.85) 100%);
    border-bottom: 2px solid rgba(0, 242, 254, 0.5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 10000;
    font-family: 'Rajdhani', sans-serif;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }

  #user-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  #user-header-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(0, 242, 254, 0.3) 0%, rgba(138, 43, 226, 0.3) 100%);
    border: 2px solid #00f2fe;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    color: #00f2fe;
  }

  #user-header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  #user-header-name {
    font-size: 14px;
    font-weight: bold;
    color: #ffffff;
    line-height: 1;
  }

  #user-header-username {
    font-size: 11px;
    color: #ffd700;
    line-height: 1;
  }

  #user-header-fid {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: bold;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    #user-header {
      padding: 0 10px;
    }
    
    #user-header-name {
      font-size: 12px;
    }
    
    #user-header-username {
      font-size: 10px;
    }
    
    #user-header-fid {
      font-size: 11px;
    }
  }
`;

/**
 * Initialize the DOM-based user header
 */
export async function initUserHeader() {
    try {
        // Inject styles
        const styleElement = document.createElement('style');
        styleElement.textContent = headerStyles;
        document.head.appendChild(styleElement);

        // Create header container
        const header = document.createElement('div');
        header.id = 'user-header';

        // Left side (avatar + user info)
        const leftSide = document.createElement('div');
        leftSide.id = 'user-header-left';

        const avatar = document.createElement('div');
        avatar.id = 'user-header-avatar';
        avatar.textContent = '?';

        const userInfo = document.createElement('div');
        userInfo.id = 'user-header-info';

        const userName = document.createElement('div');
        userName.id = 'user-header-name';
        userName.textContent = 'Loading...';

        const userUsername = document.createElement('div');
        userUsername.id = 'user-header-username';
        userUsername.textContent = '';

        userInfo.appendChild(userName);
        userInfo.appendChild(userUsername);

        leftSide.appendChild(avatar);
        leftSide.appendChild(userInfo);

        // Right side (FID)
        const fidBadge = document.createElement('div');
        fidBadge.id = 'user-header-fid';
        fidBadge.textContent = '';

        header.appendChild(leftSide);
        header.appendChild(fidBadge);

        // Add to body
        document.body.appendChild(header);

        // Load user data
        await loadUserData();

        console.log('✅ DOM User Header initialized');
    } catch (error) {
        console.error('Error initializing user header:', error);
    }
}

/**
 * Load and display user data
 */
async function loadUserData() {
    try {
        // Get Farcaster user info
        const getFarcasterUser = window.getFarcasterUser;
        if (!getFarcasterUser) {
            console.log('getFarcasterUser not available, will retry...');
            // Retry after a delay
            setTimeout(loadUserData, 1000);
            return;
        }

        const user = await getFarcasterUser();
        if (!user || !user.fid) {
            console.log('No user data available');
            // Hide header if no user
            const header = document.getElementById('user-header');
            if (header) {
                header.style.display = 'none';
            }
            return;
        }

        // Update avatar
        const avatar = document.getElementById('user-header-avatar');
        if (avatar) {
            const initial = (user.displayName || user.username || 'U').charAt(0).toUpperCase();
            avatar.textContent = initial;
        }

        // Update name
        const userName = document.getElementById('user-header-name');
        if (userName) {
            userName.textContent = user.displayName || user.username || `User ${user.fid}`;
        }

        // Update username (if different from displayName)
        const userUsername = document.getElementById('user-header-username');
        if (userUsername) {
            const displayName = user.displayName || user.username;
            if (user.username && user.username !== displayName) {
                userUsername.textContent = `@${user.username}`;
            }
        }

        // Update FID
        const fidBadge = document.getElementById('user-header-fid');
        if (fidBadge) {
            fidBadge.textContent = `FID: ${user.fid}`;
        }

        console.log('✅ User data loaded:', user);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Remove the user header
 */
export function removeUserHeader() {
    const header = document.getElementById('user-header');
    if (header) {
        header.remove();
    }
}
