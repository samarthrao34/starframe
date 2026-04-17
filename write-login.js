const fs = require('fs');
const content = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login - StarFrame Animation Studio</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" />
    <style>
      :root {
        --primary-warm: #d4a574;
        --primary-dark: #b8935f;
        --text-dark: #3c3c3c;
        --text-medium: #666666;
        --text-light: #999999;
        --background-cream: #fefcf8;
        --white: #ffffff;
        --shadow-soft: 0 8px 30px rgba(0, 0, 0, 0.05);
      }

      body {
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--background-cream);
        font-family: "Inter", sans-serif;
        overflow: hidden;
      }

      .btn-back-home {
        position: absolute;
        top: 2rem;
        left: 2rem;
        padding: 12px 24px;
        border-radius: 50px;
        text-decoration: none;
        color: var(--text-dark);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--white);
        box-shadow: var(--shadow-soft);
        border: 1px solid rgba(212, 165, 116, 0.2);
        transition: all 0.3s ease;
        z-index: 20;
      }
      .btn-back-home:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(212, 165, 116, 0.15);
      }

      .login-wrapper {
        width: 100%;
        max-width: 420px;
        padding: 40px;
        border-radius: 20px;
        background: var(--white);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        text-align: center;
        z-index: 10;
        animation: fadeInUp 0.6s ease-out;
      }

      @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
      }

      .brand-logo {
        margin-bottom: 30px;
      }
      .brand-logo h1 {
        font-family: 'Playfair Display', serif;
        color: var(--primary-dark);
        font-size: 2.2rem;
        margin: 0;
      }
      .brand-logo p {
        color: var(--text-medium);
        font-size: 0.95rem;
        margin-top: 5px;
      }

      .form-group {
        margin-bottom: 22px;
        text-align: left;
      }
      .form-group label {
        display: block;
        color: var(--text-dark);
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 10px;
        margin-left: 5px;
      }
      .login-input {
        width: 100%;
        padding: 14px 20px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        background: var(--background-cream);
        color: var(--text-dark);
        font-size: 0.95rem;
        outline: none;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }
      .login-input:focus {
        border-color: var(--primary-warm);
        box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.1);
      }

      .login-btn {
        width: 100%;
        padding: 14px;
        margin-top: 10px;
        border: none;
        border-radius: 8px;
        background: var(--primary-dark);
        color: var(--white);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
      }
      .login-btn:hover {
        background: var(--primary-warm);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(184, 147, 95, 0.3);
      }
      .login-btn:active {
        transform: translateY(0);
      }

      .google-btn {
        background: var(--white);
        color: var(--text-dark);
        border: 1px solid rgba(0, 0, 0, 0.1);
        margin-top: 20px;
      }
      .google-btn:hover {
        background: #f8f9fa;
        border-color: rgba(0, 0, 0, 0.2);
      }

      .divider {
        display: flex;
        align-items: center;
        margin: 25px 0;
        color: var(--text-light);
        font-size: 0.85rem;
      }
      .divider::before, .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(0, 0, 0, 0.1);
        margin: 0 15px;
      }

      .login-footer {
        margin-top: 25px;
        font-size: 0.9rem;
        color: var(--text-medium);
      }
      .login-footer a {
        color: var(--primary-dark);
        text-decoration: none;
        font-weight: 600;
      }

      .bg-decoration {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: -1;
          overflow: hidden;
      }
      .circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212, 165, 116, 0.1) 0%, transparent 70%);
      }
      .circle-1 { width: 600px; height: 600px; top: -200px; right: -100px; }
      .circle-2 { width: 800px; height: 800px; bottom: -300px; left: -200px; }

      .back-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 50%;
        background: var(--primary-warm);
        color: white;
        font-size: 1.2rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="bg-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
    </div>

    <a href="/" class="btn-back-home">
      <i class="fas fa-arrow-left"></i> Home
    </a>

    <div class="login-wrapper">
      <div class="brand-logo">
        <img src="logo.png" alt="StarFrame Logo" width="80" style="margin-bottom: 10px;">
        <h1>StarFrame</h1>
        <p>Welcome back to your studio</p>
      </div>

      <form id="loginForm" method="POST" action="/api/auth/login">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" name="email" class="login-input" placeholder="hello@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" name="password" class="login-input" placeholder="••••••••" required />
        </div>

        <button type="submit" class="login-btn">
          Sign In
        </button>
      </form>

      <div class="divider">OR</div>

      <button class="login-btn google-btn">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20"> Continue with Google
      </button>

      <div class="login-footer">
        Don't have an account? <a href="#">Sign up</a>
      </div>
    </div>

    <!-- Back to Top Button -->
    <button id="backToTop" class="back-to-top" aria-label="Back to top">
      <i class="fas fa-arrow-up"></i>
    </button>
    <script>
        const backToTopBtn = document.getElementById("backToTop");
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add("visible");
                backToTopBtn.style.opacity = "1";
                backToTopBtn.style.visibility = "visible";
            } else {
                backToTopBtn.classList.remove("visible");
                backToTopBtn.style.opacity = "0";
                backToTopBtn.style.visibility = "hidden";
            }
        });
    </script>
  </body>
</html>`;

fs.writeFileSync('login.html', content);
console.log('Rewrote login.html successfully.');
