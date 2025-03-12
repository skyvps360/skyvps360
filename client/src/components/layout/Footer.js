import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">SkyVPS360</h3>
            <p className="text-gray-300">
              Cloud VPS management platform powered by Jelastic PaaS
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/deployments" className="text-gray-300 hover:text-white">
                  Deployments
                </Link>
              </li>
              <li>
                <Link to="/billing" className="text-gray-300 hover:text-white">
                  Billing
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-300 hover:text-white">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/docs"
                  className="text-gray-300 hover:text-white"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/api-docs"
                  className="text-gray-300 hover:text-white"
                >
                  API Reference
                </a>
              </li>
              <li>
                <Link to="/status" className="text-gray-300 hover:text-white">
                  System Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="text-gray-300 hover:text-white">
                  Contact Support
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@skyvps360.com"
                  className="text-gray-300 hover:text-white"
                >
                  support@skyvps360.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300">
              © {year} SkyVPS360. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 space-x-4">
              <Link to="/privacy" className="text-gray-300 hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-300 hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;