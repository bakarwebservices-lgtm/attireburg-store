/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevents the browser from MIME-sniffing the response away from the declared Content-Type
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Blocks the page from being embedded in iframes (clickjacking protection)
          { key: 'X-Frame-Options', value: 'DENY' },

          // Forces HTTPS for 2 years; includes subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

          // Controls how much referrer info is included with requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Restricts access to browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },

          // Content Security Policy
          // - default-src 'self': only load resources from same origin
          // - script-src: allow self + Google Pay + Google Identity + inline scripts Next.js needs
          // - style-src: allow self + inline styles (needed by Next.js)
          // - img-src: allow self, data URIs, Supabase, Unsplash, placeholder
          // - connect-src: allow API calls to Google, PayPal, Supabase
          // - frame-ancestors 'none': same as X-Frame-Options DENY
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pay.google.com https://accounts.google.com https://www.paypal.com https://www.sandbox.paypal.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://via.placeholder.com https://www.paypalobjects.com",
              "connect-src 'self' https://*.supabase.co https://www.googleapis.com https://accounts.google.com https://api.paypal.com https://api.sandbox.paypal.com https://www.paypal.com",
              "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://pay.google.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig