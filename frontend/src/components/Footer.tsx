import { Code2 } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border/10 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Code2 className="h-6 w-6 text-primary" />
              <span className="font-heading text-lg font-bold text-secondary-foreground">
                Dev<span className="text-primary">link</span>
              </span>
            </Link>
            <p className="text-secondary-foreground/50 text-sm leading-relaxed">
              The global talent marketplace connecting world-class developers with innovative companies.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-secondary-foreground mb-4 text-sm">For Developers</h4>
            <ul className="space-y-2.5">
              <li><Link to="/jobs" className="text-sm text-secondary-foreground/50 hover:text-primary transition-colors">Browse Jobs</Link></li>
              <li><Link to="/showcase" className="text-sm text-secondary-foreground/50 hover:text-primary transition-colors">Showcase</Link></li>
              <li><Link to="/register" className="text-sm text-secondary-foreground/50 hover:text-primary transition-colors">Create Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-secondary-foreground mb-4 text-sm">For Employers</h4>
            <ul className="space-y-2.5">
              <li><Link to="/developers" className="text-sm text-secondary-foreground/50 hover:text-primary transition-colors">Find Talent</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-secondary-foreground mb-4 text-sm">About Devlink</h4>
            <p className="text-sm text-secondary-foreground/50 leading-relaxed">
              Devlink is Africa's premier tech talent marketplace — built to connect skilled software developers
              with companies across the continent and beyond. Our mission is to make quality tech talent
              accessible, secure payments through milestone-based escrow contracts, and give African developers
              a global stage to showcase their work.
            </p>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary-foreground/40">
            © 2026 Devlink. All rights reserved.
          </p>
          <p className="text-xs text-secondary-foreground/40 text-center">
            Developed by <span className="text-primary font-medium">Vector Labs</span> · 011 748 7554
          </p>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
